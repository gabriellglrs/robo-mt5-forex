import sys
import os
import time

sys.path.append(os.path.join(os.getcwd(), "src"))

from core.database import DatabaseManager

def verify_db():
    print("=== Iniciando Verificação do Banco de Dados (MySQL Docker) ===")
    
    try:
        # 1. Tenta conectar
        db = DatabaseManager()
        print("[OK] Conexão com o pool MySQL bem sucedida.")
        
        # 2. Simula o log de um evento
        db.log_event("INFO", "VerificationTest", "Teste de conexão via script de verificação.")
        print("[OK] Evento de log gravado com sucesso.")
        
        # 3. Simula a gravação de um trade mock
        indicators_mock = {
            "rsi": 25.5,
            "bb_lower": 1.0850,
            "pinbar": "BULLISH"
        }
        
        print("[MOCK] Tentando salvar trade de teste...")
        db.save_trade_open(
            ticket=99999999,
            symbol="EURUSD",
            magic=123456,
            trade_type="BUY",
            timeframe="M5,M15",
            strategy="fimathe",
            price=1.0855,
            sl=1.0835,
            tp=1.0895,
            indicators=indicators_mock
        )
        print("[OK] Trade Mock salvo no banco de dados!")
        
    except Exception as e:
        print(f"[ERRO] Falha na verificação: {e}")
    finally:
        print("\n=== Verificação Concluída ===")

if __name__ == "__main__":
    verify_db()
