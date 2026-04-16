import MetaTrader5 as mt5
import pandas as pd
import numpy as np
import logging

class IndicatorManager:
    """Gerencia o cálculo de indicadores técnicos avançados."""
    
    def __init__(self, symbol):
        self.symbol = symbol
        self.logger = logging.getLogger("IndicatorManager")
        
    def get_timeframe_code(self, tf_string):
        mapping = {
            "M1": mt5.TIMEFRAME_M1,
            "M5": mt5.TIMEFRAME_M5,
            "M15": mt5.TIMEFRAME_M15,
            "M30": mt5.TIMEFRAME_M30,
            "H1": mt5.TIMEFRAME_H1
        }
        return mapping.get(tf_string, mt5.TIMEFRAME_M5)

    def calculate_bollinger_bands(self, df, period=20, deviation=2.0):
        """Calcula BB no Open."""
        df['sma'] = df['open'].rolling(window=period).mean()
        df['std'] = df['open'].rolling(window=period).std()
        df['upper'] = df['sma'] + (df['std'] * deviation)
        df['lower'] = df['sma'] - (df['std'] * deviation)
        return df

    def calculate_rsi(self, df, period=14):
        """Calcula RSI (IFR)."""
        delta = df['close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        df['rsi'] = 100 - (100 / (1 + rs))
        return df

    def calculate_stochastic(self, df, k_period=14, d_period=3):
        """Calcula Estocástico."""
        low_min = df['low'].rolling(window=k_period).min()
        high_max = df['high'].rolling(window=k_period).max()
        df['stoch_k'] = 100 * ((df['close'] - low_min) / (high_max - low_min))
        df['stoch_d'] = df['stoch_k'].rolling(window=d_period).mean()
        return df

    def detect_pinbar(self, row):
        """Detecta se uma vela é um Pin Bar (Martelo/Doji)."""
        body = abs(row['open'] - row['close'])
        total_range = row['high'] - row['low']
        if total_range == 0: return False
        
        upper_wick = row['high'] - max(row['open'], row['close'])
        lower_wick = min(row['open'], row['close']) - row['low']
        
        # Bullish Pin Bar (Pavio inferior longo)
        if lower_wick > (2 * body) and lower_wick > (2 * upper_wick):
            return "BULLISH"
        # Bearish Pin Bar (Pavio superior longo)
        if upper_wick > (2 * body) and upper_wick > (2 * lower_wick):
            return "BEARISH"
            
        return None

    def get_all_indicators(self, timeframes):
        """Coleta todos os indicadores para os TFs configurados."""
        results = {}
        for tf_str in timeframes:
            tf = self.get_timeframe_code(tf_str)
            rates = mt5.copy_rates_from_pos(self.symbol, tf, 0, 40) # 40 velas para os períodos
            if rates is None or len(rates) < 20: continue
            
            df = pd.DataFrame(rates)
            df = self.calculate_bollinger_bands(df)
            df = self.calculate_rsi(df)
            df = self.calculate_stochastic(df)
            
            latest = df.iloc[-1]
            prev = df.iloc[-2] # Para padrões de candle já fechados
            
            results[tf_str] = {
                "price": float(latest['close']),
                "open": float(latest['open']),
                "bb_upper": float(latest['upper']),
                "bb_lower": float(latest['lower']),
                "rsi": float(latest['rsi']),
                "stoch_k": float(latest['stoch_k']),
                "stoch_d": float(latest['stoch_d']),
                "volume": int(latest['tick_volume']),
                "avg_volume": float(df['tick_volume'].tail(20).mean()),
                "pinbar": self.detect_pinbar(latest),
                "prev_pinbar": self.detect_pinbar(prev)
            }
        return results
