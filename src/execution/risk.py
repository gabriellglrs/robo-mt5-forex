import logging

import MetaTrader5 as mt5


class RiskManager:
    """Gerencia calculos de risco, lote e posicionamento de stops."""

    def __init__(self, symbol, settings):
        self.symbol = symbol
        self.settings = settings
        self.logger = logging.getLogger("RiskManager")
        self.symbol_info = mt5.symbol_info(symbol)

    def _clamp_volume(self, raw_volume):
        info = self.symbol_info
        if info is None:
            return float(self.settings.get("fixed_lot", 0.01))

        vol_min = float(info.volume_min) if info.volume_min else 0.01
        vol_max = float(info.volume_max) if info.volume_max else 100.0
        vol_step = float(info.volume_step) if info.volume_step else 0.01

        volume = max(vol_min, min(float(raw_volume), vol_max))
        steps = round((volume - vol_min) / vol_step)
        normalized = vol_min + (steps * vol_step)
        return round(float(normalized), 2)

    def calculate_lot(self, sl_price_distance):
        """Calcula lote por modo fixo ou por risco percentual real."""
        mode = str(self.settings.get("lot_mode", "fixed")).lower()
        fixed_lot = float(self.settings.get("fixed_lot", 0.01))

        if mode == "fixed":
            return self._clamp_volume(fixed_lot)

        if mode != "risk_percent":
            return self._clamp_volume(fixed_lot)

        if self.symbol_info is None:
            return self._clamp_volume(fixed_lot)

        account = mt5.account_info()
        if account is None:
            self.logger.warning("Nao foi possivel ler account_info(). Usando lote fixo.")
            return self._clamp_volume(fixed_lot)

        max_risk_cap = float(self.settings.get("risk_max_per_trade_percent", 3.0))
        cfg_risk = float(self.settings.get("risk_percentage", 1.0))
        risk_pct = max(0.01, min(cfg_risk, max_risk_cap))

        if sl_price_distance is None or float(sl_price_distance) <= 0:
            self.logger.warning("Distancia de SL invalida para calculo de risco. Usando lote fixo.")
            return self._clamp_volume(fixed_lot)

        tick_value = float(self.symbol_info.trade_tick_value) if self.symbol_info.trade_tick_value else 0.0
        tick_size = float(self.symbol_info.trade_tick_size) if self.symbol_info.trade_tick_size else 0.0
        if tick_value <= 0 or tick_size <= 0:
            self.logger.warning("Tick value/size invalido para calculo de risco. Usando lote fixo.")
            return self._clamp_volume(fixed_lot)

        risk_amount = float(account.balance) * (risk_pct / 100.0)
        value_per_lot_per_price = tick_value / tick_size
        loss_per_lot = float(sl_price_distance) * value_per_lot_per_price

        if loss_per_lot <= 0:
            return self._clamp_volume(fixed_lot)

        volume = risk_amount / loss_per_lot
        if volume <= 0:
            return self._clamp_volume(fixed_lot)

        return self._clamp_volume(volume)

    def calculate_prices(self, signal_type, entry_price, levels=None, signal_details=None):
        """Calcula precos de SL e TP baseados nas configuracoes."""
        mode = str(self.settings.get("sl_tp_mode", "fixed")).lower()
        sl_points = int(self.settings.get("sl_points", 300))
        tp_points = int(self.settings.get("tp_points", 600))

        point = self.symbol_info.point if self.symbol_info and self.symbol_info.point else 0.00001
        details = signal_details or {}

        if mode == "fimathe":
            stop_buffer_points = int(self.settings.get("fimathe_stop_buffer_points", 15))
            target_level = str(self.settings.get("fimathe_target_level", "80"))

            point_a = details.get("point_a")
            point_b = details.get("point_b")
            proj_50 = details.get("projection_50")
            proj_80 = details.get("projection_80")
            proj_85 = details.get("projection_85")
            proj_90 = details.get("projection_90")
            proj_95 = details.get("projection_95")
            proj_100 = details.get("projection_100")

            targets = {
                "50": proj_50,
                "80": proj_80,
                "85": proj_85,
                "90": proj_90,
                "95": proj_95,
                "100": proj_100,
            }
            selected_target = targets.get(target_level)

            if signal_type == "BUY":
                # Fimathe STI: Abaixo da Zona Neutra (que e o ponto_b no engine atual quando em rompimento)
                structural_floor = point_b if point_b is not None else (entry_price - (sl_points * point))
                sl_price = float(structural_floor) - (stop_buffer_points * point)

                if selected_target is not None:
                    tp_price = float(selected_target)
                else:
                    tp_price = float(proj_80) if proj_80 is not None else (entry_price + (tp_points * point))
            else:
                # SELL STI: Acima da Zona Neutra (ponto_a)
                structural_ceiling = point_a if point_a is not None else (entry_price + (sl_points * point))
                sl_price = float(structural_ceiling) + (stop_buffer_points * point)

                if selected_target is not None:
                    tp_price = float(selected_target)
                else:
                    tp_price = float(proj_80) if proj_80 is not None else (entry_price - (tp_points * point))

            return float(sl_price), float(tp_price)

        if signal_type == "BUY":
            sl_price = entry_price - (sl_points * point)
            tp_price = entry_price + (tp_points * point)

            if mode == "dynamic" and levels:
                closest_level = max([l for l in levels if l < entry_price], default=sl_price)
                sl_price = closest_level - (50 * point)

        else:  # SELL
            sl_price = entry_price + (sl_points * point)
            tp_price = entry_price - (tp_points * point)

            if mode == "dynamic" and levels:
                closest_level = min([l for l in levels if l > entry_price], default=sl_price)
                sl_price = closest_level + (50 * point)

        return float(sl_price), float(tp_price)
