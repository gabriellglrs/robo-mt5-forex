import json
import logging
from datetime import datetime

import mysql.connector


class DatabaseManager:
    """Gerencia persistencia de trades no MySQL."""

    def __init__(self, host="localhost", user="mt5_user", password="mt5_password", database="robo_trading_db"):
        self.logger = logging.getLogger("DatabaseManager")
        self.config = {
            "host": host,
            "user": user,
            "password": password,
            "database": database,
        }
        self.pool = None
        self._initialize_pool()
        self._create_tables()

    def _initialize_pool(self):
        try:
            self.pool = mysql.connector.pooling.MySQLConnectionPool(
                pool_name="mt5_pool",
                pool_size=5,
                **self.config,
            )
            self.logger.info("Pool de conexoes MySQL inicializado.")
        except Exception as exc:
            self.logger.error(f"Erro ao conectar ao MySQL: {exc}")

    def _create_tables(self):
        """Cria tabelas do sistema caso nao existam."""
        # Tabela para auditoria de versoes de configuracao
        settings_sql = """
        CREATE TABLE IF NOT EXISTS settings_snapshots (
            id INT AUTO_INCREMENT PRIMARY KEY,
            trading_preset VARCHAR(50),
            management_preset VARCHAR(50),
            risk_percent DOUBLE,
            magic_number INT,
            settings_json JSON,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """

        # Tabela de trades com vinculo de auditoria
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
            indicators_json JSON,
            settings_id INT,
            FOREIGN KEY (settings_id) REFERENCES settings_snapshots(id)
        )
        """

        # Tabela de logs do sistema
        logs_sql = """
        CREATE TABLE IF NOT EXISTS system_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            level VARCHAR(10),
            module VARCHAR(50),
            message TEXT,
            timestamp DATETIME
        )
        """

        conn = self.pool.get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(settings_sql)
            cursor.execute(trades_sql)
            cursor.execute(logs_sql)
            
            # Adiciona a coluna settings_id caso a tabela trades ja exista (migracao)
            try:
                cursor.execute("ALTER TABLE trades ADD COLUMN settings_id INT")
                cursor.execute("ALTER TABLE trades ADD FOREIGN KEY (settings_id) REFERENCES settings_snapshots(id)")
            except Exception:
                pass # Coluna ja existe

            conn.commit()
            self.logger.info("Tabelas do sistema (trades, logs, settings) verificadas/criadas.")
        finally:
            cursor.close()
            conn.close()

    def save_trade_open(self, ticket, symbol, magic, trade_type, timeframe, strategy, price, sl, tp, indicators, settings_id=None):
        """Registra abertura de nova posicao vinculada a um snapshot de configuracao."""
        sql = """
        INSERT INTO trades (ticket, symbol, magic, type, timeframe, strategy, entry_price, entry_time, sl, tp, indicators_json, settings_id)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        data = (
            ticket,
            symbol,
            magic,
            trade_type,
            timeframe,
            strategy,
            price,
            datetime.now(),
            sl,
            tp,
            json.dumps(indicators),
            settings_id
        )

        conn = self.pool.get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(sql, data)
            conn.commit()
            self.logger.info(f"Trade #{ticket} registrado no banco de dados.")
        except Exception as exc:
            self.logger.error(f"Erro ao salvar abertura de trade: {exc}")
        finally:
            cursor.close()
            conn.close()

    def get_trade_context(self, ticket):
        """Retorna contexto tecnico do trade para gestao de risco dinamica."""
        if self.pool is None:
            return {}

        sql = """
        SELECT ticket, symbol, type, entry_price, sl, tp, indicators_json
        FROM trades
        WHERE ticket = %s
        ORDER BY id DESC
        LIMIT 1
        """

        conn = None
        cursor = None
        try:
            conn = self.pool.get_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute(sql, (int(ticket),))
            row = cursor.fetchone()
            if not row:
                return {}

            indicators_raw = row.get("indicators_json")
            indicators = {}
            if isinstance(indicators_raw, dict):
                indicators = indicators_raw
            elif isinstance(indicators_raw, str) and indicators_raw.strip():
                try:
                    indicators = json.loads(indicators_raw)
                except Exception:
                    indicators = {}

            return {
                "ticket": row.get("ticket"),
                "symbol": row.get("symbol"),
                "type": row.get("type"),
                "entry_price": row.get("entry_price"),
                "sl": row.get("sl"),
                "tp": row.get("tp"),
                "indicators": indicators if isinstance(indicators, dict) else {},
            }
        except Exception as exc:
            self.logger.error(f"Erro ao buscar contexto do trade #{ticket}: {exc}")
            return {}
        finally:
            try:
                if cursor is not None:
                    cursor.close()
                if conn is not None:
                    conn.close()
            except Exception:
                pass

    def get_open_trades(self, symbol=None):
        """Retorna lista de todos os trades com status 'OPEN' (opcionalmente filtrado por simbolo)."""
        if symbol:
            sql = "SELECT ticket, symbol FROM trades WHERE status = 'OPEN' AND symbol = %s"
            params = (symbol,)
        else:
            sql = "SELECT ticket, symbol FROM trades WHERE status = 'OPEN'"
            params = ()

        conn = None
        cursor = None
        try:
            conn = self.pool.get_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute(sql, params)
            return cursor.fetchall()
        except Exception as exc:
            self.logger.error(f"Erro ao buscar trades abertos: {exc}")
            return []
        finally:
            if cursor is not None:
                cursor.close()
            if conn is not None:
                conn.close()

    def log_event(self, level, module, message):
        """Grava log de evento no banco de dados."""
        sql = """
        INSERT INTO system_logs (level, module, message, timestamp)
        VALUES (%s, %s, %s, %s)
        """
        data = (level, module, message, datetime.now())

        conn = None
        cursor = None
        try:
            conn = self.pool.get_connection()
            cursor = conn.cursor()
            cursor.execute(sql, data)
            conn.commit()
        except Exception as exc:
            self.logger.error(f"Erro ao salvar log de evento: {exc}")
        finally:
            if cursor is not None:
                cursor.close()
            if conn is not None:
                conn.close()

    def close_trade(self, ticket, exit_price, pnl, exit_time=None):
        """Marca um trade como fechado e registra o lucro/prejuizo final."""
        sql = """
        UPDATE trades
        SET exit_price = %s, exit_time = %s, pnl = %s, status = 'CLOSED'
        WHERE ticket = %s
        """
        data = (
            exit_price,
            exit_time or datetime.now(),
            pnl,
            ticket
        )

        conn = self.pool.get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(sql, data)
            conn.commit()
            self.logger.info(f"Trade #{ticket} encerrado no banco (PnL: {pnl:.2f}).")
        except Exception as exc:
            self.logger.error(f"Erro ao salvar fechamento de trade: {exc}")
        finally:
            cursor.close()
            conn.close()

    def save_settings_snapshot(self, settings_dict):
        """Salva um snapshot completo das configuracoes atuais para auditoria."""
        sql = """
        INSERT INTO settings_snapshots (trading_preset, management_preset, risk_percent, magic_number, settings_json)
        VALUES (%s, %s, %s, %s, %s)
        """
        
        # Extrai campos amigaveis para facilitar a busca no DB sem abrir o JSON
        trading_preset = settings_dict.get("signal_logic", {}).get("trading_type", "manual")
        management_preset = settings_dict.get("risk_management", {}).get("fimathe_management_mode", "standard")
        risk_percent = settings_dict.get("risk_management", {}).get("risk_percent", 0.0)
        magic_number = settings_dict.get("risk_management", {}).get("magic_number", 0)

        data = (
            trading_preset,
            management_preset,
            risk_percent,
            magic_number,
            json.dumps(settings_dict, ensure_ascii=False)
        )

        conn = self.pool.get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(sql, data)
            conn.commit()
            snapshot_id = cursor.lastrowid
            self.logger.info(f"Snapshot de configuracoes #{snapshot_id} salvo no banco.")
            return snapshot_id
        except Exception as exc:
            self.logger.error(f"Erro ao salvar snapshot de configuracoes: {exc}")
            return None
        finally:
            cursor.close()
            conn.close()

    def get_latest_settings_id(self):
        """Retorna o ID do ultimo snapshot de configuracao gravado."""
        sql = "SELECT id FROM settings_snapshots ORDER BY id DESC LIMIT 1"
        conn = self.pool.get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(sql)
            row = cursor.fetchone()
            return row[0] if row else None
        except Exception as exc:
            self.logger.error(f"Erro ao buscar ultimo ID de settings: {exc}")
            return None
        finally:
            cursor.close()
            conn.close()
