import sys
import os
import json
from datetime import datetime

# Add src to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src")))

from core.database import DatabaseManager

def test_saving():
    db = DatabaseManager()
    
    print("Testando salvamento de log...")
    db.log_event("INFO", "TestScript", "Este eh um log de teste para validar a integridade.")
    
    print("Testando salvamento de trade...")
    # save_trade_open(ticket, symbol, magic, trade_type, timeframe, strategy, price, sl, tp, indicators)
    db.save_trade_open(
        ticket=12345678,
        symbol="EURUSD",
        magic=202404,
        trade_type="BUY",
        timeframe="M15",
        strategy="fimathe",
        price=1.08500,
        sl=1.08000,
        tp=1.09500,
        indicators={"test": True, "info": "dummy trade"}
    )
    
    print("Verificando se os dados foram salvos...")
    import mysql.connector
    config = {
        "host": "localhost",
        "user": "mt5_user",
        "password": "mt5_password",
        "database": "robo_trading_db",
    }
    conn = mysql.connector.connect(**config)
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM system_logs WHERE module='TestScript' ORDER BY timestamp DESC LIMIT 1")
    log = cursor.fetchone()
    print(f"Log encontrado: {log}")
    
    cursor.execute("SELECT * FROM trades WHERE ticket=12345678")
    trade = cursor.fetchone()
    print(f"Trade encontrado: {trade}")
    
    # Cleanup
    print("Limpando dados de teste...")
    cursor.execute("DELETE FROM system_logs WHERE module='TestScript'")
    cursor.execute("DELETE FROM trades WHERE ticket=12345678")
    conn.commit()
    
    cursor.close()
    conn.close()

if __name__ == "__main__":
    test_saving()
