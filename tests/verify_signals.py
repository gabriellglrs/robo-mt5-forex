import sys
import os
import MetaTrader5 as mt5

sys.path.append(os.path.join(os.getcwd(), "src"))

from analysis.signals import SignalDetector
from core.connection import MT5Connection

def test_fimathe_signals():
    print("=== Teste de Validacao: Logica Fimathe ===")
    
    conn = MT5Connection()
    if not conn.connect():
        return

    try:
        symbol = "EURUSD"
        logic_settings = {
            "trend_timeframe": "H1",
            "entry_timeframe": "M15",
            "trend_candles": 200,
            "trend_min_slope_points": 0.20,
            "entry_lookback_candles": 50,
            "breakout_buffer_points": 10,
            "pullback_tolerance_points": 20,
            "require_channel_break": True,
            "require_pullback_retest": True,
            "sr_tolerance_points": 40,
        }

        signal_detector = SignalDetector(symbol, logic_settings)

        tick = mt5.symbol_info_tick(symbol)
        if tick is None:
            print(f"[ERRO] Sem tick para {symbol}")
            return

        current_price = tick.bid if tick.bid else tick.last
        mock_levels = [current_price]

        details = signal_detector.evaluate_signal_details(current_price, mock_levels)
        print(f"\n[INFO] Resultado Fimathe: reason={details.get('reason')} | signal={details.get('signal')}")
        print(
            f"[INFO] Tendencia={details.get('trend_direction')} "
            f"| slope_pts={details.get('trend_slope_points')} "
            f"| near_sr={details.get('near_sr')}"
        )

    except Exception as e:
        print(f"[ERRO] Falha no teste Fimathe: {e}")
    finally:
        conn.disconnect()
        print("\n=== Teste Fimathe Concluido ===")

if __name__ == "__main__":
    test_fimathe_signals()
