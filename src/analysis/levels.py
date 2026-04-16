import logging

import MetaTrader5 as mt5
import numpy as np
import pandas as pd


STRATEGY_FIMATHE = "fimathe"


class LevelDetector:
    """Detecta niveis de negociacao usando somente a estrategia Fimathe."""

    def __init__(self, symbol, history_years=10, wick_sensitivity=0.3):
        self.symbol = symbol
        self.history_years = history_years
        self.wick_sensitivity = wick_sensitivity
        self.logger = logging.getLogger("LevelDetector")

    def fetch_weekly_data(self):
        """Busca dados semanais (W1) do MT5."""
        count = self.history_years * 52
        rates = mt5.copy_rates_from_pos(self.symbol, mt5.TIMEFRAME_W1, 0, count)

        if rates is None or len(rates) == 0:
            self.logger.error(f"Erro ao baixar dados para {self.symbol}: {mt5.last_error()}")
            return None

        df = pd.DataFrame(rates)
        df["time"] = pd.to_datetime(df["time"], unit="s")
        return df

    def find_fimathe_pivots(self, df):
        """Identifica topos/fundos locais usados como base da Fimathe."""
        pivots = []
        highs = df["high"].values
        lows = df["low"].values

        for i in range(2, len(df) - 2):
            if highs[i] > highs[i - 1] and highs[i] > highs[i - 2] and highs[i] > highs[i + 1] and highs[i] > highs[i + 2]:
                pivots.append(highs[i])

            if lows[i] < lows[i - 1] and lows[i] < lows[i - 2] and lows[i] < lows[i + 1] and lows[i] < lows[i + 2]:
                pivots.append(lows[i])

        return np.array(pivots).reshape(-1, 1)

    def _get_min_gap(self):
        symbol_info = mt5.symbol_info(self.symbol)
        point = symbol_info.point if symbol_info and symbol_info.point else 0.00001
        sensitivity_factor = max(1.0, float(self.wick_sensitivity) * 10.0)
        return point * (10.0 * sensitivity_factor)

    def get_levels_fimathe(self, df, current_price, range_pct=0.10):
        """Retorna niveis proximos ao preco para as regioes de negociacao da Fimathe."""
        pivots = self.find_fimathe_pivots(df)
        if len(pivots) == 0:
            return []

        lower_bound = current_price * (1 - range_pct)
        upper_bound = current_price * (1 + range_pct)
        filtered_pivots = pivots[(pivots >= lower_bound) & (pivots <= upper_bound)]

        if len(filtered_pivots) == 0:
            filtered_pivots = pivots

        min_gap = self._get_min_gap()
        unique_pivots = []
        sorted_pivots = np.sort(filtered_pivots.flatten())

        for pivot in sorted_pivots:
            if not unique_pivots or abs(pivot - unique_pivots[-1]) > min_gap:
                unique_pivots.append(float(pivot))

        return sorted(unique_pivots, reverse=True)

    def get_levels(self, mode=STRATEGY_FIMATHE, n_clusters=None):
        """Mantem compatibilidade de assinatura, mas opera apenas em modo Fimathe."""
        if mode != STRATEGY_FIMATHE:
            self.logger.warning(
                f"Modo '{mode}' ignorado. Estrategia fixa em '{STRATEGY_FIMATHE}'."
            )

        df = self.fetch_weekly_data()
        if df is None:
            return []

        current_tick = mt5.symbol_info_tick(self.symbol)
        if current_tick is None:
            self.logger.error(f"Erro ao pegar preco atual de {self.symbol}")
            return []

        current_price = current_tick.bid if current_tick.last == 0 else current_tick.last
        return self.get_levels_fimathe(df, current_price)


if __name__ == "__main__":
    import os
    import sys

    from core.connection import MT5Connection

    sys.path.append(os.path.join(os.getcwd(), "src"))

    conn = MT5Connection()
    if conn.connect():
        detector = LevelDetector("EURUSD")
        print("\n--- TESTE: ESTRATEGIA FIMATHE ---")
        levels = detector.get_levels(mode=STRATEGY_FIMATHE)
        for level in levels[:10]:
            print(f"Nivel detectado: {level:.5f}")
        conn.disconnect()
