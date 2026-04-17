import json
import os
import signal
import subprocess
import sys
import time
import ctypes
from datetime import datetime
from typing import List, Optional

import mysql.connector
import threading
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
import bcrypt
from pydantic import BaseModel

# --- CONFIGURACOES ---
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
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

# Usuário único para esta fase
FAKE_USER = {
    "username": "admin",
    "password_hash": "$2b$12$VotrRxChzL6yao3KBxJuYOwqlQxZzHwO1uNreMHJzBXawrTwmRZ06" # admin123
}

# bcrypt usado diretamente (passlib incompatível com bcrypt 5.x no Python 3.14)
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
    with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
        json.dump(update.settings, f, indent=4, ensure_ascii=False)
    return {"message": "Configuracoes atualizadas."}

@app.get("/runtime")
def get_runtime(user: str = Depends(get_current_user)):
    if not os.path.exists(FIMATHE_RUNTIME_FILE):
        return {"symbols": {}, "recent_events": []}
    with open(FIMATHE_RUNTIME_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

@app.get("/metrics")
def get_metrics(user: str = Depends(get_current_user)):
    """Versão simplificada de métricas para o monitor."""
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
    """Estatísticas avançadas para o Dashboard de BI."""
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
        
        # 3. Histórico de Trades para Curva de Equity (ordenado por saída)
        cursor.execute("""
            SELECT ticket, symbol, pnl, exit_time 
            FROM trades 
            WHERE status = 'CLOSED'
            ORDER BY exit_time ASC
        """)
        history = cursor.fetchall()
        
        conn.close()
        
        # Processamento de métricas
        total_trades = stats["total_trades"] or 0
        gross_profit = float(stats["gross_profit"] or 0)
        gross_loss = abs(float(stats["gross_loss"] or 0))
        
        profit_factor = (gross_profit / gross_loss) if gross_loss > 0 else (gross_profit if gross_profit > 0 else 0)
        win_rate = (stats["win_count"] / total_trades * 100) if total_trades > 0 else 0
        payoff = (float(stats["avg_win"] or 0) / abs(float(stats["avg_loss"] or 1))) if stats["avg_loss"] else 0
        
        # Cálculo básico de Max Drawdown (Realizado)
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

def background_log_cleaner():
    """Tarefa de segundo plano para limpar logs antigos automaticamente."""
    while True:
        try:
            if os.path.exists(SETTINGS_FILE):
                with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
                    settings = json.load(f)
                
                # O intervalo de limpeza fica em ui_settings para facilitar a edicao na UI
                cleanup_minutes = settings.get("ui_settings", {}).get("log_cleanup_minutes", 0)
                
                if cleanup_minutes > 0:
                    conn = get_db_connection()
                    cursor = conn.cursor()
                    # Deleta logs anteriores ao intervalo definido
                    cursor.execute(
                        "DELETE FROM system_logs WHERE timestamp < NOW() - INTERVAL %s MINUTE",
                        (cleanup_minutes,)
                    )
                    if cursor.rowcount > 0:
                        print(f"[{datetime.now()}] Auto-cleanup: {cursor.rowcount} logs removidos.")
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
