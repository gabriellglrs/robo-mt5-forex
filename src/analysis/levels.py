import MetaTrader5 as mt5
import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
import logging
import json

class LevelDetector:
    """Detecta níveis de Suporte e Resistência usando múltiplas estratégias."""
    
    def __init__(self, symbol, history_years=10):
        self.symbol = symbol
        self.history_years = history_years
        self.logger = logging.getLogger("LevelDetector")
        
    def fetch_weekly_data(self):
        """Busca dados semanais (W1) do MT5."""
        count = self.history_years * 52
        rates = mt5.copy_rates_from_pos(self.symbol, mt5.TIMEFRAME_W1, 0, count)
        
        if rates is None or len(rates) == 0:
            self.logger.error(f"Erro ao baixar dados para {self.symbol}: {mt5.last_error()}")
            return None
            
        df = pd.DataFrame(rates)
        df['time'] = pd.to_datetime(df['time'], unit='s')
        return df

    def find_pivots(self, df):
        """Identifica pontos de pivô (fractais) - topos e fundos locais."""
        pivots = []
        highs = df['high'].values
        lows = df['low'].values
        
        # Janela de 2 vizinhos para considerar um fractal (técnica clássica)
        for i in range(2, len(df) - 2):
            # Pivot de Alta (Pavio Superior Importante)
            if highs[i] > highs[i-1] and highs[i] > highs[i-2] and \
               highs[i] > highs[i+1] and highs[i] > highs[i+2]:
                pivots.append(highs[i])
                
            # Pivot de Baixa (Pavio Inferior Importante)
            if lows[i] < lows[i-1] and lows[i] < lows[i-2] and \
               lows[i] < lows[i+1] and lows[i] < lows[i+2]:
                pivots.append(lows[i])
                
        return np.array(pivots).reshape(-1, 1)

    def get_levels_fractal(self, df, current_price, range_pct=0.10):
        """Estratégia Técnica: Foca nos pivôs exatos perto do preço atual."""
        pivots = self.find_pivots(df)
        if len(pivots) == 0:
            return []
            
        # Filtro de Proximidade (+/- range_pct do preço atual)
        lower_bound = current_price * (1 - range_pct)
        upper_bound = current_price * (1 + range_pct)
        
        filtered_pivots = pivots[(pivots >= lower_bound) & (pivots <= upper_bound)]
        
        # Remove duplicatas muito próximas (menos de 10 pips)
        unique_pivots = []
        if len(filtered_pivots) > 0:
            sorted_pivots = np.sort(filtered_pivots.flatten())
            unique_pivots.append(sorted_pivots[0])
            for p in sorted_pivots[1:]:
                if p - unique_pivots[-1] > 0.0010: # 10 pips de distância mínima
                    unique_pivots.append(p)
                    
        return sorted(unique_pivots, reverse=True)

    def get_levels_statistical(self, df, n_clusters=20):
        """Estratégia Estatística: KMeans para encontrar zonas de densidade."""
        highs = df['high'].values
        lows = df['low'].values
        levels = np.concatenate([highs, lows]).reshape(-1, 1)
        
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        kmeans.fit(levels)
        
        centroids = kmeans.cluster_centers_.flatten()
        return sorted(centroids, reverse=True)

    def get_levels(self, mode='fractal', n_clusters=20):
        """Fluxo principal coordenado pelo modo escolhido."""
        df = self.fetch_weekly_data()
        if df is None:
            return []
            
        # Pega o preço atual para o filtro de proximidade (Bid/Ask para Forex)
        current_tick = mt5.symbol_info_tick(self.symbol)
        if current_tick is None:
            self.logger.error(f"Erro ao pegar preço atual de {self.symbol}")
            return []
        
        # No Forex, 'last' costuma ser 0. Usamos a média do Bid/Ask.
        current_price = current_tick.bid if current_tick.last == 0 else current_tick.last
        
        if mode == 'statistical':
            return self.get_levels_statistical(df, n_clusters)
        elif mode == 'fractal':
            return self.get_levels_fractal(df, current_price)
        elif mode == 'hybrid':
            l1 = self.get_levels_statistical(df, n_clusters // 2)
            l2 = self.get_levels_fractal(df, current_price)
            return sorted(list(set(l1 + l2)), reverse=True)
            
        return []

if __name__ == "__main__":
    import sys
    import os
    sys.path.append(os.path.join(os.getcwd(), "src"))
    from core.connection import MT5Connection
    
    conn = MT5Connection()
    if conn.connect():
        detector = LevelDetector("EURUSD")
        print("\n--- TESTE: ESTRATÉGIA FRACTAL (Técnica) ---")
        f_levels = detector.get_levels(mode='fractal')
        for lvl in f_levels[:10]:
            print(f"Pivô Detectado: {lvl:.5f}")
            
        print("\n--- TESTE: ESTRATÉGIA STATISTICAL (Zonas) ---")
        s_levels = detector.get_levels(mode='statistical')
        for lvl in s_levels[:10]:
            print(f"Zona Detectada: {lvl:.5f}")
            
        conn.disconnect()
