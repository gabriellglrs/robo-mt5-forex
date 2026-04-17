import os
import sys

import pytest

sys.path.append(os.path.join(os.getcwd(), "src"))


def verify_db():
    print("=== Iniciando verificacao do Banco de Dados (MySQL Docker) ===")
    pytest.importorskip("mysql.connector")

    try:
        from core.database import DatabaseManager

        db = DatabaseManager()
        print("[OK] Conexao com o pool MySQL bem sucedida.")

        db.log_event("INFO", "VerificationTest", "Teste de conexao via script de verificacao.")
        print("[OK] Evento de log gravado com sucesso.")

        indicators_mock = {
            "rsi": 25.5,
            "bb_lower": 1.0850,
            "pinbar": "BULLISH",
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
            indicators=indicators_mock,
        )
        print("[OK] Trade Mock salvo no banco de dados!")

    except Exception as exc:
        print(f"[ERRO] Falha na verificacao: {exc}")
    finally:
        print("\n=== Verificacao concluida ===")


if __name__ == "__main__":
    verify_db()
