import json
import logging
import os
import sys
import MetaTrader5 as mt5
from datetime import datetime, timedelta

# Adiciona src ao path para reusar classes
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src")))

from core.database import DatabaseManager

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("DeepSync")

def deep_sync():
    logger.info("### INICIANDO RECONCILIAÇÃO PROFUNDA (DEEP SYNC) ###")
    
    # 1. Conecta ao MT5
    if not mt5.initialize():
        logger.error(f"Falha ao inicializar MetaTrader 5: {mt5.last_error()}")
        return

    # 2. Conecta ao Banco de Dados
    db = DatabaseManager()
    
    # 3. Busca todos os trades marcados como OPEN no banco
    open_trades = db.get_open_trades()
    if not open_trades:
        logger.info("Nenhum trade 'OPEN' encontrado no banco de dados para reconciliar.")
    else:
        logger.info(f"Encontrados {len(open_trades)} trades 'OPEN' no banco. Verificando integridade...")
        
        for trade in open_trades:
            ticket = int(trade["ticket"])
            symbol = trade["symbol"]
            
            # Verifica se está aberto no MT5
            positions = mt5.positions_get(ticket=ticket)
            
            if positions is not None and len(positions) > 0:
                logger.info(f"OK: Trade #{ticket} ({symbol}) ainda está aberto no MT5.")
                continue
            
            # Se não está aberto, precisamos encontrar o fechamento no histórico
            logger.warning(f"DESVIO DETECTADO: Trade #{ticket} ({symbol}) está no banco como OPEN mas ausente no MT5 Live. Sincronizando...")
            
            # Busca histórico (período amplo: de 01/01/2026 até agora + 1 dia de margem)
            from_date = datetime(2026, 1, 1)
            to_date = datetime.now() + timedelta(days=1)
            
            deals = mt5.history_deals_get(from_date, to_date, position=ticket)
            
            if deals is None or len(deals) == 0:
                logger.error(f"ERRO: Não foi possível encontrar deals para o ticket #{ticket} no histórico do MT5.")
                # Tenta buscar pelo ticket da ordem se o do position falhar (raro no MT5)
                deals = mt5.history_deals_get(from_date, to_date, ticket=ticket)
                if not deals:
                    continue

            # O deal de fechamento é aquele com entry == mt5.DEAL_ENTRY_OUT
            exit_deal = None
            for d in deals:
                if d.entry == mt5.DEAL_ENTRY_OUT:
                    exit_deal = d
                    break
            
            if not exit_deal:
                # Se não achou o OUT, pega o último deal associado
                exit_deal = deals[-1]
                logger.warning(f"Aviso: Deal de saída explícita não encontrado para #{ticket}. Usando último deal do ticket.")

            # Calcula PnL real (lucro + swap + comissão)
            pnl_final = exit_deal.profit + exit_deal.swap + exit_deal.commission
            exit_price = exit_deal.price
            exit_time = datetime.fromtimestamp(exit_deal.time)
            
            logger.info(f"Fechando Trade #{ticket} no banco: PnL Real {pnl_final:.2f}, Preço: {exit_price:.5f}")
            db.close_trade(ticket, exit_price, pnl_final, exit_time)
            
    # 4. Limpeza do Snapshot Runtime (para remover cards de ativos não monitorados)
    PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    RUNTIME_FILE = os.path.join(PROJECT_ROOT, "logs", "fimathe_runtime.json")
    SETTINGS_FILE = os.path.join(PROJECT_ROOT, "config", "settings.json")
    
    if os.path.exists(RUNTIME_FILE) and os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
                settings = json.load(f)
            
            # Parse dos símbolos configurados
            raw_symbols = settings.get("analysis", {}).get("symbols", "")
            if isinstance(raw_symbols, str):
                configured_symbols = [s.strip().upper() for s in raw_symbols.split(",") if s.strip()]
            else:
                configured_symbols = [str(s).strip().upper() for s in raw_symbols]
            
            with open(RUNTIME_FILE, "r", encoding="utf-8") as f:
                runtime = json.load(f)
            
            if "symbols" in runtime:
                stale_symbols = []
                for s in list(runtime["symbols"].keys()):
                    if s not in configured_symbols:
                        stale_symbols.append(s)
                        del runtime["symbols"][s]
                
                if stale_symbols:
                    logger.info(f"Limpando {len(stale_symbols)} ativos obsoletos do snapshot: {', '.join(stale_symbols)}")
                    with open(RUNTIME_FILE, "w", encoding="utf-8") as f:
                        json.dump(runtime, f, indent=2, ensure_ascii=False)
                else:
                    logger.info("Nenhum ativo obsoleto encontrado no snapshot runtime.")
        except Exception as e:
            logger.error(f"Erro ao limpar snapshot runtime: {e}")

    mt5.shutdown()
    logger.info("### RECONCILIAÇÃO FINALIZADA COM SUCESSO ###")

if __name__ == "__main__":
    deep_sync()
