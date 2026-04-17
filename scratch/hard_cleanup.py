import MetaTrader5 as mt5
from datetime import datetime, timedelta
import logging
import os
import sys
import json

# Adiciona src ao path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src")))
from core.database import DatabaseManager

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("HardCleanup")

def hard_reconcile():
    logger.info("### INICIANDO LIMPEZA E CORREÇÃO DE DADOS (HARD CLEANUP) ###")

    if not mt5.initialize():
        logger.error("Falha ao iniciar MT5")
        return

    db = DatabaseManager()
    
    # 1. Busca todos os trades que já foram fechados para auditar seus valores
    # Ou poderíamos focar nos que sabemos que estão errados, mas auditar todos é mais seguro.
    conn = db.pool.get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT ticket, symbol, pnl, exit_time FROM trades WHERE status = 'CLOSED'")
        closed_trades = cursor.fetchall()
    finally:
        cursor.close()
        conn.close()

    if not closed_trades:
        logger.info("Nenhum trade fechado no banco para auditar.")
    else:
        logger.info(f"Auditando {len(closed_trades)} trades fechados...")
        
        from_date = datetime(2026, 1, 1)
        to_date = datetime.now() + timedelta(days=1)

        corrections = 0
        for trade in closed_trades:
            ticket = int(trade["ticket"])
            symbol = trade["symbol"]
            db_pnl = trade["pnl"] or 0.0
            
            # Busca histórico REAL no MT5 para esse TICKET específico como POSITION ID
            deals = mt5.history_deals_get(from_date, to_date, position=ticket)
            
            if deals is None or len(deals) == 0:
                logger.warning(f"#{ticket} ({symbol}): Nenhum deal encontrado no MT5. Pulando.")
                continue

            # Validação rigorosa: Todos os deals devem ser desse ticket
            # E buscamos o somatório total de Profit + Swap + Commission para essa posição
            real_profit = 0.0
            real_swap = 0.0
            real_comm = 0.0
            last_exit_time = None
            last_exit_price = None
            found_out = False

            for d in deals:
                if d.position_id != ticket:
                    # Isso nunca deveria acontecer se a API do MT5 respeitar o parâmetro 'position'
                    continue
                
                real_profit += d.profit
                real_swap += d.swap
                real_comm += d.commission
                
                if d.entry == mt5.DEAL_ENTRY_OUT:
                    found_out = True
                    last_exit_time = datetime.fromtimestamp(d.time)
                    last_exit_price = d.price
            
            real_pnl = real_profit + real_swap + real_comm
            
            # Se não achou ENTRY_OUT, mas tem deals, usamos o último deal para tempo/preço
            if not last_exit_time:
                last_exit_time = datetime.fromtimestamp(deals[-1].time)
                last_exit_price = deals[-1].price

            # Compara PnL (com pequena margem de tolerância para float)
            if abs(real_pnl - db_pnl) > 0.001:
                logger.info(f"CORREÇÃO: #{ticket} ({symbol}) | Banco: {db_pnl:.2f} | Real: {real_pnl:.2f} | Diferença: {real_pnl - db_pnl:.2f}")
                db.close_trade(ticket, last_exit_price, real_pnl, last_exit_time)
                corrections += 1
            else:
                # Opcional: Log de sucesso silencioso
                pass

        logger.info(f"Auditoria finalizada. Total de correções realizadas: {corrections}")

    mt5.shutdown()
    logger.info("### HARD CLEANUP FINALIZADO ###")

if __name__ == "__main__":
    hard_reconcile()
