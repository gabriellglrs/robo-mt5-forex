import MetaTrader5 as mt5
import logging

class OrderEngine:
    """Responsável por executar ordens e gerenciar posições no MT5."""
    
    def __init__(self, magic_number=202404, db_manager=None):
        self.magic = magic_number
        self.db = db_manager # Gerenciador de Banco de Dados
        self.logger = logging.getLogger("OrderEngine")
        
    def count_open_positions(self, symbol):
        """Conta quantas posições este robô (Magic Number) tem abertas no símbolo."""
        positions = mt5.positions_get(symbol=symbol)
        if positions is None:
            return 0
            
        count = 0
        for pos in positions:
            if pos.magic == self.magic:
                count += 1
        return count

    def send_market_order(self, symbol, order_type, volume, sl, tp, timeframe="M5", strategy="fractal", indicators=None, comment="RoboMT5-v2"):
        """Envia uma ordem a mercado e registra no Banco de Dados."""
        
        tick = mt5.symbol_info_tick(symbol)
        if tick is None:
            self.logger.error(f"Falha ao obter tick para {symbol}")
            return None
            
        price = tick.ask if order_type == mt5.ORDER_TYPE_BUY else tick.bid
        
        request = {
            "action": mt5.TRADE_ACTION_DEAL,
            "symbol": symbol,
            "volume": float(volume),
            "type": order_type,
            "price": float(price),
            "sl": float(sl),
            "tp": float(tp),
            "deviation": 20,
            "magic": self.magic,
            "comment": comment,
            "type_time": mt5.ORDER_TIME_GTC,
            "type_filling": mt5.ORDER_FILLING_IOC,
        }
        
        result = mt5.order_send(request)
        
        if result.retcode != mt5.TRADE_RETCODE_DONE:
            error_msg = f"Falha ao enviar ordem: {result.comment} (Code: {result.retcode})"
            self.logger.error(error_msg)
            if self.db:
                self.db.log_event("ERROR", "OrderEngine", error_msg)
            return result
            
        self.logger.info(f"ORDEM EXECUTADA: {order_type} {volume} em {price:.5f} (SL: {sl:.5f}, TP: {tp:.5f})")
        
        # PERSISTÊNCIA NA PHASE 4: Salva no banco de dados se o manager estiver ativo
        if self.db:
            type_str = "BUY" if order_type == mt5.ORDER_TYPE_BUY else "SELL"
            self.db.save_trade_open(
                ticket=result.order,
                symbol=symbol,
                magic=self.magic,
                trade_type=type_str,
                timeframe=timeframe,
                strategy=strategy,
                price=price,
                sl=sl,
                tp=tp,
                indicators=indicators
            )
            
        return result
