import mysql.connector
from mysql.connector import pooling
import json
import logging
from datetime import datetime

class DatabaseManager:
    """Gerencia a persistência de dados no MySQL para auditoria e dashboard."""
    
    def __init__(self, host="localhost", user="mt5_user", password="mt5_password", database="robo_trading_db"):
        self.logger = logging.getLogger("DatabaseManager")
        self.config = {
            "host": host,
            "user": user,
            "password": password,
            "database": database
        }
        self.pool = None
        self._initialize_pool()
        self._create_tables()

    def _initialize_pool(self):
        try:
            self.pool = mysql.connector.pooling.MySQLConnectionPool(
                pool_name="mt5_pool",
                pool_size=5,
                **self.config
            )
            self.logger.info("Pool de conexões MySQL inicializado.")
        except Exception as e:
            self.logger.error(f"Erro ao conectar ao MySQL: {e}")

    def _create_tables(self):
        """Cria as tabelas de Trades e Logs se não existirem."""
        trades_sql = """
        CREATE TABLE IF NOT EXISTS trades (
            id INT AUTO_INCREMENT PRIMARY KEY,
            ticket BIGINT UNIQUE,
            symbol VARCHAR(15),
            magic INT,
            type VARCHAR(10),
            timeframe VARCHAR(10),
            strategy VARCHAR(20),
            entry_price DOUBLE,
            entry_time DATETIME,
            exit_price DOUBLE,
            exit_time DATETIME,
            sl DOUBLE,
            tp DOUBLE,
            pnl DOUBLE,
            status VARCHAR(15) DEFAULT 'OPEN',
            indicators_json JSON
        )
        """
        logs_sql = """
        CREATE TABLE IF NOT EXISTS system_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            level VARCHAR(10),
            module VARCHAR(50),
            message TEXT
        )
        """
        
        conn = self.pool.get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(trades_sql)
            cursor.execute(logs_sql)
            conn.commit()
            self.logger.info("Tabelas de banco de dados verificadas/criadas.")
        finally:
            cursor.close()
            conn.close()

    def save_trade_open(self, ticket, symbol, magic, trade_type, timeframe, strategy, price, sl, tp, indicators):
        """Registra a abertura de uma nova posição."""
        sql = """
        INSERT INTO trades (ticket, symbol, magic, type, timeframe, strategy, entry_price, entry_time, sl, tp, indicators_json)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        data = (ticket, symbol, magic, trade_type, timeframe, strategy, price, datetime.now(), sl, tp, json.dumps(indicators))
        
        conn = self.pool.get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(sql, data)
            conn.commit()
            self.logger.info(f"Trade #{ticket} registrado no banco de dados.")
        except Exception as e:
            self.logger.error(f"Erro ao salvar abertura de trade: {e}")
        finally:
            cursor.close()
            conn.close()

    def log_event(self, level, module, message):
        """Registra um evento ou erro no banco para auditoria."""
        sql = "INSERT INTO system_logs (level, module, message) VALUES (%s, %s, %s)"
        data = (level, module, message)
        
        conn = self.pool.get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(sql, data)
            conn.commit()
        except Exception as e:
            pass # Para não entrar em loop se o log falhar
        finally:
            cursor.close()
            conn.close()
