import mysql.connector
import os

def check_db():
    config = {
        "host": "localhost",
        "user": "mt5_user",
        "password": "mt5_password",
        "database": "robo_trading_db",
    }
    
    try:
        conn = mysql.connector.connect(**config)
        cursor = conn.cursor()
        
        print("--- Tabelas no Banco de Dados ---")
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        for (table,) in tables:
            print(f"Tabela: {table}")
            cursor.execute(f"DESCRIBE {table}")
            columns = cursor.fetchall()
            for col in columns:
                print(f"  - {col[0]} ({col[1]})")
        
        print("\n--- Conferindo dados na tabela 'trades' ---")
        cursor.execute("SELECT COUNT(*) FROM trades")
        count = cursor.fetchone()[0]
        print(f"Total de trades registrados: {count}")
        
        if count > 0:
            cursor.execute("SELECT * FROM trades ORDER BY entry_time DESC LIMIT 1")
            last_trade = cursor.fetchone()
            print(f"Ultimo trade: {last_trade}")
            
    except Exception as e:
        print(f"Erro ao conectar ou consultar o banco: {e}")
    finally:
        if 'conn' in locals() and conn.is_connected():
            cursor.close()
            conn.close()

if __name__ == "__main__":
    check_db()
