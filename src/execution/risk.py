import MetaTrader5 as mt5
import logging

class RiskManager:
    """Gerencia cálculos de risco, lote e posicionamento de stops."""
    
    def __init__(self, symbol, settings):
        self.symbol = symbol
        self.settings = settings
        self.logger = logging.getLogger("RiskManager")
        self.symbol_info = mt5.symbol_info(symbol)
        
    def calculate_lot(self, sl_points):
        """Calcula o lote baseado em % de risco ou lote fixo."""
        mode = self.settings.get("lot_mode", "fixed")
        fixed_lot = self.settings.get("fixed_lot", 0.01)
        
        if mode == "fixed":
            return fixed_lot
            
        # Lógica de % de Risco (Futuro: Implementação baseada em balance)
        # Por enquanto, retornamos o fixo para segurança inicial
        return fixed_lot

    def calculate_prices(self, signal_type, entry_price, levels=None):
        """Calcula preços de SL e TP baseados nas configurações."""
        mode = self.settings.get("sl_tp_mode", "fixed")
        sl_points = self.settings.get("sl_points", 300)
        tp_points = self.settings.get("tp_points", 600)
        
        point = self.symbol_info.point
        
        if signal_type == "BUY":
            sl_price = entry_price - (sl_points * point)
            tp_price = entry_price + (tp_points * point)
            
            # Ajuste Dinâmico se houver níveis e modo for dinâmico
            if mode == "dynamic" and levels:
                # Procura o nível mais próximo abaixo do preço
                closest_level = max([l for l in levels if l < entry_price], default=sl_price)
                sl_price = closest_level - (50 * point) # 50 pts de folga abaixo do nível
                
        else: # SELL
            sl_price = entry_price + (sl_points * point)
            tp_price = entry_price - (tp_points * point)
            
            if mode == "dynamic" and levels:
                # Procura o nível mais próximo acima do preço
                closest_level = min([l for l in levels if l > entry_price], default=sl_price)
                sl_price = closest_level + (50 * point) # 50 pts de folga acima do nível
                
        return float(sl_price), float(tp_price)
