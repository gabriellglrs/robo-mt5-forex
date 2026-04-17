import logging

import MetaTrader5 as mt5


class OrderEngine:
    """Responsavel por executar ordens e gerenciar posicoes no MT5."""

    def __init__(self, magic_number=202404, db_manager=None, settings_id=None):
        self.magic = magic_number
        self.db = db_manager
        self.settings_id = settings_id
        self.logger = logging.getLogger("OrderEngine")

    def count_open_positions(self, symbol):
        """Conta quantas posicoes deste robo (Magic Number) estao abertas no simbolo."""
        positions = mt5.positions_get(symbol=symbol)
        if positions is None:
            return 0

        count = 0
        for pos in positions:
            if pos.magic == self.magic:
                count += 1
        return count

    def get_open_positions(self, symbol=None):
        """Retorna posicoes abertas deste robo (filtrando por simbolo quando informado)."""
        positions = mt5.positions_get(symbol=symbol) if symbol else mt5.positions_get()
        if positions is None:
            return []
        return [pos for pos in positions if pos.magic == self.magic]

    def modify_position_sl_tp(self, ticket, symbol, sl, tp):
        """Atualiza SL/TP de uma posicao aberta."""
        request = {
            "action": mt5.TRADE_ACTION_SLTP,
            "position": int(ticket),
            "symbol": symbol,
            "sl": float(sl),
            "tp": float(tp),
            "magic": self.magic,
        }

        result = mt5.order_send(request)
        if result is None:
            self.logger.error(f"Falha ao modificar SL/TP da posicao #{ticket}: sem retorno da API.")
            return None

        if result.retcode != mt5.TRADE_RETCODE_DONE:
            self.logger.error(
                f"Falha ao modificar SL/TP da posicao #{ticket}: "
                f"{result.comment} (Code: {result.retcode})"
            )
            return result

        self.logger.info(f"SL/TP atualizados na posicao #{ticket} (SL: {sl:.5f}, TP: {tp:.5f}).")
        return result

    def get_trade_context(self, ticket):
        """Busca contexto tecnico salvo no banco para um ticket."""
        if not self.db:
            return {}
        try:
            return self.db.get_trade_context(ticket)
        except Exception as exc:
            self.logger.error(f"Falha ao buscar contexto do ticket #{ticket}: {exc}")
            return {}

    def send_market_order(self, symbol, order_type, volume, sl, tp, deviation=20, timeframe="M5", strategy="fimathe", indicators=None, comment="RoboMT5-v2"):
        """Envia uma ordem a mercado e registra no banco de dados."""
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
            "deviation": int(deviation),
            "magic": self.magic,
            "comment": comment,
            "type_time": mt5.ORDER_TIME_GTC,
            "type_filling": mt5.ORDER_FILLING_IOC,
        }

        result = mt5.order_send(request)

        if result is None:
            self.logger.error(f"Falha ao enviar ordem para {symbol}: sem retorno da API.")
            return None

        if result.retcode != mt5.TRADE_RETCODE_DONE:
            error_msg = f"Falha ao enviar ordem: {result.comment} (Code: {result.retcode})"
            self.logger.error(error_msg)
            if self.db:
                self.db.log_event("ERROR", "OrderEngine", error_msg)
            return result

        self.logger.info(f"ORDEM EXECUTADA: {order_type} {volume} em {price:.5f} (SL: {sl:.5f}, TP: {tp:.5f})")

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
                indicators=indicators or {},
                settings_id=self.settings_id
            )

        return result

    def get_position_closure_details(self, ticket):
        """Busca no historico do MT5 os detalhes do fechamento de um ticket (PnL real) com validacao estrita."""
        import time
        from datetime import datetime, timedelta

        # Busca historico desde 365 dias atras ate agora
        from_date = datetime.now() - timedelta(days=365)
        to_date = datetime.now() + timedelta(minutes=5)
        
        # Filtra pelo ticket da POSICAO
        deals = mt5.history_deals_get(from_date, to_date, position=int(ticket))
        
        if deals is None or len(deals) == 0:
            self.logger.warning(f"Nenhum deal encontrado para o ticket #{ticket} no historico.")
            return None

        # Consolidacao rigorosa de Profit/Swap/Commission para o ticket da posicao
        real_profit = 0.0
        real_swap = 0.0
        real_comm = 0.0
        exit_deal = None
        
        for d in deals:
            # Validacao de Seguranca: Garante que o deal pertence de fato a esta posicao
            if d.position_id != int(ticket):
                continue
                
            real_profit += d.profit
            real_swap += d.swap
            real_comm += d.commission
            
            # O deal de fechamento final e aquele que tem entry == mt5.DEAL_ENTRY_OUT
            if d.entry == mt5.DEAL_ENTRY_OUT:
                exit_deal = d

        # Se nao achou o OUT explicitamente, mas tem deals validos, usamos o ultimo deal valido para tempo/preco
        if not exit_deal:
            valid_deals = [d for d in deals if d.position_id == int(ticket)]
            if not valid_deals:
                return None
            exit_deal = valid_deals[-1]
            self.logger.warning(f"Deal de saida explicita nao encontrado para #{ticket}. Usando ultimo deal valido.")

        return {
            "ticket": ticket,
            "exit_price": exit_deal.price,
            "exit_time": datetime.fromtimestamp(exit_deal.time),
            "pnl": real_profit + real_swap + real_comm,
            "comment": exit_deal.comment,
            "reason": exit_deal.reason 
        }

    def sync_position_closure(self, ticket):
        """Audita e sincroniza o fechamento de uma posicao com o banco de dados."""
        if not self.db:
            return None
        
        details = self.get_position_closure_details(ticket)
        if not details:
            # Caso nao encontre no historico imediato, logamos mas nao fechamos no banco ainda
            return None
        
        self.db.close_trade(
            ticket=ticket,
            exit_price=details["exit_price"],
            pnl=details["pnl"],
            exit_time=details["exit_time"]
        )
        return details
