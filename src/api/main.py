import json
import os
import sys
import csv
import io

# --- CONFIGURACAO DE PATH (CRITICO PARA IMPORTACAO DO PACOTE SRC) ---
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import signal
import subprocess
import time
import ctypes
import MetaTrader5 as mt5
from datetime import datetime
from typing import List, Optional

import mysql.connector
import threading
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
import bcrypt
from pydantic import BaseModel

from src.core.database import DatabaseManager
from src.core.settings_schema import SettingsValidationError, validate_and_normalize_settings
from src.notifications import NotificationService
from src.analysis.strategy_lab_service import StrategyLabService

def ensure_mt5():
    if not mt5.initialize():
        # Tenta inicializar novamente se falhou
        if not mt5.initialize():
            return False
    return True

# --- INICIALIZACAO MT5 (GLOBAL PARA PERFORMANCE) ---
ensure_mt5()

# --- CONFIGURACOES ---
SETTINGS_FILE = os.path.join(PROJECT_ROOT, "config", "settings.json")
ROBOT_MAIN_FILE = os.path.join(PROJECT_ROOT, "src", "main.py")
ROBOT_STATE_FILE = os.path.join(PROJECT_ROOT, "config", "robot_runtime.json")
ROBOT_LOG_FILE = os.path.join(PROJECT_ROOT, "logs", "robot_runtime.log")
FIMATHE_RUNTIME_FILE = os.path.join(PROJECT_ROOT, "logs", "fimathe_runtime.json")

app = FastAPI(title="Robo MT5 Management API")

# --- SEGURANCA ---
SECRET_KEY = "robo-mt5-v2-super-secret-key" # Mudar em producao
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 horas

# UsuÃ¡rio Ãºnico para esta fase
FAKE_USER = {
    "username": "admin",
    "password_hash": "$2b$12$VotrRxChzL6yao3KBxJuYOwqlQxZzHwO1uNreMHJzBXawrTwmRZ06" # admin123
}

# bcrypt usado diretamente (passlib incompatÃ­vel com bcrypt 5.x no Python 3.14)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def verify_password(plain_password, hashed_password):
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = time.time() + (ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token invalido ou expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None or username.lower() != FAKE_USER["username"].lower():
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    return username

# Ativar CORS para o Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MODELS ---
class RobotStatus(BaseModel):
    status: str
    pid: Optional[int]
    started_at: Optional[str]

class SettingsUpdate(BaseModel):
    settings: dict

class NotificationTestRequest(BaseModel):
    message: Optional[str] = None
    symbol: Optional[str] = None
    priority: Optional[str] = "P2"
    category: Optional[str] = "health"


class StrategyLabRunRequest(BaseModel):
    symbol: str
    window_days: int = 7
    preset_id: str = "FIM-010"
    override_config: Optional[dict] = None
    spread_model: float = 0.0
    slippage_model: float = 0.0
    timeframe: str = "M15"
    include_pairwise: bool = True

# --- AUXILIARES ---
def _now_iso():
    return datetime.now().isoformat(timespec="seconds")

def is_process_running(pid):
    if not pid: return False
    try:
        pid = int(pid)
        if os.name == "nt":
            PROCESS_QUERY_LIMITED_INFORMATION = 0x1000
            handle = ctypes.windll.kernel32.OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, False, pid)
            if handle:
                ctypes.windll.kernel32.CloseHandle(handle)
                return True
            return False
        os.kill(pid, 0)
        return True
    except Exception: return False

