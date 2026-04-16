import logging

class SignalDetector:
    """Gerencia a lógica de decisão baseada em pontuação de múltiplos indicadores."""
    
    def __init__(self, symbol, settings):
        self.symbol = symbol
        self.settings = settings
        self.logger = logging.getLogger("SignalDetector")
        
    def evaluate_tf(self, price, data):
        """Avalia todos os filtros para um único timeframe. Retorna (score, type)."""
        score = 0
        signal_type = None # 'BUY' ou 'SELL'
        
        filters = self.settings.get("filters", {})
        
        # 1. Determina direção baseada no preço vs bandas ou RSI
        if data['rsi'] > 50:
            signal_type = "SELL"
        else:
            signal_type = "BUY"

        # --- FILTRO 1: Bollinger Bands ---
        if filters.get("bollinger"):
            if signal_type == "SELL" and price > data['bb_upper']:
                score += 1
            elif signal_type == "BUY" and price < data['bb_lower']:
                score += 1
                
        # --- FILTRO 2: RSI ---
        if filters.get("rsi"):
            if signal_type == "SELL" and data['rsi'] > 70:
                score += 1
            elif signal_type == "BUY" and data['rsi'] < 30:
                score += 1

        # --- FILTRO 3: Pin Bar (Rejeição) ---
        if filters.get("pinbar"):
            if signal_type == "SELL" and data['pinbar'] == "BEARISH":
                score += 1
            elif signal_type == "BUY" and data['pinbar'] == "BULLISH":
                score += 1

        # --- FILTRO 4: Estocástico ---
        if filters.get("stochastic"):
            if signal_type == "SELL" and data['stoch_k'] > 80:
                score += 1
            elif signal_type == "BUY" and data['stoch_k'] < 20:
                score += 1

        # --- FILTRO 5: Volume ---
        if filters.get("volume"):
            if data['volume'] > data['avg_volume']:
                score += 1

        return score, signal_type

    def check_sr_touch(self, price, levels, tolerance_points=10):
        """Verifica se o preço está na zona de um pavio semanal."""
        tolerance = tolerance_points / 100000.0
        for level in levels:
            if abs(price - level) <= tolerance:
                return True
        return False

    def get_signal(self, current_price, levels, indicators):
        """Coordena a 'votação' entre todos os indicadores e TFs."""
        logic = self.settings # Recebe a seção 'signal_logic' do settings
        filters = logic.get("filters", {})
        active_filter_count = sum(1 for v in filters.values() if v)
        
        timeframes = ["M5", "M15"] # Poderia vir do analysis settings
        tf_results = {}
        
        for tf in timeframes:
            if tf in indicators:
                score, s_type = self.evaluate_tf(current_price, indicators[tf])
                tf_results[tf] = {"score": score, "type": s_type}
        
        # Lógica de Decisão Baseada no Modo
        final_signal = None
        mode = logic.get("mode", "MIN_COUNT")
        min_conf = logic.get("min_confirmations", 3)
        
        # Verificamos se M5 e M15 concordam
        m5 = tf_results.get("M5")
        m15 = tf_results.get("M15")
        
        if not m5 or not m15: return None
        
        # Só prossegue se ambos tiverem a mesma direção
        if m5['type'] != m15['type']: return None
        
        # Validação do Quórum
        valid_m5 = False
        valid_m15 = False
        
        if mode == "ALL":
            valid_m5 = m5['score'] == active_filter_count
            valid_m15 = m15['score'] == active_filter_count
        else: # MIN_COUNT
            valid_m5 = m5['score'] >= min_conf
            valid_m15 = m15['score'] >= min_conf
            
        if valid_m5 and valid_m15:
            final_signal = m5['type']
            
        if not final_signal:
            return None
            
        # O ÚLTIMO FILTRO: Toque no nível de 10 anos
        if self.check_sr_touch(current_price, levels):
            self.logger.info(f"SINAL MODULAR: {final_signal} em {current_price:.5f} | Score M5: {m5['score']}, M15: {m15['score']}")
            return final_signal
            
        return None
