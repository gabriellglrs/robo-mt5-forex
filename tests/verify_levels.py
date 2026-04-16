import sys
import os
import MetaTrader5 as mt5

# Adiciona o diretório src ao path para permitir importações dos módulos locais
sys.path.append(os.path.join(os.getcwd(), "src"))

from core.connection import MT5Connection
from analysis.levels import LevelDetector

def main():
    print("=== Iniciando Verificacao da Phase 1 (Estrategia Fimathe) ===")
    
    # 1. Teste de Conexão
    conn = MT5Connection()
    if not conn.connect():
        print("[ERRO] Não foi possível conectar ao MetaTrader 5.")
        return

    print("[OK] Conexão com MT5 estabelecida.")

    try:
        # 2. Teste de Detecção de Níveis
        symbol = "EURUSD"
        
        # Pega o preço atual para referência
        current_tick = mt5.symbol_info_tick(symbol)
        if current_tick is None:
            print(f"[ERRO] Não foi possível obter o preço atual para {symbol}")
            return
            
        price = current_tick.bid if current_tick.last == 0 else current_tick.last
        print(f"\nPreço Atual do {symbol} (BID): {price:.5f}")
        
        detector = LevelDetector(symbol, history_years=10)
        
        print("\n--- [FIMATHE] (Regioes de negociacao por pivots) ---")
        levels = detector.get_levels(mode="fimathe")
        if len(levels) > 0:
            for i, lvl in enumerate(levels[:10]):
                dist = abs(price - lvl) * 100000
                print(f"  [{i+1}] Nivel: {lvl:.5f} (Distancia: {dist:7.0f} pts)")
        else:
            print("  Nenhum nivel detectado.")

        print("\n[INFO] A estrategia Fimathe esta ativa como modo unico.")

    except Exception as e:
        print(f"[ERRO] Ocorreu um erro durante a análise: {e}")
    
    finally:
        # 3. Desconexão
        conn.disconnect()
        print("\n=== Verificação Concluída ===")

if __name__ == "__main__":
    main()
