import json
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

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

        notifications_sql = """
        CREATE TABLE IF NOT EXISTS notification_events (
            id INT AUTO_INCREMENT PRIMARY KEY,
            event_key VARCHAR(64),
            event_type VARCHAR(80),
            category VARCHAR(20),
            priority VARCHAR(4),
            severity VARCHAR(12),
            symbol VARCHAR(20),
            ticket BIGINT NULL,
            side VARCHAR(8),
            rule_id VARCHAR(20),
            message TEXT,
            price DOUBLE NULL,
            sl DOUBLE NULL,
            tp DOUBLE NULL,
            metadata_json JSON,
            status VARCHAR(20),
            suppression_reason VARCHAR(40) NULL,
            aggregated_count INT DEFAULT 1,
            delivery_channel VARCHAR(20),
            delivery_status VARCHAR(20),
            delivery_error TEXT NULL,
            delivered_at DATETIME NULL,
            is_read TINYINT(1) DEFAULT 0,
            read_at DATETIME NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """

        lab_runs_sql = """
        CREATE TABLE IF NOT EXISTS lab_runs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            symbol VARCHAR(20) NOT NULL,
            window_days INT NOT NULL,
            preset_id VARCHAR(40) NOT NULL,
            spread_model DOUBLE DEFAULT 0,
            slippage_model DOUBLE DEFAULT 0,
            status VARCHAR(20) NOT NULL,
            config_snapshot_json JSON,
            config_hash VARCHAR(64),
            error_message TEXT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            started_at DATETIME NULL,
            finished_at DATETIME NULL
        )
        """

        lab_results_sql = """
        CREATE TABLE IF NOT EXISTS lab_results (
            id INT AUTO_INCREMENT PRIMARY KEY,
            run_id INT NOT NULL,
            symbol VARCHAR(20) NOT NULL,
            window_days INT NOT NULL,
            preset_id VARCHAR(60) NOT NULL,
            config_hash VARCHAR(64) NOT NULL,
            score DOUBLE DEFAULT 0,
            score_breakdown_json JSON,
            metrics_json JSON,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (run_id) REFERENCES lab_runs(id) ON DELETE CASCADE
        )
        """

        lab_trades_sql = """
        CREATE TABLE IF NOT EXISTS lab_trades (
            id INT AUTO_INCREMENT PRIMARY KEY,
            run_id INT NOT NULL,
            result_id INT NOT NULL,
            symbol VARCHAR(20) NOT NULL,
            side VARCHAR(8) NOT NULL,
            entry_time DATETIME NOT NULL,
            exit_time DATETIME NOT NULL,
            entry_price DOUBLE,
            exit_price DOUBLE,
            sl_price DOUBLE,
            tp_price DOUBLE,
            pnl_points DOUBLE,
            result VARCHAR(12),
            config_hash VARCHAR(64),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (run_id) REFERENCES lab_runs(id) ON DELETE CASCADE,
            FOREIGN KEY (result_id) REFERENCES lab_results(id) ON DELETE CASCADE
        )
        """

        conn = self.pool.get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(settings_sql)
            cursor.execute(trades_sql)
            cursor.execute(logs_sql)
            cursor.execute(notifications_sql)
            cursor.execute(lab_runs_sql)
            cursor.execute(lab_results_sql)
            cursor.execute(lab_trades_sql)
            
            # Adiciona a coluna settings_id caso a tabela trades ja exista (migracao)
            try:
                cursor.execute("ALTER TABLE trades ADD COLUMN settings_id INT")
                cursor.execute("ALTER TABLE trades ADD FOREIGN KEY (settings_id) REFERENCES settings_snapshots(id)")
            except Exception:
                pass # Coluna ja existe

            # Migracoes idempotentes da tabela de notificacoes
            try:
                cursor.execute("ALTER TABLE notification_events ADD COLUMN is_read TINYINT(1) DEFAULT 0")
            except Exception:
                pass
            try:
                cursor.execute("ALTER TABLE notification_events ADD COLUMN read_at DATETIME NULL")
            except Exception:
                pass

            # Indices para leitura rápida do Strategy Lab
            try:
                cursor.execute("CREATE INDEX idx_lab_runs_symbol_window_preset_created ON lab_runs(symbol, window_days, preset_id, created_at)")
            except Exception:
                pass
            try:
                cursor.execute("CREATE INDEX idx_lab_results_run_score ON lab_results(run_id, score)")
            except Exception:
                pass
            try:
                cursor.execute("CREATE INDEX idx_lab_results_symbol_window_score ON lab_results(symbol, window_days, score)")
            except Exception:
                pass

            conn.commit()
            self.logger.info("Tabelas do sistema (trades, logs, settings) verificadas/criadas.")
        finally:
            cursor.close()
            conn.close()

    def create_lab_run(
        self,
        symbol: str,
        window_days: int,
        preset_id: str,
        spread_model: float,
        slippage_model: float,
        config_snapshot: Dict[str, Any],
        config_hash: str,
    ) -> Optional[int]:
        sql = """
        INSERT INTO lab_runs (
            symbol, window_days, preset_id, spread_model, slippage_model,
            status, config_snapshot_json, config_hash, created_at
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        conn = None
        cursor = None
        try:
            conn = self.pool.get_connection()
            cursor = conn.cursor()
            cursor.execute(
                sql,
                (
                    symbol,
                    int(window_days),
                    preset_id,
                    float(spread_model),
                    float(slippage_model),
                    "queued",
                    json.dumps(config_snapshot, ensure_ascii=False),
                    config_hash,
                    datetime.now(),
                ),
            )
            conn.commit()
            return int(cursor.lastrowid)
        except Exception as exc:
            self.logger.error(f"Erro ao criar run de laboratorio: {exc}")
            return None
        finally:
            if cursor is not None:
                cursor.close()
            if conn is not None:
                conn.close()

    def update_lab_run_status(self, run_id: int, status: str, error_message: Optional[str] = None):
        status_value = str(status or "failed").lower()
        now = datetime.now()
        started_at = now if status_value == "running" else None
        finished_at = now if status_value in {"done", "failed", "cancelled"} else None
        sql = """
        UPDATE lab_runs
        SET status = %s,
            error_message = %s,
            started_at = COALESCE(%s, started_at),
            finished_at = COALESCE(%s, finished_at)
        WHERE id = %s
        """
        conn = None
        cursor = None
        try:
            conn = self.pool.get_connection()
            cursor = conn.cursor()
            cursor.execute(sql, (status_value, error_message, started_at, finished_at, int(run_id)))
            conn.commit()
        except Exception as exc:
            self.logger.error(f"Erro ao atualizar status do lab run {run_id}: {exc}")
        finally:
            if cursor is not None:
                cursor.close()
            if conn is not None:
                conn.close()

    def save_lab_result(
        self,
        run_id: int,
        symbol: str,
        window_days: int,
        preset_id: str,
        config_hash: str,
        score: float,
        score_breakdown: Dict[str, Any],
        metrics: Dict[str, Any],
    ) -> Optional[int]:
        sql = """
        INSERT INTO lab_results (
            run_id, symbol, window_days, preset_id, config_hash,
            score, score_breakdown_json, metrics_json, created_at
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        conn = None
        cursor = None
        try:
            conn = self.pool.get_connection()
            cursor = conn.cursor()
            cursor.execute(
                sql,
                (
                    int(run_id),
                    symbol,
                    int(window_days),
                    preset_id,
                    config_hash,
                    float(score),
                    json.dumps(score_breakdown, ensure_ascii=False),
                    json.dumps(metrics, ensure_ascii=False),
                    datetime.now(),
                ),
            )
            conn.commit()
            return int(cursor.lastrowid)
        except Exception as exc:
            self.logger.error(f"Erro ao salvar resultado do lab run {run_id}: {exc}")
            return None
        finally:
            if cursor is not None:
                cursor.close()
            if conn is not None:
                conn.close()

    def save_lab_trade(self, run_id: int, result_id: int, trade: Dict[str, Any]):
        sql = """
        INSERT INTO lab_trades (
            run_id, result_id, symbol, side, entry_time, exit_time,
            entry_price, exit_price, sl_price, tp_price, pnl_points, result, config_hash, created_at
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        conn = None
        cursor = None
        try:
            conn = self.pool.get_connection()
            cursor = conn.cursor()
            cursor.execute(
                sql,
                (
                    int(run_id),
                    int(result_id),
                    trade.get("symbol"),
                    trade.get("side"),
                    trade.get("entry_time"),
                    trade.get("exit_time"),
                    trade.get("entry_price"),
                    trade.get("exit_price"),
                    trade.get("sl_price"),
                    trade.get("tp_price"),
                    trade.get("pnl_points"),
                    trade.get("result"),
                    trade.get("config_hash"),
                    datetime.now(),
                ),
            )
            conn.commit()
        except Exception as exc:
            self.logger.error(f"Erro ao salvar trade de laboratorio: {exc}")
        finally:
            if cursor is not None:
                cursor.close()
            if conn is not None:
                conn.close()

    def get_lab_runs(self, limit: int = 100, symbol: Optional[str] = None, window_days: Optional[int] = None, preset_id: Optional[str] = None) -> List[Dict[str, Any]]:
        clauses = []
        params: List[Any] = []
        if symbol:
            clauses.append("symbol = %s")
            params.append(str(symbol).upper())
        if window_days:
            clauses.append("window_days = %s")
            params.append(int(window_days))
        if preset_id:
            clauses.append("preset_id = %s")
            params.append(str(preset_id))
        where_sql = f"WHERE {' AND '.join(clauses)}" if clauses else ""
        sql = f"""
        SELECT
            id, symbol, window_days, preset_id, spread_model, slippage_model,
            status, config_hash, error_message, created_at, started_at, finished_at
        FROM lab_runs
        {where_sql}
        ORDER BY id DESC
        LIMIT %s
        """
        params.append(max(1, min(int(limit), 500)))
        conn = None
        cursor = None
        try:
            conn = self.pool.get_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute(sql, tuple(params))
            return cursor.fetchall() or []
        except Exception as exc:
            self.logger.error(f"Erro ao listar lab runs: {exc}")
            return []
        finally:
            if cursor is not None:
                cursor.close()
            if conn is not None:
                conn.close()

    def get_lab_run_detail(self, run_id: int) -> Dict[str, Any]:
        conn = None
        cursor = None
        try:
            conn = self.pool.get_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                """
                SELECT
                    id, symbol, window_days, preset_id, spread_model, slippage_model,
                    status, config_snapshot_json, config_hash, error_message,
                    created_at, started_at, finished_at
                FROM lab_runs
                WHERE id = %s
                """,
                (int(run_id),),
            )
            run = cursor.fetchone()
            if not run:
                return {}
            cursor.execute(
                """
                SELECT id, run_id, symbol, window_days, preset_id, config_hash, score, score_breakdown_json, metrics_json, created_at
                FROM lab_results
                WHERE run_id = %s
                ORDER BY score DESC, id ASC
                """,
                (int(run_id),),
            )
            results = cursor.fetchall() or []
            for row in results:
                for key in ("score_breakdown_json", "metrics_json"):
                    raw = row.get(key)
                    if isinstance(raw, str):
                        try:
                            row[key.replace("_json", "")] = json.loads(raw)
                        except Exception:
                            row[key.replace("_json", "")] = {}
                    elif isinstance(raw, dict):
                        row[key.replace("_json", "")] = raw
                    else:
                        row[key.replace("_json", "")] = {}
            run["results"] = results
            return run
        except Exception as exc:
            self.logger.error(f"Erro ao carregar detalhe do lab run {run_id}: {exc}")
            return {}
        finally:
            if cursor is not None:
                cursor.close()
            if conn is not None:
                conn.close()

    def get_lab_ranking(self, symbol: Optional[str] = None, window_days: Optional[int] = None, preset_id: Optional[str] = None, limit: int = 100) -> List[Dict[str, Any]]:
        clauses = []
        params: List[Any] = []
        if symbol:
            clauses.append("r.symbol = %s")
            params.append(str(symbol).upper())
        if window_days:
            clauses.append("r.window_days = %s")
            params.append(int(window_days))
        if preset_id:
            clauses.append("r.preset_id = %s")
            params.append(str(preset_id))
        where_sql = f"WHERE {' AND '.join(clauses)}" if clauses else ""
        sql = f"""
        SELECT
            r.symbol,
            r.window_days,
            r.preset_id,
            COUNT(*) AS sample_size,
            ROUND(AVG(r.score), 2) AS avg_score,
            ROUND(MAX(r.score), 2) AS best_score,
            ROUND(AVG(JSON_EXTRACT(r.metrics_json, '$.total_pnl_points')), 2) AS avg_pnl_points,
            ROUND(AVG(JSON_EXTRACT(r.metrics_json, '$.win_rate')), 2) AS avg_win_rate
        FROM lab_results r
        {where_sql}
        GROUP BY r.symbol, r.window_days, r.preset_id
        ORDER BY avg_score DESC, best_score DESC
        LIMIT %s
        """
        params.append(max(1, min(int(limit), 500)))
        conn = None
        cursor = None
        try:
            conn = self.pool.get_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute(sql, tuple(params))
            return cursor.fetchall() or []
        except Exception as exc:
            self.logger.error(f"Erro ao carregar ranking do strategy lab: {exc}")
            return []
        finally:
            if cursor is not None:
                cursor.close()
            if conn is not None:
                conn.close()

    def save_notification(self, event: dict):
        """Registra auditoria de notificacao emitida/suprimida."""
        sql = """
        INSERT INTO notification_events (
            event_key, event_type, category, priority, severity, symbol, ticket, side, rule_id, message,
            price, sl, tp, metadata_json, status, suppression_reason, aggregated_count,
            delivery_channel, delivery_status, delivery_error, delivered_at, is_read, read_at, created_at
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s, %s
        )
        """
        delivered_at = event.get("delivered_at")
        delivered_at_dt = None
        if delivered_at:
            try:
                delivered_at_dt = datetime.fromisoformat(str(delivered_at))
            except Exception:
                delivered_at_dt = None
        created_at = event.get("timestamp")
        created_at_dt = datetime.now()
        if created_at:
            try:
                created_at_dt = datetime.fromisoformat(str(created_at))
            except Exception:
                created_at_dt = datetime.now()

        data = (
            event.get("event_key"),
            event.get("event_type"),
            event.get("category"),
            event.get("priority"),
            event.get("severity"),
            event.get("symbol"),
            event.get("ticket"),
            event.get("side"),
            event.get("rule_id"),
            event.get("message"),
            event.get("price"),
            event.get("sl"),
            event.get("tp"),
            json.dumps(event.get("metadata") or {}, ensure_ascii=False),
            event.get("status"),
            event.get("suppression_reason"),
            int(event.get("aggregated_count") or 1),
            event.get("delivery_channel"),
            event.get("delivery_status"),
            event.get("delivery_error"),
            delivered_at_dt,
            0,
            None,
            created_at_dt,
        )

        conn = None
        cursor = None
        try:
            conn = self.pool.get_connection()
            cursor = conn.cursor()
            cursor.execute(sql, data)
            conn.commit()
        except Exception as exc:
            self.logger.error(f"Erro ao salvar notificacao: {exc}")
        finally:
            if cursor is not None:
                cursor.close()
            if conn is not None:
                conn.close()

    def get_notifications(self, limit=100):
        sql = """
        SELECT
            id, event_key, event_type, category, priority, severity, symbol, ticket, side, rule_id, message,
            price, sl, tp, metadata_json, status, suppression_reason, aggregated_count,
            delivery_channel, delivery_status, delivery_error, delivered_at, is_read, read_at, created_at
        FROM notification_events
        ORDER BY id DESC
        LIMIT %s
        """
        conn = None
        cursor = None
        try:
            conn = self.pool.get_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute(sql, (int(limit),))
            rows = cursor.fetchall()
            for row in rows:
                raw = row.get("metadata_json")
                if isinstance(raw, str):
                    try:
                        row["metadata"] = json.loads(raw)
                    except Exception:
                        row["metadata"] = {}
                elif isinstance(raw, dict):
                    row["metadata"] = raw
                else:
                    row["metadata"] = {}
                row["is_read"] = bool(row.get("is_read"))
            return rows
        except Exception as exc:
            self.logger.error(f"Erro ao carregar notificacoes: {exc}")
            return []
        finally:
            if cursor is not None:
                cursor.close()
            if conn is not None:
                conn.close()

    def get_notification_metrics(self):
        sql = """
        SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) AS unread_count,
            SUM(CASE WHEN status IN ('emitted', 'delivery_failed') THEN 1 ELSE 0 END) AS emitted,
            SUM(CASE WHEN status = 'suppressed' THEN 1 ELSE 0 END) AS suppressed,
            SUM(CASE WHEN status = 'delivery_failed' THEN 1 ELSE 0 END) AS delivery_failed
        FROM notification_events
        """
        conn = None
        cursor = None
        try:
            conn = self.pool.get_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute(sql)
            row = cursor.fetchone() or {}
            return {
                "total": int(row.get("total") or 0),
                "unread_count": int(row.get("unread_count") or 0),
                "emitted": int(row.get("emitted") or 0),
                "suppressed": int(row.get("suppressed") or 0),
                "delivery_failed": int(row.get("delivery_failed") or 0),
            }
        except Exception as exc:
            self.logger.error(f"Erro ao carregar metricas de notificacao: {exc}")
            return {"total": 0, "unread_count": 0, "emitted": 0, "suppressed": 0, "delivery_failed": 0}
        finally:
            if cursor is not None:
                cursor.close()
            if conn is not None:
                conn.close()

    def mark_notification_read(self, notification_id: int):
        sql = """
        UPDATE notification_events
        SET is_read = 1, read_at = %s
        WHERE id = %s AND is_read = 0
        """
        conn = None
        cursor = None
        try:
            conn = self.pool.get_connection()
            cursor = conn.cursor()
            cursor.execute(sql, (datetime.now(), int(notification_id)))
            conn.commit()
            return int(cursor.rowcount or 0)
        except Exception as exc:
            self.logger.error(f"Erro ao marcar notificacao como lida: {exc}")
            return 0
        finally:
            if cursor is not None:
                cursor.close()
            if conn is not None:
                conn.close()

    def mark_all_notifications_read(self):
        sql = """
        UPDATE notification_events
        SET is_read = 1, read_at = %s
        WHERE is_read = 0
        """
        conn = None
        cursor = None
        try:
            conn = self.pool.get_connection()
            cursor = conn.cursor()
            cursor.execute(sql, (datetime.now(),))
            conn.commit()
            return int(cursor.rowcount or 0)
        except Exception as exc:
            self.logger.error(f"Erro ao marcar todas notificacoes como lidas: {exc}")
            return 0
        finally:
            if cursor is not None:
                cursor.close()
            if conn is not None:
                conn.close()

    def delete_notification(self, notification_id: int):
        sql = "DELETE FROM notification_events WHERE id = %s"
        conn = None
        cursor = None
        try:
            conn = self.pool.get_connection()
            cursor = conn.cursor()
            cursor.execute(sql, (int(notification_id),))
            conn.commit()
            return int(cursor.rowcount or 0)
        except Exception as exc:
            self.logger.error(f"Erro ao deletar notificacao: {exc}")
            return 0
        finally:
            if cursor is not None:
                cursor.close()
            if conn is not None:
                conn.close()

    def clear_notifications(self):
        sql = "DELETE FROM notification_events"
        conn = None
        cursor = None
        try:
            conn = self.pool.get_connection()
            cursor = conn.cursor()
            cursor.execute(sql)
            conn.commit()
            return int(cursor.rowcount or 0)
        except Exception as exc:
            self.logger.error(f"Erro ao limpar notificacoes: {exc}")
            return 0
        finally:
            if cursor is not None:
                cursor.close()
            if conn is not None:
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