def read_robot_state():
    if not os.path.exists(ROBOT_STATE_FILE): return {}
    try:
        with open(ROBOT_STATE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception: return {}

def write_robot_state(state):
    os.makedirs(os.path.dirname(ROBOT_STATE_FILE), exist_ok=True)
    with open(ROBOT_STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2, ensure_ascii=False)

def get_db_connection():
    # Simplificado, deve ler do settings.json futuramente
    return mysql.connector.connect(
        host="localhost",
        user="mt5_user",
        password="mt5_password",
        database="robo_trading_db"
    )

# --- ENDPOINTS PUBLICOS ---

@app.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    if form_data.username != FAKE_USER["username"] or not verify_password(form_data.password, FAKE_USER["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": form_data.username})
    return {"access_token": access_token, "token_type": "bearer"}

# --- ENDPOINTS PROTEGIDOS ---

@app.get("/status", response_model=RobotStatus)
def get_status(user: str = Depends(get_current_user)):
    state = read_robot_state()
    pid = state.get("pid")
    running = is_process_running(pid)
    return {
        "status": "running" if running else "stopped",
        "pid": pid if running else None,
        "started_at": state.get("started_at") if running else None
    }

@app.post("/start")
def start_robot(user: str = Depends(get_current_user)):
    state = read_robot_state()
    if is_process_running(state.get("pid")):
        return {"message": "Robo ja esta rodando."}

    os.makedirs(os.path.dirname(ROBOT_LOG_FILE), exist_ok=True)
    log_handle = open(ROBOT_LOG_FILE, "a", encoding="utf-8")
    log_handle.write(f"\n\n[{_now_iso()}] === START REQUEST FROM API ===\n")
    log_handle.flush()

    popen_args = {
        "args": [sys.executable, "-u", ROBOT_MAIN_FILE],
        "cwd": PROJECT_ROOT,
        "stdin": subprocess.DEVNULL,
        "stdout": log_handle,
        "stderr": subprocess.STDOUT,
    }

    if os.name == "nt":
        popen_args["creationflags"] = 0x00000200 | 0x00000008 | 0x08000000

    try:
        process = subprocess.Popen(**popen_args)
        new_state = {
            "pid": process.pid,
            "status": "running",
            "started_at": _now_iso(),
        }
        write_robot_state(new_state)
        return {"message": f"Robo iniciado PID {process.pid}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        log_handle.close()

@app.post("/stop")
def stop_robot(user: str = Depends(get_current_user)):
    state = read_robot_state()
    pid = state.get("pid")
    if not is_process_running(pid):
        return {"message": "Robo nao esta rodando."}

    try:
        if os.name == "nt":
            subprocess.run(["taskkill", "/PID", str(pid), "/T", "/F"], capture_output=True)
        else:
            os.kill(int(pid), signal.SIGTERM)
        
        state["status"] = "stopped"
        state["stopped_at"] = _now_iso()
        write_robot_state(state)
        return {"message": "Robo parado com sucesso."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/settings")
def get_settings(user: str = Depends(get_current_user)):
    if not os.path.exists(SETTINGS_FILE):
        return {}
    with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

@app.post("/settings")
def update_settings(update: SettingsUpdate, user: str = Depends(get_current_user)):
    try:
        normalized_settings = validate_and_normalize_settings(update.settings)
    except SettingsValidationError as exc:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Configuracao invalida. Revise os campos informados.",
                "errors": exc.errors,
            },
        )

    # 1. Salva no arquivo JSON (Cache Local/Resiliencia)
    with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
        json.dump(normalized_settings, f, indent=4, ensure_ascii=False)
    
    # 2. Salva no Banco de Dados (Auditoria Historica)
    try:
        db = DatabaseManager()
        db.save_settings_snapshot(normalized_settings)
    except Exception as e:
        print(f"Erro ao gravar snapshot de settings no DB: {e}")
        # Nao lancamos erro aqui para nao travar o save do arquivo se o DB falhar
        
    return {"message": "Configuracoes atualizadas e snapshot de auditoria criado.", "settings": normalized_settings}

@app.get("/runtime")
def get_runtime(user: str = Depends(get_current_user)):
    if not os.path.exists(FIMATHE_RUNTIME_FILE):
        return {"symbols": {}, "recent_events": []}
    with open(FIMATHE_RUNTIME_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


@app.get("/notifications")
def get_notifications(limit: int = 100, user: str = Depends(get_current_user)):
    try:
        db = DatabaseManager()
        notifications = db.get_notifications(limit=max(1, min(int(limit), 300)))
        metrics = db.get_notification_metrics()
        return {"items": notifications, "metrics": metrics}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/notifications/metrics")
def get_notifications_metrics(user: str = Depends(get_current_user)):
    try:
        db = DatabaseManager()
        return db.get_notification_metrics()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/notifications/{notification_id}/read")
def mark_notification_read(notification_id: int, user: str = Depends(get_current_user)):
    try:
        db = DatabaseManager()
        updated = db.mark_notification_read(notification_id)
        return {"updated": int(updated)}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/notifications/read-all")
def mark_notifications_read_all(user: str = Depends(get_current_user)):
    try:
        db = DatabaseManager()
        updated = db.mark_all_notifications_read()
        return {"updated": int(updated)}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.delete("/notifications/{notification_id}")
def delete_notification(notification_id: int, user: str = Depends(get_current_user)):
    try:
        db = DatabaseManager()
        deleted = db.delete_notification(notification_id)
        return {"deleted": int(deleted)}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.delete("/notifications")
def clear_notifications(user: str = Depends(get_current_user)):
    try:
        db = DatabaseManager()
        deleted = db.clear_notifications()
        return {"deleted": int(deleted)}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/notifications/test")
def send_test_notification(payload: NotificationTestRequest, user: str = Depends(get_current_user)):
    try:
        settings = {}
        if os.path.exists(SETTINGS_FILE):
            with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
                settings = json.load(f)

        notifications_cfg = settings.get("notifications", {}) if isinstance(settings, dict) else {}
        db = DatabaseManager()
        notification_service = NotificationService(db_manager=db, config=notifications_cfg)

        priority = str(payload.priority or "P2").upper()
        if priority not in {"P1", "P2", "P3"}:
            priority = "P2"

        category = str(payload.category or "health").lower()
        if category not in {"execution", "risk", "health", "setup"}:
            category = "health"

        message = (payload.message or "Teste manual de notificacao pela web dashboard.").strip()
        event_payload = {
            "event_type": "MANUAL_TEST",
            "category": category,
            "priority": priority,
            "severity": "high" if priority == "P1" else "medium",
            "message": message,
            "symbol": (payload.symbol or None),
            "rule_id": "FIM-TEST",
            "metadata": {"source": "web_dashboard", "user": user},
        }

        result = notification_service.emit(event_payload)
        return {"ok": True, "result": result}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/lab/runs")
def create_strategy_lab_run(payload: StrategyLabRunRequest, user: str = Depends(get_current_user)):
    try:
        if payload.window_days not in {2, 7, 14}:
            raise HTTPException(status_code=422, detail="window_days deve ser 2, 7 ou 14.")
        service = StrategyLabService(DatabaseManager())
        run = service.execute_run(
            symbol=payload.symbol,
            window_days=int(payload.window_days),
            preset_id=payload.preset_id,
            override_config=payload.override_config,
            spread_model=float(payload.spread_model),
            slippage_model=float(payload.slippage_model),
            timeframe=payload.timeframe,
            include_pairwise=bool(payload.include_pairwise),
        )
        return {"ok": True, "run": run}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/lab/runs")
def list_strategy_lab_runs(
    limit: int = 60,
    symbol: Optional[str] = None,
    window_days: Optional[int] = None,
    preset_id: Optional[str] = None,
    user: str = Depends(get_current_user),
):
    try:
        service = StrategyLabService(DatabaseManager())
        items = service.list_runs(limit=limit, symbol=symbol, window_days=window_days, preset_id=preset_id)
        return {"items": items}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/lab/runs/{run_id}")
def get_strategy_lab_run_detail(run_id: int, user: str = Depends(get_current_user)):
    try:
        service = StrategyLabService(DatabaseManager())
        detail = service.run_detail(run_id=run_id)
        if not detail:
            raise HTTPException(status_code=404, detail="Run de laboratorio nao encontrado.")
        return detail
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/lab/ranking")
def get_strategy_lab_ranking(
    symbol: Optional[str] = None,
    window_days: Optional[int] = None,
    preset_id: Optional[str] = None,
    limit: int = 100,
    user: str = Depends(get_current_user),
):
    try:
        service = StrategyLabService(DatabaseManager())
        ranking = service.ranking(symbol=symbol, window_days=window_days, preset_id=preset_id, limit=limit)
        return {"items": ranking}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/lab/runs/{run_id}/export")
def export_strategy_lab_run(run_id: int, format: str = "json", user: str = Depends(get_current_user)):
    try:
        service = StrategyLabService(DatabaseManager())
        detail = service.run_detail(run_id=run_id)
        if not detail:
            raise HTTPException(status_code=404, detail="Run de laboratorio nao encontrado.")
        format_key = str(format or "json").lower()
        if format_key == "json":
            return detail
        if format_key != "csv":
            raise HTTPException(status_code=422, detail="Formato invalido. Use json ou csv.")

        rows = detail.get("results") or []
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["run_id", "symbol", "window_days", "preset_id", "config_hash", "score", "total_pnl_points", "win_rate", "profit_factor", "max_drawdown_points"])
        for row in rows:
            metrics = row.get("metrics") or {}
            writer.writerow(
                [
                    detail.get("id"),
                    row.get("symbol"),
                    row.get("window_days"),
                    row.get("preset_id"),
                    row.get("config_hash"),
                    row.get("score"),
                    metrics.get("total_pnl_points"),
                    metrics.get("win_rate"),
                    metrics.get("profit_factor"),
                    metrics.get("max_drawdown_points"),
                ]
            )
        output.seek(0)
        filename = f"strategy_lab_run_{run_id}.csv"
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/api/chart/{symbol}")
def get_chart_data(symbol: str, tf: str = "M15", user: str = Depends(get_current_user)):
    if not ensure_mt5():
        raise HTTPException(status_code=503, detail="MT5 Desconectado no Backend")
    
    # Mapping timeframe string to MT5 timeframe constants
    timeframe_map = {
        "M1": mt5.TIMEFRAME_M1,
        "M5": mt5.TIMEFRAME_M5,
        "M15": mt5.TIMEFRAME_M15,
        "H1": mt5.TIMEFRAME_H1,
        "H4": mt5.TIMEFRAME_H4,
        "D1": mt5.TIMEFRAME_D1,
    }
    
    mt5_tf = timeframe_map.get(tf.upper(), mt5.TIMEFRAME_M15)
    
    # Fetch last 500 candles
    rates = mt5.copy_rates_from_pos(symbol.upper(), mt5_tf, 0, 500)
    
    if rates is None or len(rates) == 0:
        # Tenta selecionar o simbolo se nao estiver visivel
        mt5.symbol_select(symbol.upper(), True)
        rates = mt5.copy_rates_from_pos(symbol.upper(), mt5_tf, 0, 500)
        
    if rates is None or len(rates) == 0:
        raise HTTPException(status_code=404, detail=f"Dados do ativo {symbol} não acessíveis ou ativo inválido.")
        
    formatted_data = []
    for rate in rates:
        formatted_data.append({
            "time": int(rate['time']),
            "open": float(rate['open']),
            "high": float(rate['high']),
            "low": float(rate['low']),
            "close": float(rate['close'])
        })
        
    return formatted_data

@app.get("/metrics")
def get_metrics(user: str = Depends(get_current_user)):
    """VersÃ£o simplificada de mÃ©tricas para o monitor."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT SUM(pnl) as total_pnl, COUNT(*) as total_trades FROM trades WHERE status = 'CLOSED'")
        summary = cursor.fetchone()
        
        cursor.execute("SELECT COUNT(*) as win_count FROM trades WHERE pnl > 0 AND status = 'CLOSED'")
        wins = cursor.fetchone()
        
        cursor.execute("SELECT * FROM trades ORDER BY exit_time DESC LIMIT 50")
        recent_trades = cursor.fetchall()
        
        conn.close()
        
        total_pnl = summary["total_pnl"] or 0.0
        total_trades = summary["total_trades"] or 0
        win_rate = (wins["win_count"] / total_trades * 100) if total_trades > 0 else 0
        
        return {
            "pnl": total_pnl,
            "win_rate": win_rate,
            "total_trades": total_trades,
            "recent_trades": recent_trades
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/performance")
def get_performance_stats(user: str = Depends(get_current_user)):
    """EstatÃ­sticas avanÃ§adas para o Dashboard de BI."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # 1. KPIs Agregados
        cursor.execute("""
            SELECT 
                COUNT(*) as total_trades,
                SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) as win_count,
                SUM(CASE WHEN pnl < 0 THEN 1 ELSE 0 END) as loss_count,
                SUM(CASE WHEN pnl > 0 THEN pnl ELSE 0 END) as gross_profit,
                SUM(CASE WHEN pnl < 0 THEN pnl ELSE 0 END) as gross_loss,
                AVG(CASE WHEN pnl > 0 THEN pnl ELSE NULL END) as avg_win,
                AVG(CASE WHEN pnl < 0 THEN pnl ELSE NULL END) as avg_loss
            FROM trades 
            WHERE status = 'CLOSED'
        """)
        stats = cursor.fetchone()
        
        # 2. PnL por Ativo
        cursor.execute("""
            SELECT symbol, SUM(pnl) as total_pnl, COUNT(*) as trade_count
            FROM trades 
            WHERE status = 'CLOSED'
            GROUP BY symbol
            ORDER BY total_pnl DESC
        """)
        by_asset = cursor.fetchall()
        
        # 3. HistÃ³rico de Trades para Curva de Equity (ordenado por saÃ­da)
        cursor.execute("""
            SELECT ticket, symbol, pnl, exit_time 
            FROM trades 
            WHERE status = 'CLOSED'
            ORDER BY exit_time ASC
        """)
        history = cursor.fetchall()
        
        conn.close()
        
        # Processamento de mÃ©tricas
        total_trades = stats["total_trades"] or 0
        gross_profit = float(stats["gross_profit"] or 0)
        gross_loss = abs(float(stats["gross_loss"] or 0))
        
        profit_factor = (gross_profit / gross_loss) if gross_loss > 0 else (gross_profit if gross_profit > 0 else 0)
        win_rate = (stats["win_count"] / total_trades * 100) if total_trades > 0 else 0
        payoff = (float(stats["avg_win"] or 0) / abs(float(stats["avg_loss"] or 1))) if stats["avg_loss"] else 0
        
        # CÃ¡lculo bÃ¡sico de Max Drawdown (Realizado)
        cumulative_pnl = 0.0
        peak = 0.0
        max_dd = 0.0
        pnl_curve = []
        
        for trade in history:
            cumulative_pnl += float(trade["pnl"])
            pnl_curve.append({
                "time": trade["exit_time"].isoformat() if hasattr(trade["exit_time"], "isoformat") else str(trade["exit_time"]),
                "pnl": round(cumulative_pnl, 2),
                "trade_pnl": float(trade["pnl"])
            })
            if cumulative_pnl > peak:
                peak = cumulative_pnl
            drawdown = peak - cumulative_pnl
            if drawdown > max_dd:
                max_dd = drawdown

        return {
            "summary": {
                "total_trades": total_trades,
                "win_rate": round(win_rate, 2),
                "profit_factor": round(profit_factor, 2),
                "payoff": round(payoff, 2),
                "max_drawdown": round(max_dd, 2),
                "total_pnl": round(cumulative_pnl, 2),
            },
            "by_asset": by_asset,
            "pnl_curve": pnl_curve,
            "win_loss_distribution": {
                "wins": stats["win_count"],
                "losses": stats["loss_count"]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/logs")
def get_logs(limit: int = 100, user: str = Depends(get_current_user)):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM system_logs ORDER BY timestamp DESC LIMIT %s", (limit,))
        logs = cursor.fetchall()
        conn.close()
        return logs
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/logs")
def clear_logs(user: str = Depends(get_current_user)):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM system_logs")
        conn.commit()
        conn.close()
        return {"message": "Banco de dados de logs limpo com sucesso."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/maintenance/reset-data")
def reset_data(user: str = Depends(get_current_user)):
    """Limpa todo o histÃ³rico de trades e eventos do dashboard."""
    try:
        # 1. Verifica se o robÃ´ estÃ¡ rodando (opcional, mas recomendado)
        # Por simplicidade, vamos permitir, mas logar
        print(f"[{datetime.now()}] RESET DE DADOS solicitado por {user}")

        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 2. Limpa histÃ³rico de trades
        cursor.execute("DELETE FROM trades")
        
        # 3. Limpa logs do sistema
        cursor.execute("DELETE FROM system_logs")
        
        conn.commit()
        conn.close()

        # 4. Limpa eventos recentes do snapshot runtime
        if os.path.exists(RUNTIME_FILE):
            try:
                with open(RUNTIME_FILE, "r", encoding="utf-8") as f:
                    runtime = json.load(f)
                
                runtime["recent_events"] = []
                # TambÃ©m poderÃ­amos zerar estatÃ­sticas globais aqui se existirem
                
                with open(RUNTIME_FILE, "w", encoding="utf-8") as f:
                    json.dump(runtime, f, indent=2, ensure_ascii=False)
            except Exception as e:
                print(f"Erro ao limpar runtime events: {e}")

        return {"message": "Dados de histÃ³rico e eventos limpos com sucesso."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def background_log_cleaner():
    """Tarefa de segundo plano para limpeza inteligente de logs baseada em tempo ou quantidade."""
    while True:
        try:
            if os.path.exists(SETTINGS_FILE):
                with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
                    settings = json.load(f)
                
                # Suporte ao novo formato log_management ou fallback para o antigo ui_settings
                log_mgr = settings.get("log_management", {})
                mode = log_mgr.get("mode", "minutes")
                limit = log_mgr.get("value", settings.get("ui_settings", {}).get("log_cleanup_minutes", 0))
                
                if limit > 0:
                    conn = get_db_connection()
                    cursor = conn.cursor()
                    
                    if mode == "minutes":
                        # Deleta logs anteriores ao intervalo de minutos
                        cursor.execute(
                            "DELETE FROM system_logs WHERE timestamp < NOW() - INTERVAL %s MINUTE",
                            (limit,)
                        )
                    else:
                        # Modo Quantidade: Mantem apenas os ultimos X registros
                        # Usamos uma subquery para evitar o erro de deletar da mesma tabela sendo selecionada
                        query = """
                        DELETE FROM system_logs 
                        WHERE id NOT IN (
                            SELECT id FROM (
                                SELECT id FROM system_logs 
                                ORDER BY id DESC 
                                LIMIT %s
                            ) as tmp
                        )
                        """
                        cursor.execute(query, (limit,))

                    if cursor.rowcount > 0:
                        print(f"[{datetime.now()}] [Auto-Cleanup] Modo: {mode} | Valor: {limit} | {cursor.rowcount} logs removidos.")
                    
                    conn.commit()
                    conn.close()
        except Exception as e:
            print(f"Erro no background cleaner: {e}")
        
        time.sleep(60) # Verifica a cada minuto

# Inicia a thread de limpeza automatica
threading.Thread(target=background_log_cleaner, daemon=True).start()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

