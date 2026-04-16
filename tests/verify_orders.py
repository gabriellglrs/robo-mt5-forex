import sys
import os
import MetaTrader5 as mt5

sys.path.append(os.path.join(os.getcwd(), "src"))

from execution.orders import OrderEngine
from execution.risk import RiskManager
from core.connection import MT5Connection

def test_order_execution():
    print("=== Teste de Execução Real de Ordem ===")
    print("ATENÇÃO: Este teste abrirá uma posição de 0.01 no MT5.")
    
    conn = MT5Connection()
    if not conn.connect(): return

    try:
        symbol = "EURUSD"
        magic = 202404
        
        # 1. Instanciamos os motores
        risk_settings = {
            "lot_mode": "fixed",
            "fixed_lot": 0.01,
            "sl_tp_mode": "fixed",
            "sl_points": 200,
            "tp_points": 400
        }
        
        risk_manager = RiskManager(symbol, risk_settings)
        order_engine = OrderEngine(magic_number=magic)
        
        # 2. Preparamos uma Ordem de COMPRA Simulada
        tick = mt5.symbol_info_tick(symbol)
        price = tick.ask
        
        sl, tp = risk_manager.calculate_prices("BUY", price)
        
        print(f"\n[EXECUÇÃO] Enviando compra de 0.01 em {price:.5f}...")
        print(f"SL: {sl:.5f} | TP: {tp:.5f}")
        
        result = order_engine.send_market_order(
            symbol=symbol,
            order_type=mt5.ORDER_TYPE_BUY,
            volume=0.01,
            sl=sl,
            tp=tp,
            comment="Teste de Verificação v2"
        )
        
        if result and result.retcode == mt5.TRADE_RETCODE_DONE:
            print("\n[OK] SUCESSO! A ordem foi aceita pela corretora.")
            print(f"Ticket da Ordem: {result.order}")
        else:
            print(f"\n[ERRO] A ordem foi rejeitada: {result.comment if result else 'Sem resposta'}")

    except Exception as e:
        print(f"[ERRO CRÍTICO] Falha no teste: {e}")
    finally:
        conn.disconnect()
        print("\n=== Teste de Execução Concluído ===")

if __name__ == "__main__":
    test_order_execution()
