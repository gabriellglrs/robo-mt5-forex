import json
import os
import signal
import subprocess
import sys
import time
import ctypes
from copy import deepcopy
from datetime import datetime

import pandas as pd
import plotly.express as px
import streamlit as st
from streamlit_autorefresh import st_autorefresh

from styles import get_custom_css

SETTINGS_FILE = "config/settings.json"
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
ROBOT_MAIN_FILE = os.path.join(PROJECT_ROOT, "src", "main.py")
ROBOT_STATE_FILE = os.path.join(PROJECT_ROOT, "config", "robot_runtime.json")
ROBOT_LOG_FILE = os.path.join(PROJECT_ROOT, "logs", "robot_runtime.log")
FIMATHE_RUNTIME_FILE = os.path.join(PROJECT_ROOT, "logs", "fimathe_runtime.json")

PAGE_DASHBOARD = "Dashboard de Performance"
PAGE_SETTINGS = "Configuracoes do Robo"
PAGE_LOGS = "Auditoria e Logs"

TIMEFRAME_OPTIONS = ["M1", "M5", "M15", "M30", "H1", "H4", "D1"]
STRATEGY_NAME = "fimathe"
STRATEGY_LABEL = "Fimathe"
LOT_MODE_OPTIONS = ["fixed", "risk_percent"]
SL_TP_MODE_OPTIONS = ["fimathe", "fixed", "dynamic"]
FOREX_SYMBOL_OPTIONS = [
    "EURUSD",
    "GBPUSD",
    "USDJPY",
    "USDCHF",
    "USDCAD",
    "AUDUSD",
    "NZDUSD",
    "EURJPY",
    "GBPJPY",
    "EURGBP",
    "EURAUD",
    "AUDJPY",
    "CADJPY",
    "CHFJPY",
    "GBPAUD",
]

LOT_MODE_LABELS = {
    "fixed": "Lote fixo",
    "risk_percent": "Risco percentual",
}
SL_TP_MODE_LABELS = {
    "fimathe": "Fimathe estrutural",
    "fixed": "Fixo",
    "dynamic": "Dinamico por nivel",
}
FIMATHE_REASON_LABELS = {
    "setup_pronto": "Setup pronto",
    "sem_dados_timeframe": "Sem dados suficientes",
    "mercado_lateral": "Mercado lateral",
    "sem_regiao_ab": "Sem regiao A/B valida",
    "aguardando_rompimento_canal": "Aguardando rompimento do canal",
    "aguardando_pullback": "Aguardando pullback",
    "aguardando_agrupamento": "Aguardando agrupamento no tempo menor",
    "fora_da_regiao_negociavel": "Fora da regiao negociavel",
    "longe_do_nivel_sr": "Longe do nivel S/R",
}
FIMATHE_RULE_LABELS = {
    "FIM-001": "FIM-001 | Coleta de dados",
    "FIM-002": "FIM-002 | Classificacao de mercado",
    "FIM-003": "FIM-003 | Marcacao A/B",
    "FIM-004": "FIM-004 | Projecao da estrutura",
    "FIM-005": "FIM-005 | Regiao negociavel",
    "FIM-006": "FIM-006 | Agrupamento",
    "FIM-007": "FIM-007 | Rompimento/reteste",
    "FIM-008": "FIM-008 | Anti-achometro",
    "FIM-009": "FIM-009 | Stop inicial tecnico",
    "FIM-010": "FIM-010 | Stop por ciclo (topo/50/100)",
    "FIM-011": "FIM-011 | Limite de risco por ordem",
    "FIM-012": "FIM-012 | Alvo por projecao",
    "FIM-013": "FIM-013 | Limites de exposicao",
    "FIM-014": "FIM-014 | Transparencia operacional",
}
FIMATHE_PHASE_LABELS = {
    "monitoramento": "Monitorando",
    "dados": "Coletando dados",
    "tendencia": "Tendencia lateral",
    "rompimento": "Aguardando rompimento",
    "pullback": "Aguardando pullback",
    "sr": "Fora da regiao S/R",
    "entrada": "Entrada pronta",
    "gestao_risco": "Gestao de risco ativa",
    "limite": "Limite de posicoes",
    "erro": "Erro no monitoramento",
}
FIMATHE_PHASE_COLORS = {
    "monitoramento": "#38bdf8",
    "dados": "#f59e0b",
    "tendencia": "#f59e0b",
    "rompimento": "#22d3ee",
    "pullback": "#22d3ee",
    "sr": "#f97316",
    "entrada": "#22c55e",
    "gestao_risco": "#8b5cf6",
    "limite": "#ef4444",
    "erro": "#ef4444",
}

DEFAULT_SETTINGS = {
    "analysis": {
        "symbols": ["EURUSD"],
        "history_years": 10,
        "wick_sensitivity": 0.3,
        "strategy_mode": STRATEGY_NAME,
        "timeframes": ["M5"],
        "mtf_confluence": True,
    },
    "signal_logic": {
        "trend_timeframe": "H1",
        "entry_timeframe": "M15",
        "trend_candles": 200,
        "trend_min_slope_points": 0.20,
        "entry_lookback_candles": 50,
        "ab_lookback_candles": 80,
        "breakout_buffer_points": 10,
        "pullback_tolerance_points": 20,
        "require_channel_break": True,
        "require_pullback_retest": True,
        "require_grouping": True,
        "grouping_window_candles": 12,
        "grouping_range_max_points": 180,
        "grouping_body_max_points": 60,
        "require_sr_touch": True,
        "sr_tolerance_points": 35,
    },
    "risk_management": {
        "lot_mode": "fixed",
        "fixed_lot": 0.01,
        "risk_percentage": 1.0,
        "risk_max_per_trade_percent": 3.0,
        "sl_tp_mode": "fimathe",
        "sl_points": 300,
        "tp_points": 600,
        "fimathe_target_level": "80",
        "fimathe_stop_buffer_points": 15,
        "max_open_positions": 1,
        "symbol_cooldown_seconds": 300,
        "trailing_enabled": True,
        "trailing_activation_points": 150,
        "trailing_sl_distance_points": 120,
        "trailing_tp_enabled": True,
        "trailing_tp_distance_points": 250,
        "trailing_update_min_step_points": 20,
        "trailing_update_cooldown_seconds": 3,
        "fimathe_cycle_enabled": True,
        "fimathe_cycle_top_level": "80",
        "fimathe_cycle_top_retrace_points": 45,
        "fimathe_cycle_min_profit_points": 80,
        "fimathe_cycle_protection_buffer_points": 12,
        "fimathe_cycle_breakeven_offset_points": 5,
        "magic_number": 202404,
        "use_breakeven": False,
        "breakeven_trigger_points": 120,
        "breakeven_offset_points": 5,
    },
    "connection": {
        "path": "",
        "login": 0,
        "password": "",
        "server": "",
    },
    "ui_settings": {
        "refresh_rate_seconds": 10,
        "auto_start_robot": False,
        "analysis_flow_interval_seconds": 15,
    },
}


def deep_merge(default_data, current_data):
    """Merge recursivo: preserva defaults e aplica valores atuais."""
    if not isinstance(default_data, dict):
        return current_data if current_data is not None else default_data

    merged = deepcopy(default_data)
    if not isinstance(current_data, dict):
        return merged

    for key, value in current_data.items():
        if key in merged and isinstance(merged[key], dict) and isinstance(value, dict):
            merged[key] = deep_merge(merged[key], value)
        else:
            merged[key] = value

    return merged


def normalize_settings(raw_settings):
    settings = deep_merge(DEFAULT_SETTINGS, raw_settings)

    if not settings["analysis"].get("symbols"):
        settings["analysis"]["symbols"] = ["EURUSD"]

    if not settings["analysis"].get("timeframes"):
        settings["analysis"]["timeframes"] = ["M5"]

    # Projeto limpo para estrategia unica.
    settings["analysis"]["strategy_mode"] = STRATEGY_NAME

    signal_cfg = settings["signal_logic"]
    signal_cfg.setdefault("trend_timeframe", "H1")
    signal_cfg.setdefault("entry_timeframe", "M15")
    signal_cfg.setdefault("trend_candles", 200)
    signal_cfg.setdefault("trend_min_slope_points", 0.20)
    signal_cfg.setdefault("entry_lookback_candles", 50)
    signal_cfg.setdefault("ab_lookback_candles", 80)
    signal_cfg.setdefault("breakout_buffer_points", 10)
    signal_cfg.setdefault("pullback_tolerance_points", 20)
    signal_cfg.setdefault("require_channel_break", True)
    signal_cfg.setdefault("require_pullback_retest", True)
    signal_cfg.setdefault("require_grouping", True)
    signal_cfg.setdefault("grouping_window_candles", 12)
    signal_cfg.setdefault("grouping_range_max_points", 180)
    signal_cfg.setdefault("grouping_body_max_points", 60)
    signal_cfg.setdefault("require_sr_touch", True)
    signal_cfg.setdefault("sr_tolerance_points", 35)

    # Mantem legado sincronizado para componentes antigos.
    trend_tf = str(signal_cfg.get("trend_timeframe", "H1")).upper()
    entry_tf = str(signal_cfg.get("entry_timeframe", "M15")).upper()
    settings["analysis"]["timeframes"] = list(dict.fromkeys([entry_tf, trend_tf]))

    return settings


def load_settings():
    if not os.path.exists(SETTINGS_FILE):
        return deepcopy(DEFAULT_SETTINGS)

    try:
        with open(SETTINGS_FILE, "r", encoding="utf-8") as file_handle:
            raw = json.load(file_handle)
        return normalize_settings(raw)
    except Exception as exc:
        st.warning(f"Falha ao ler configuracoes ({exc}). Usando padrao seguro.")
        return deepcopy(DEFAULT_SETTINGS)


def save_settings(new_settings):
    os.makedirs(os.path.dirname(SETTINGS_FILE), exist_ok=True)
    with open(SETTINGS_FILE, "w", encoding="utf-8") as file_handle:
        json.dump(new_settings, file_handle, indent=4, ensure_ascii=False)
    st.success("Configuracoes salvas com sucesso.")


def _now_iso():
    return datetime.now().isoformat(timespec="seconds")


def read_robot_state():
    if not os.path.exists(ROBOT_STATE_FILE):
        return {}
    try:
        with open(ROBOT_STATE_FILE, "r", encoding="utf-8") as file_handle:
            return json.load(file_handle)
    except Exception:
        return {}


def write_robot_state(state):
    os.makedirs(os.path.dirname(ROBOT_STATE_FILE), exist_ok=True)
    with open(ROBOT_STATE_FILE, "w", encoding="utf-8") as file_handle:
        json.dump(state, file_handle, indent=2, ensure_ascii=False)


def is_process_running(pid):
    if not pid:
        return False

    try:
        pid = int(pid)
    except (TypeError, ValueError):
        return False

    try:
        if os.name == "nt":
            PROCESS_QUERY_LIMITED_INFORMATION = 0x1000
            handle = ctypes.windll.kernel32.OpenProcess(
                PROCESS_QUERY_LIMITED_INFORMATION,
                False,
                int(pid),
            )
            if handle:
                ctypes.windll.kernel32.CloseHandle(handle)
                return True
            return False

        os.kill(pid, 0)
        return True
    except Exception:
        return False


def get_robot_runtime_status():
    state = read_robot_state()
    pid = state.get("pid")
    running = is_process_running(pid)
    return running, state


def start_robot_process():
    running, state = get_robot_runtime_status()
    if running:
        return False, f"Robô já está em execução (PID {state.get('pid')})."

    if not os.path.exists(ROBOT_MAIN_FILE):
        return False, "Arquivo src/main.py não encontrado."

    os.makedirs(os.path.dirname(ROBOT_LOG_FILE), exist_ok=True)
    log_handle = open(ROBOT_LOG_FILE, "a", encoding="utf-8")
    log_handle.write(f"\n\n[{_now_iso()}] === START REQUEST FROM DASHBOARD ===\n")
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
        state = {
            "pid": process.pid,
            "status": "running",
            "started_at": _now_iso(),
            "python": sys.executable,
            "entrypoint": ROBOT_MAIN_FILE,
            "log_file": ROBOT_LOG_FILE,
        }
        write_robot_state(state)
        return True, f"Robô iniciado com sucesso (PID {process.pid})."
    except Exception as exc:
        return False, f"Falha ao iniciar o robô: {exc}"
    finally:
        log_handle.close()


def stop_robot_process():
    running, state = get_robot_runtime_status()
    pid = state.get("pid")

    if not pid:
        return False, "Nenhum PID registrado para o robô."

    if not running:
        state["status"] = "stopped"
        state["stopped_at"] = _now_iso()
        write_robot_state(state)
        return False, "Robô já estava parado."

    try:
        if os.name == "nt":
            subprocess.run(
                ["taskkill", "/PID", str(pid), "/T", "/F"],
                capture_output=True,
                text=True,
                check=False,
            )
        else:
            os.kill(int(pid), signal.SIGTERM)
    except Exception as exc:
        return False, f"Falha ao parar o robô: {exc}"

    time.sleep(1)
    still_running = is_process_running(pid)
    if still_running:
        return False, f"Robô ainda está em execução (PID {pid})."

    state["status"] = "stopped"
    state["stopped_at"] = _now_iso()
    write_robot_state(state)
    return True, f"Robô parado com sucesso (PID {pid})."


def read_log_tail(path, max_lines=120):
    if not os.path.exists(path):
        return ""
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as file_handle:
            lines = file_handle.readlines()
        return "".join(lines[-max_lines:])
    except Exception as exc:
        return f"Falha ao ler log: {exc}"


def read_fimathe_runtime_snapshot():
    if not os.path.exists(FIMATHE_RUNTIME_FILE):
        return {}
    try:
        with open(FIMATHE_RUNTIME_FILE, "r", encoding="utf-8") as file_handle:
            return json.load(file_handle)
    except Exception:
        return {}


def format_symbol_pair(symbol):
    symbol = str(symbol or "").upper().strip()
    if len(symbol) == 6:
        return f"{symbol[:3]}/{symbol[3:]}"
    return symbol


def format_runtime_age(updated_at):
    if not updated_at:
        return "-"
    try:
        updated = datetime.fromisoformat(str(updated_at))
        delta = datetime.now() - updated
        seconds = max(0, int(delta.total_seconds()))
        if seconds < 60:
            return f"{seconds}s atras"
        if seconds < 3600:
            return f"{seconds // 60}min atras"
        return f"{seconds // 3600}h atras"
    except Exception:
        return str(updated_at)


def detect_robot_by_heartbeat(db_conn, alive_seconds=120):
    """Desativado: não usa mais system_logs para status."""
    return False, None, None


def clear_robot_log_file():
    try:
        os.makedirs(os.path.dirname(ROBOT_LOG_FILE), exist_ok=True)
        with open(ROBOT_LOG_FILE, "w", encoding="utf-8") as file_handle:
            file_handle.write(f"[{_now_iso()}] Log limpo via dashboard.\n")
        return True, "Log de execucao do robo foi limpo."
    except Exception as exc:
        return False, f"Falha ao limpar log do robo: {exc}"


def clear_system_logs_db():
    host = os.getenv("ROBOT_DB_HOST", "localhost")
    user = os.getenv("ROBOT_DB_USER", "mt5_user")
    password = os.getenv("ROBOT_DB_PASSWORD", "mt5_password")
    database = os.getenv("ROBOT_DB_NAME", "robo_trading_db")

    try:
        import mysql.connector
    except Exception as exc:
        return False, f"MySQL connector indisponivel: {exc}"

    connection = None
    cursor = None
    try:
        connection = mysql.connector.connect(
            host=host,
            user=user,
            password=password,
            database=database,
        )
        cursor = connection.cursor()
        # TRUNCATE limpa a tabela inteira de forma imediata.
        try:
            cursor.execute("TRUNCATE TABLE system_logs")
            affected_rows = 0
        except Exception:
            # Fallback para ambientes sem permissão de TRUNCATE.
            cursor.execute("DELETE FROM system_logs")
            affected_rows = cursor.rowcount if cursor.rowcount is not None else 0
        connection.commit()
        return True, f"Fluxo de Analise limpo no banco ({affected_rows} registros removidos)."
    except Exception as exc:
        return False, f"Falha ao limpar Fluxo de Analise no banco: {exc}"
    finally:
        try:
            if cursor is not None:
                cursor.close()
            if connection is not None and connection.is_connected():
                connection.close()
        except Exception:
            pass


def format_analysis_reason(reason):
    return FIMATHE_REASON_LABELS.get(reason, str(reason or ""))


def format_rule_label(rule_id):
    if not rule_id:
        return "-"
    return FIMATHE_RULE_LABELS.get(str(rule_id), str(rule_id))


def build_analysis_flow_table(logs_df):
    if logs_df is None or logs_df.empty:
        return pd.DataFrame()

    flow_rows = logs_df[logs_df["module"] == "AnalysisFlow"].copy()
    if flow_rows.empty:
        return pd.DataFrame()

    records = []
    for _, row in flow_rows.iterrows():
        message = row.get("message", "")
        try:
            payload = json.loads(message)
        except Exception:
            continue

        tf_results = payload.get("tf_results", {})
        tf_parts = []
        for tf, tf_data in tf_results.items():
            if isinstance(tf_data, dict):
                summary = ", ".join([f"{k}={v}" for k, v in tf_data.items()])
                tf_parts.append(f"{tf}: {summary}")
            else:
                tf_parts.append(f"{tf}: {tf_data}")

        records.append(
            {
                "timestamp": row.get("timestamp"),
                "symbol": payload.get("symbol"),
                "price": payload.get("price"),
                "status_setup": payload.get("setup_status"),
                "sinal": payload.get("signal") or "-",
                "motivo": format_analysis_reason(payload.get("reason")),
                "tendencia": payload.get("trend_direction"),
                "slope_pts": payload.get("trend_slope_points"),
                "rompeu_canal": payload.get("breakout_ok"),
                "pullback_ok": payload.get("pullback_ok"),
                "perto_sr": "SIM" if payload.get("near_sr") else "NAO",
                "dist_sr_pts": payload.get("nearest_level_points"),
                "tol_sr_pts": payload.get("sr_tolerance_points"),
                "pos_abertas": payload.get("open_positions"),
                "max_posicoes": payload.get("max_open_positions"),
                "scores_tf": " | ".join(tf_parts),
            }
        )

    if not records:
        return pd.DataFrame()

    table_df = pd.DataFrame(records)
    return table_df.sort_values("timestamp", ascending=False)


st.set_page_config(page_title="Robo MT5 v2 - Command Center", layout="wide", page_icon="⚡")
st.markdown(get_custom_css(), unsafe_allow_html=True)

settings = load_settings()

refresh_rate = int(settings.get("ui_settings", {}).get("refresh_rate_seconds", 10) or 0)
auto_start_robot = bool(settings.get("ui_settings", {}).get("auto_start_robot", False))
if refresh_rate > 0:
    st_autorefresh(interval=refresh_rate * 1000, key="data_refresh_timer")

if auto_start_robot and not st.session_state.get("auto_start_attempted"):
    st.session_state["auto_start_attempted"] = True
    running_now, _ = get_robot_runtime_status()
    if not running_now:
        start_ok, start_msg = start_robot_process()
        if start_ok:
            st.sidebar.success("Robô iniciado automaticamente.")
        else:
            st.sidebar.warning(start_msg)

conn = None
conn_error = None
try:
    conn = st.connection("mysql", type="sql")
except Exception as exc:
    conn_error = str(exc)

st.sidebar.title("Centro de Comando")
page = st.sidebar.radio("Navegar para:", [PAGE_DASHBOARD, PAGE_SETTINGS, PAGE_LOGS])

st.sidebar.markdown("---")
st.sidebar.subheader("Integridade do Sistema")

running_sidebar, state_sidebar = get_robot_runtime_status()
if running_sidebar:
    st.sidebar.success("ROBO: AO VIVO")
    st.sidebar.caption(f"PID: {state_sidebar.get('pid')}")
else:
    st.sidebar.warning("ROBO: PARADO")

if conn is None:
    st.sidebar.error("MySQL indisponivel")
    if conn_error:
        st.sidebar.caption(conn_error)
else:
    st.sidebar.info("MySQL Online")

if refresh_rate > 0:
    st.sidebar.caption(f"Auto-update ativo ({refresh_rate}s)")

if page == PAGE_DASHBOARD:
    st.header("Performance")

    if conn is None:
        st.error("Banco de dados indisponivel. Ajuste a conexao na tela Configuracoes do Robo.")
    else:
        try:
            df = conn.query("SELECT * FROM trades ORDER BY entry_time DESC;", ttl=2)

            if df.empty:
                st.info("Aguardando os primeiros trades para gerar estatisticas.")
                st.write("Confirme se o robo (main.py) esta ativo e o Algo Trading do MT5 ligado.")
            else:
                total_pnl = df["pnl"].fillna(0).sum()
                win_rate = (len(df[df["pnl"] > 0]) / len(df) * 100) if len(df) > 0 else 0

                c1, c2, c3 = st.columns(3)
                c1.metric("LUCRO LIQUIDO", f"$ {total_pnl:,.2f}")
                c2.metric("TAXA DE ACERTO", f"{win_rate:.1f}%")
                c3.metric("TRADES EXECUTADOS", len(df))

                st.markdown("<br>", unsafe_allow_html=True)
                col_g1, col_g2 = st.columns(2)

                with col_g1:
                    st.subheader("Curva de Equity")
                    df_e = df.sort_values("entry_time").copy()
                    df_e["profit_cum"] = df_e["pnl"].fillna(0).cumsum()
                    fig = px.line(df_e, x="entry_time", y="profit_cum", template="plotly_dark")
                    fig.update_traces(line_color="#00FFAA", line_width=3)
                    fig.update_layout(paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)")
                    st.plotly_chart(fig, use_container_width=True)

                with col_g2:
                    st.subheader(f"Profit da Estrategia {STRATEGY_LABEL}")
                    strat_df = df.groupby("strategy", dropna=False)["pnl"].sum().reset_index()
                    fig_b = px.bar(strat_df, x="strategy", y="pnl", color="strategy", template="plotly_dark")
                    fig_b.update_layout(paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)")
                    st.plotly_chart(fig_b, use_container_width=True)
        except Exception as exc:
            st.error(f"Falha ao consultar dados de performance: {exc}")

elif page == PAGE_SETTINGS:
    st.header("Painel de Configuracoes")
    st.caption("Todas as mudancas operacionais devem ser feitas por aqui.")

    analysis_cfg = settings["analysis"]
    signal_cfg = settings["signal_logic"]
    risk_cfg = settings["risk_management"]
    conn_cfg = settings["connection"]
    ui_cfg = settings["ui_settings"]

    with st.form("settings_form"):
        col_a, col_b = st.columns(2)

        with col_a:
            st.subheader("Estrategia e Analise")
            st.info(f"Estrategia ativa: {STRATEGY_LABEL} (estrategia unica do robo).")
            current_symbols = [str(item).strip().upper() for item in analysis_cfg.get("symbols", ["EURUSD"]) if str(item).strip()]
            symbol_options = list(dict.fromkeys(FOREX_SYMBOL_OPTIONS + current_symbols))
            selected_symbols = st.multiselect(
                "Selecionar ativos para operar",
                options=symbol_options,
                default=current_symbols,
                help="Marque os ativos desejados. O robô vai operar somente os ativos selecionados.",
            )
            custom_symbols_raw = st.text_input(
                "Ativos extras (opcional, separados por virgula)",
                value="",
                help="Use se seu ativo nao estiver na lista. Exemplo: XAUUSD, EURCHF.",
            )
            history_years = st.number_input(
                "Historico (anos)",
                min_value=1,
                max_value=20,
                value=int(analysis_cfg.get("history_years", 10)),
                help="Quantidade de anos de dados semanais usados para detectar niveis.",
            )
            wick_sensitivity = st.number_input(
                "Sensibilidade de pavio",
                min_value=0.0,
                max_value=5.0,
                value=float(analysis_cfg.get("wick_sensitivity", 0.3)),
                step=0.1,
                help="Ajuste fino para leitura de pavios. Valor maior = filtro mais exigente.",
            )
            mtf_confluence = st.checkbox(
                "Confluencia entre timeframes (Fimathe)",
                value=bool(analysis_cfg.get("mtf_confluence", True)),
                help="Mantem leitura de tendencia no timeframe maior e entrada no menor.",
            )

            st.subheader("Gestao de Risco")
            lot_mode = st.selectbox(
                "Modo de lote",
                LOT_MODE_OPTIONS,
                index=0 if risk_cfg.get("lot_mode", "fixed") == "fixed" else 1,
                format_func=lambda value: LOT_MODE_LABELS.get(value, value),
                help="Define se o volume da ordem sera fixo ou calculado por risco percentual.",
            )
            fixed_lot = st.number_input(
                "Lote fixo",
                min_value=0.01,
                max_value=100.0,
                value=float(risk_cfg.get("fixed_lot", 0.01)),
                step=0.01,
                help="Volume usado quando o modo de lote estiver em Lote fixo.",
            )
            risk_percentage = st.number_input(
                "Risco (%)",
                min_value=0.1,
                max_value=100.0,
                value=float(risk_cfg.get("risk_percentage", 1.0)),
                step=0.1,
                help="Percentual do saldo que o robo arrisca por ordem no modo de lote por risco. Exemplo: 1.0 = arrisca 1% do saldo por operacao.",
            )
            risk_max_per_trade_percent = st.number_input(
                "Teto maximo de risco por ordem (%)",
                min_value=0.1,
                max_value=10.0,
                value=float(risk_cfg.get("risk_max_per_trade_percent", 3.0)),
                step=0.1,
                help="Trava de seguranca da estrategia Fimathe. Mesmo que o risco configurado seja maior, o robo nunca passa deste valor por ordem.",
            )
            sl_tp_mode = st.selectbox(
                "Modo de SL/TP",
                SL_TP_MODE_OPTIONS,
                index=SL_TP_MODE_OPTIONS.index(str(risk_cfg.get("sl_tp_mode", "fimathe")).lower())
                if str(risk_cfg.get("sl_tp_mode", "fimathe")).lower() in SL_TP_MODE_OPTIONS
                else 0,
                format_func=lambda value: SL_TP_MODE_LABELS.get(value, value),
                help="Fimathe estrutural usa ponto-A/ponto-B e projecoes da tecnica. Fixo usa pontos travados. Dinamico usa nivel semanal proximo.",
            )
            sl_points = st.number_input(
                "Stop Loss (pts)",
                min_value=1,
                value=int(risk_cfg.get("sl_points", 300)),
                help="Usado nos modos Fixo e Dinamico. No modo Fimathe, o stop principal vem da estrutura tecnica e este campo vira fallback.",
            )
            tp_points = st.number_input(
                "Take Profit (pts)",
                min_value=1,
                value=int(risk_cfg.get("tp_points", 600)),
                help="Usado nos modos Fixo e Dinamico. No modo Fimathe, o alvo principal vem da projecao tecnica.",
            )
            fimathe_target_level = st.selectbox(
                "Alvo da projecao Fimathe",
                ["80", "85", "100"],
                index=["80", "85", "100"].index(str(risk_cfg.get("fimathe_target_level", "80"))),
                help="Define em qual nivel da expansao o TP estrutural sera projetado. 80% = mais conservador, 100% = mais esticado.",
            )
            fimathe_stop_buffer_points = st.number_input(
                "Folga do stop estrutural Fimathe (pts)",
                min_value=1,
                max_value=1000,
                value=int(risk_cfg.get("fimathe_stop_buffer_points", 15)),
                help="Margem adicional aplicada abaixo/acima da estrutura para evitar stop por ruido curto.",
            )
            max_open_positions = st.number_input(
                "Maximo de posicoes abertas",
                min_value=1,
                max_value=20,
                value=int(risk_cfg.get("max_open_positions", 1)),
                help="Limite de operacoes simultaneas abertas pelo robô.",
            )
            symbol_cooldown_seconds = st.number_input(
                "Cooldown por ativo (segundos)",
                min_value=0,
                max_value=86400,
                value=int(risk_cfg.get("symbol_cooldown_seconds", 300)),
                help="Tempo minimo para abrir nova ordem no mesmo ativo.",
            )
            magic_number = st.number_input(
                "Numero magico (Magic Number)",
                min_value=1,
                value=int(risk_cfg.get("magic_number", 202404)),
                help="Identificador das ordens do robô no MT5.",
            )
            use_breakeven = st.checkbox(
                "Ativar break-even",
                value=bool(risk_cfg.get("use_breakeven", False)),
                help="Quando ativo, move SL para o preco de entrada em condicao definida.",
            )
            breakeven_trigger_points = st.number_input(
                "Break-even: gatilho em lucro (pts)",
                min_value=1,
                max_value=5000,
                value=int(risk_cfg.get("breakeven_trigger_points", 120)),
                help="Quantidade de pontos de lucro para mover SL ao break-even.",
            )
            breakeven_offset_points = st.number_input(
                "Break-even: offset (pts)",
                min_value=0,
                max_value=1000,
                value=int(risk_cfg.get("breakeven_offset_points", 5)),
                help="Offset adicional do break-even para cobrir spread/custos.",
            )

            st.markdown("**Trailing automatico (SL/TP)**")
            trailing_enabled = st.checkbox(
                "Ativar trailing de Stop Loss",
                value=bool(risk_cfg.get("trailing_enabled", True)),
                help="Arrasta o SL automaticamente quando o preço evolui a favor.",
            )
            trailing_activation_points = st.number_input(
                "Trailing: ativar apos lucro (pts)",
                min_value=1,
                max_value=10000,
                value=int(risk_cfg.get("trailing_activation_points", 150)),
                help="Lucro mínimo em pontos para iniciar o arrasto automático.",
            )
            trailing_sl_distance_points = st.number_input(
                "Trailing: distancia do SL (pts)",
                min_value=1,
                max_value=10000,
                value=int(risk_cfg.get("trailing_sl_distance_points", 120)),
                help="Distância do preço atual para posicionar o novo SL.",
            )
            trailing_tp_enabled = st.checkbox(
                "Ativar trailing de Take Profit",
                value=bool(risk_cfg.get("trailing_tp_enabled", True)),
                help="Arrasta o TP automaticamente para esticar ganhos quando o movimento continua.",
            )
            trailing_tp_distance_points = st.number_input(
                "Trailing: distancia do TP (pts)",
                min_value=1,
                max_value=10000,
                value=int(risk_cfg.get("trailing_tp_distance_points", 250)),
                help="Distância do preço atual para reposicionar o TP.",
            )
            trailing_update_min_step_points = st.number_input(
                "Trailing: passo minimo de ajuste (pts)",
                min_value=1,
                max_value=2000,
                value=int(risk_cfg.get("trailing_update_min_step_points", 20)),
                help="Só atualiza SL/TP quando houver avanço mínimo desse tamanho.",
            )
            trailing_update_cooldown_seconds = st.number_input(
                "Trailing: intervalo minimo entre ajustes (s)",
                min_value=1,
                max_value=300,
                value=int(risk_cfg.get("trailing_update_cooldown_seconds", 3)),
                help="Evita excesso de requisições para modificar ordens.",
            )

            st.markdown("**Ciclo de stop Fimathe (FIM-010)**")
            fimathe_cycle_enabled = st.checkbox(
                "Ativar ciclo tecnico de stop (topo / 50 / 100)",
                value=bool(risk_cfg.get("fimathe_cycle_enabled", True)),
                help="Quando ativo, o robo move o stop pelos eventos tecnicos da Fimathe: perdeu topo, perdeu 50% e perdeu 100%.",
            )
            fimathe_cycle_top_level = st.selectbox(
                "Nivel para armar perda de topo",
                ["80", "85", "100"],
                index=["80", "85", "100"].index(str(risk_cfg.get("fimathe_cycle_top_level", "80")))
                if str(risk_cfg.get("fimathe_cycle_top_level", "80")) in ["80", "85", "100"]
                else 0,
                help="Nivel da expansao que precisa ser alcancado antes de considerar o evento de perdeu topo.",
            )
            fimathe_cycle_top_retrace_points = st.number_input(
                "Perdeu topo: retracao minima (pts)",
                min_value=1,
                max_value=3000,
                value=int(risk_cfg.get("fimathe_cycle_top_retrace_points", 45)),
                help="Quantidade minima de retracao a partir da maxima/minima para ativar o ajuste de stop por perda de topo.",
            )
            fimathe_cycle_min_profit_points = st.number_input(
                "Perdeu topo: lucro minimo para armar (pts)",
                min_value=1,
                max_value=3000,
                value=int(risk_cfg.get("fimathe_cycle_min_profit_points", 80)),
                help="Evita mover stop cedo demais. O evento de topo so arma apos este lucro minimo.",
            )
            fimathe_cycle_protection_buffer_points = st.number_input(
                "Buffer de protecao nos eventos 50/100 (pts)",
                min_value=1,
                max_value=1000,
                value=int(risk_cfg.get("fimathe_cycle_protection_buffer_points", 12)),
                help="Folga tecnica aplicada ao reposicionar o stop nos eventos de perda de 50% e 100%.",
            )
            fimathe_cycle_breakeven_offset_points = st.number_input(
                "Offset de protecao no evento topo (pts)",
                min_value=0,
                max_value=1000,
                value=int(risk_cfg.get("fimathe_cycle_breakeven_offset_points", 5)),
                help="No evento de perda de topo, o stop vai para break-even com este offset.",
            )

        with col_b:
            st.subheader("Setup Fimathe")
            trend_timeframe = st.selectbox(
                "Timeframe de tendencia (quadro maior)",
                TIMEFRAME_OPTIONS,
                index=TIMEFRAME_OPTIONS.index(str(signal_cfg.get("trend_timeframe", "H1")).upper())
                if str(signal_cfg.get("trend_timeframe", "H1")).upper() in TIMEFRAME_OPTIONS
                else TIMEFRAME_OPTIONS.index("H1"),
                help="Timeframe usado para identificar direcao principal da tendencia.",
            )
            entry_timeframe = st.selectbox(
                "Timeframe de entrada (quadro menor)",
                TIMEFRAME_OPTIONS,
                index=TIMEFRAME_OPTIONS.index(str(signal_cfg.get("entry_timeframe", "M15")).upper())
                if str(signal_cfg.get("entry_timeframe", "M15")).upper() in TIMEFRAME_OPTIONS
                else TIMEFRAME_OPTIONS.index("M15"),
                help="Timeframe usado para ponto de entrada e controle de risco.",
            )
            trend_candles = st.number_input(
                "Candles para confirmar tendencia",
                min_value=50,
                max_value=500,
                value=int(signal_cfg.get("trend_candles", 200)),
                help="Quantidade de candles para medir inclinacao da tendencia.",
            )
            trend_min_slope_points = st.number_input(
                "Inclinacao minima da tendencia (pts/candle)",
                min_value=0.01,
                max_value=50.0,
                step=0.01,
                value=float(signal_cfg.get("trend_min_slope_points", 0.20)),
                help="Filtro para evitar operar em mercado lateral.",
            )
            entry_lookback_candles = st.number_input(
                "Candles para canal de entrada",
                min_value=20,
                max_value=300,
                value=int(signal_cfg.get("entry_lookback_candles", 50)),
                help="Janela usada para calcular canal e regiao de 50%.",
            )
            ab_lookback_candles = st.number_input(
                "Candles para mapear ponto-A/ponto-B",
                min_value=30,
                max_value=400,
                value=int(signal_cfg.get("ab_lookback_candles", 80)),
                help="Quantidade de candles do timeframe maior para definir as bordas estruturais da estrategia Fimathe.",
            )
            breakout_buffer_points = st.number_input(
                "Buffer de rompimento do canal (pts)",
                min_value=0,
                max_value=500,
                value=int(signal_cfg.get("breakout_buffer_points", 10)),
                help="Distancia minima para considerar rompimento valido.",
            )
            pullback_tolerance_points = st.number_input(
                "Tolerancia de pullback/reteste (pts)",
                min_value=0,
                max_value=500,
                value=int(signal_cfg.get("pullback_tolerance_points", 20)),
                help="Margem para aceitar reteste antes da entrada.",
            )
            require_channel_break = st.checkbox(
                "Exigir rompimento do canal",
                value=bool(signal_cfg.get("require_channel_break", True)),
                help="So libera setup apos rompimento na direcao da tendencia.",
            )
            require_pullback_retest = st.checkbox(
                "Exigir pullback/reteste",
                value=bool(signal_cfg.get("require_pullback_retest", True)),
                help="So libera setup apos reteste da regiao de entrada.",
            )
            require_grouping = st.checkbox(
                "Exigir agrupamento no tempo menor",
                value=bool(signal_cfg.get("require_grouping", True)),
                help="Agrupamento e consolidacao no timeframe de entrada. Quando ativo, o robo bloqueia entrada sem esse padrao.",
            )
            grouping_window_candles = st.number_input(
                "Janela do agrupamento (candles)",
                min_value=5,
                max_value=80,
                value=int(signal_cfg.get("grouping_window_candles", 12)),
                help="Quantidade de candles no timeframe menor usada para confirmar se existe agrupamento.",
            )
            grouping_range_max_points = st.number_input(
                "Faixa maxima do agrupamento (pts)",
                min_value=10,
                max_value=1500,
                value=int(signal_cfg.get("grouping_range_max_points", 180)),
                help="Se a amplitude da janela for maior que este valor, o robo considera que nao ha consolidacao valida.",
            )
            grouping_body_max_points = st.number_input(
                "Corpo medio maximo do agrupamento (pts)",
                min_value=1,
                max_value=500,
                value=int(signal_cfg.get("grouping_body_max_points", 60)),
                help="Filtro adicional de consolidacao: corpos medios menores reforcam leitura de agrupamento.",
            )
            require_sr_touch = st.checkbox(
                "Exigir toque em S/R semanal",
                value=bool(signal_cfg.get("require_sr_touch", True)),
                help="Quando ativo, o setup so e liberado se o preco estiver perto dos niveis de suporte/resistencia detectados no semanal.",
            )
            sr_tolerance_points = st.number_input(
                "Tolerancia de toque S/R (pts)",
                min_value=1,
                max_value=500,
                value=int(signal_cfg.get("sr_tolerance_points", 35)),
                help="Margem em pontos para considerar que o preco tocou o nivel.",
            )

            st.subheader("Conexao")
            mt5_path = st.text_input(
                "Caminho do terminal MT5",
                value=conn_cfg.get("path", ""),
                help="Caminho completo do executavel do MetaTrader 5 (opcional).",
            )
            mt5_login = st.number_input(
                "Login MT5",
                min_value=0,
                value=int(conn_cfg.get("login", 0)),
                help="Numero da conta MT5 para login automatico.",
            )
            mt5_server = st.text_input(
                "Servidor MT5",
                value=conn_cfg.get("server", ""),
                help="Nome do servidor da corretora no MT5.",
            )
            mt5_password = st.text_input(
                "Senha MT5",
                value=conn_cfg.get("password", ""),
                type="password",
                help="Senha da conta MT5.",
            )

            st.subheader("Interface")
            refresh_seconds = st.number_input(
                "Auto-refresh (segundos)",
                min_value=0,
                max_value=3600,
                value=int(ui_cfg.get("refresh_rate_seconds", 10)),
                help="Intervalo de atualizacao automatica da tela.",
            )
            analysis_flow_interval_seconds = st.number_input(
                "Intervalo do Fluxo de Analise (segundos)",
                min_value=5,
                max_value=300,
                value=int(ui_cfg.get("analysis_flow_interval_seconds", 15)),
                help="Frequencia de gravacao da analise detalhada por ativo no banco.",
            )
            auto_start_robot_ui = st.checkbox(
                "Iniciar robô automaticamente com o painel",
                value=bool(ui_cfg.get("auto_start_robot", False)),
                help="Se ativado, o painel tenta iniciar o robô ao abrir.",
            )

        submitted = st.form_submit_button("SALVAR CONFIGURACOES")

    if submitted:
        custom_symbols = [item.strip().upper() for item in custom_symbols_raw.split(",") if item.strip()]
        symbols = [item.strip().upper() for item in selected_symbols if item and str(item).strip()]
        symbols.extend(custom_symbols)
        symbols = list(dict.fromkeys(symbols))
        if not symbols:
            symbols = ["EURUSD"]
            st.warning("Nenhum ativo selecionado. Aplicado EURUSD automaticamente.")
        if len(symbols) > 10:
            symbols = symbols[:10]
            st.warning("Foram informados mais de 10 ativos. Apenas os 10 primeiros foram mantidos.")

        if entry_timeframe == trend_timeframe:
            st.warning("Timeframes de entrada e tendencia iguais. Mantido, mas recomenda-se usar timeframes diferentes.")

        operational_timeframes = list(dict.fromkeys([entry_timeframe, trend_timeframe]))

        settings["analysis"].update(
            {
                "symbols": symbols,
                "strategy_mode": STRATEGY_NAME,
                "timeframes": operational_timeframes,
                "history_years": int(history_years),
                "wick_sensitivity": float(wick_sensitivity),
                "mtf_confluence": bool(mtf_confluence),
            }
        )

        settings["signal_logic"].update(
            {
                "trend_timeframe": str(trend_timeframe).upper(),
                "entry_timeframe": str(entry_timeframe).upper(),
                "trend_candles": int(trend_candles),
                "trend_min_slope_points": float(trend_min_slope_points),
                "entry_lookback_candles": int(entry_lookback_candles),
                "ab_lookback_candles": int(ab_lookback_candles),
                "breakout_buffer_points": int(breakout_buffer_points),
                "pullback_tolerance_points": int(pullback_tolerance_points),
                "require_channel_break": bool(require_channel_break),
                "require_pullback_retest": bool(require_pullback_retest),
                "require_grouping": bool(require_grouping),
                "grouping_window_candles": int(grouping_window_candles),
                "grouping_range_max_points": int(grouping_range_max_points),
                "grouping_body_max_points": int(grouping_body_max_points),
                "require_sr_touch": bool(require_sr_touch),
                "sr_tolerance_points": int(sr_tolerance_points),
            }
        )

        settings["risk_management"].update(
            {
                "lot_mode": lot_mode,
                "fixed_lot": float(fixed_lot),
                "risk_percentage": float(risk_percentage),
                "risk_max_per_trade_percent": float(risk_max_per_trade_percent),
                "sl_tp_mode": sl_tp_mode,
                "sl_points": int(sl_points),
                "tp_points": int(tp_points),
                "fimathe_target_level": str(fimathe_target_level),
                "fimathe_stop_buffer_points": int(fimathe_stop_buffer_points),
                "max_open_positions": int(max_open_positions),
                "symbol_cooldown_seconds": int(symbol_cooldown_seconds),
                "trailing_enabled": bool(trailing_enabled),
                "trailing_activation_points": int(trailing_activation_points),
                "trailing_sl_distance_points": int(trailing_sl_distance_points),
                "trailing_tp_enabled": bool(trailing_tp_enabled),
                "trailing_tp_distance_points": int(trailing_tp_distance_points),
                "trailing_update_min_step_points": int(trailing_update_min_step_points),
                "trailing_update_cooldown_seconds": int(trailing_update_cooldown_seconds),
                "fimathe_cycle_enabled": bool(fimathe_cycle_enabled),
                "fimathe_cycle_top_level": str(fimathe_cycle_top_level),
                "fimathe_cycle_top_retrace_points": int(fimathe_cycle_top_retrace_points),
                "fimathe_cycle_min_profit_points": int(fimathe_cycle_min_profit_points),
                "fimathe_cycle_protection_buffer_points": int(fimathe_cycle_protection_buffer_points),
                "fimathe_cycle_breakeven_offset_points": int(fimathe_cycle_breakeven_offset_points),
                "magic_number": int(magic_number),
                "use_breakeven": bool(use_breakeven),
                "breakeven_trigger_points": int(breakeven_trigger_points),
                "breakeven_offset_points": int(breakeven_offset_points),
            }
        )

        settings["connection"].update(
            {
                "path": mt5_path.strip(),
                "login": int(mt5_login),
                "server": mt5_server.strip(),
                "password": mt5_password,
            }
        )

        settings["ui_settings"]["refresh_rate_seconds"] = int(refresh_seconds)
        settings["ui_settings"]["auto_start_robot"] = bool(auto_start_robot_ui)
        settings["ui_settings"]["analysis_flow_interval_seconds"] = int(analysis_flow_interval_seconds)

        save_settings(settings)
        st.info("Se o robô já estiver ligado, use 'Reiniciar Robo' para aplicar as novas configurações.")

    st.subheader("Controle do Robo")
    running, runtime_state = get_robot_runtime_status()
    runtime_pid = runtime_state.get("pid")
    runtime_started = runtime_state.get("started_at", "-")

    if running:
        st.success(f"Robô em execução (PID {runtime_pid}) desde {runtime_started}.")
    else:
        st.warning("Robô parado.")
        if runtime_pid:
            st.caption(f"Último PID registrado: {runtime_pid}")

    col_ctrl_1, col_ctrl_2, col_ctrl_3 = st.columns(3)

    if col_ctrl_1.button("Iniciar Robo", disabled=running):
        ok, msg = start_robot_process()
        if ok:
            st.success(msg)
        else:
            st.error(msg)
        st.rerun()

    if col_ctrl_2.button("Parar Robo", disabled=not running):
        ok, msg = stop_robot_process()
        if ok:
            st.success(msg)
        else:
            st.warning(msg)
        st.rerun()

    if col_ctrl_3.button("Reiniciar Robo"):
        _, _ = stop_robot_process()
        ok, msg = start_robot_process()
        if ok:
            st.success(msg)
        else:
            st.error(msg)
        st.rerun()

    with st.expander("Log de Execucao do Robo"):
        if st.button("Limpar Log de Execucao do Robo", key="clear_robot_runtime_log"):
            ok, msg = clear_robot_log_file()
            if ok:
                st.success(msg)
            else:
                st.error(msg)
            st.rerun()

        log_tail = read_log_tail(ROBOT_LOG_FILE, max_lines=120)
        if log_tail:
            st.code(log_tail, language="text")
        else:
            st.info("Sem log ainda. Inicie o robô para gerar logs.")

    with st.expander("Configuracao avancada (JSON)"):
        st.caption("Use apenas se quiser alterar qualquer campo nao exibido nos controles acima.")
        raw_json = st.text_area(
            "JSON completo",
            value=json.dumps(settings, indent=2, ensure_ascii=False),
            height=320,
            key="raw_settings_json",
        )
        if st.button("Aplicar JSON"):
            try:
                parsed = json.loads(raw_json)
                parsed = normalize_settings(parsed)
                save_settings(parsed)
                st.rerun()
            except Exception as exc:
                st.error(f"JSON invalido: {exc}")

elif page == PAGE_LOGS:
    st.header("Auditoria e Logs")

    if conn is None:
        st.error("Banco de dados indisponivel. Ajuste a conexao na tela Configuracoes do Robo.")
    else:
        try:
            df_audit = conn.query("SELECT * FROM trades ORDER BY entry_time DESC;", ttl=2)
            runtime_snapshot = read_fimathe_runtime_snapshot()
            runtime_symbols = runtime_snapshot.get("symbols", {}) if isinstance(runtime_snapshot, dict) else {}
            runtime_rows = []
            if isinstance(runtime_symbols, dict):
                runtime_rows = sorted(runtime_symbols.values(), key=lambda item: str(item.get("symbol", "")))

            st.subheader("Fluxo Tatico Fimathe (Tempo Real)")
            runtime_age = format_runtime_age(runtime_snapshot.get("updated_at") if isinstance(runtime_snapshot, dict) else None)
            st.caption(f"Atualizacao do robo: {runtime_age}. Este painel explica o que o robô esta fazendo agora em cada ativo.")

            st.markdown(
                """
                <style>
                .fima-card {
                    border: 1px solid rgba(255,255,255,0.14);
                    border-radius: 16px;
                    padding: 14px 14px 12px 14px;
                    background: linear-gradient(160deg, rgba(8,13,28,0.97), rgba(16,24,40,0.97));
                    margin-bottom: 12px;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.22);
                }
                .fima-head {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }
                .fima-symbol {
                    font-size: 1.05rem;
                    font-weight: 700;
                    color: #f8fafc;
                }
                .fima-phase {
                    font-size: 0.78rem;
                    font-weight: 700;
                    border-radius: 999px;
                    padding: 3px 10px;
                    border: 1px solid rgba(255,255,255,0.25);
                    color: #f8fafc;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                }
                .fima-status {
                    font-size: 0.90rem;
                    color: #e2e8f0;
                    margin-bottom: 8px;
                    line-height: 1.45;
                }
                .fima-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 2px 10px;
                    font-size: 0.83rem;
                    color: #cbd5e1;
                }
                </style>
                """,
                unsafe_allow_html=True,
            )

            if not runtime_rows:
                st.info("Sem snapshot em tempo real ainda. Inicie o robô para ver o fluxo tatico por ativo.")
            else:
                runtime_symbol_options = ["TODOS"] + [str(item.get("symbol", "")) for item in runtime_rows if item.get("symbol")]
                col_rt_1, col_rt_2 = st.columns([2, 1])
                with col_rt_1:
                    selected_runtime_symbol = st.selectbox(
                        "Ativo no fluxo tatico",
                        runtime_symbol_options,
                        index=0,
                        key="runtime_symbol_filter",
                    )
                with col_rt_2:
                    max_runtime_cards = st.number_input(
                        "Cards taticos",
                        min_value=2,
                        max_value=20,
                        value=8,
                        step=1,
                        key="runtime_card_limit",
                    )

                filtered_runtime_rows = runtime_rows
                if selected_runtime_symbol != "TODOS":
                    filtered_runtime_rows = [item for item in runtime_rows if str(item.get("symbol", "")) == selected_runtime_symbol]
                filtered_runtime_rows = filtered_runtime_rows[: int(max_runtime_cards)]

                card_cols = st.columns(2)
                for idx, card in enumerate(filtered_runtime_rows):
                    phase = str(card.get("status_phase", "monitoramento"))
                    phase_label = FIMATHE_PHASE_LABELS.get(phase, phase.replace("_", " ").title())
                    phase_color = FIMATHE_PHASE_COLORS.get(phase, "#38bdf8")
                    reason_label = format_analysis_reason(card.get("reason"))
                    breakout_distance = card.get("breakout_distance_points")
                    breakout_text = f"{breakout_distance} pts" if breakout_distance is not None else "-"
                    trend_label = card.get("trend_direction") or "-"
                    slope_label = card.get("trend_slope_points")
                    slope_text = f"{slope_label} pts" if slope_label is not None else "-"
                    near_sr_text = "SIM" if card.get("near_sr") else "NAO"
                    near_trade_region_text = "SIM" if card.get("near_trade_region") else "NAO"
                    grouping_text = "OK" if card.get("grouping_ok") else "NAO"
                    point_a = card.get("point_a")
                    point_b = card.get("point_b")
                    projection_50 = card.get("projection_50")
                    projection_80 = card.get("projection_80")
                    action_text = str(card.get("status_text") or "Monitorando setup Fimathe.")
                    rule_label = format_rule_label(card.get("rule_id"))
                    next_trigger = str(card.get("next_trigger") or "-")
                    last_cycle_action = card.get("last_cycle_action") or {}
                    if isinstance(last_cycle_action, dict) and last_cycle_action.get("event"):
                        cycle_action_text = f"{last_cycle_action.get('event')} ({last_cycle_action.get('rule_id') or 'FIM-010'})"
                    else:
                        cycle_action_text = "-"

                    html = f"""
                    <div class="fima-card">
                        <div class="fima-head">
                            <div class="fima-symbol">{format_symbol_pair(card.get('symbol'))}</div>
                            <div class="fima-phase" style="background:{phase_color};">{phase_label}</div>
                        </div>
                        <div class="fima-status">{action_text}</div>
                        <div class="fima-grid">
                            <div>Regra ativa: <b>{rule_label}</b></div>
                            <div>Proximo gatilho: <b>{next_trigger}</b></div>
                            <div>Motivo: <b>{reason_label}</b></div>
                            <div>Sinal: <b>{card.get('signal') or '-'}</b></div>
                            <div>Tendencia: <b>{trend_label}</b></div>
                            <div>Slope: <b>{slope_text}</b></div>
                            <div>Rompimento: <b>{'OK' if card.get('breakout_ok') else 'NAO'}</b></div>
                            <div>Dist. romp.: <b>{breakout_text}</b></div>
                            <div>Pullback: <b>{'OK' if card.get('pullback_ok') else 'NAO'}</b></div>
                            <div>Perto S/R: <b>{near_sr_text}</b></div>
                            <div>Regiao negociavel: <b>{near_trade_region_text}</b></div>
                            <div>Agrupamento: <b>{grouping_text}</b></div>
                            <div>Ponto-A / Ponto-B: <b>{point_a or '-'} / {point_b or '-'}</b></div>
                            <div>Projecao 50/80: <b>{projection_50 or '-'} / {projection_80 or '-'}</b></div>
                            <div>Ultima acao risco: <b>{cycle_action_text}</b></div>
                            <div>Posicoes: <b>{card.get('open_positions', 0)}/{card.get('max_open_positions', 0)}</b></div>
                            <div>TF entrada/tend.: <b>{card.get('entry_timeframe', '-')} / {card.get('trend_timeframe', '-')}</b></div>
                        </div>
                    </div>
                    """
                    with card_cols[idx % 2]:
                        st.markdown(html, unsafe_allow_html=True)

                runtime_events = runtime_snapshot.get("recent_events", []) if isinstance(runtime_snapshot, dict) else []
                if runtime_events:
                    with st.expander("Linha do tempo operacional (ultimos eventos)"):
                        events_df = pd.DataFrame(runtime_events).tail(30).copy()
                        if not events_df.empty:
                            events_df = events_df.sort_values("timestamp", ascending=False)
                            st.dataframe(events_df, use_container_width=True, hide_index=True)

            st.markdown("---")
            st.subheader("Auditoria de Ordens")

            if df_audit.empty:
                st.info("Ainda nao existem trades para exibir na auditoria.")
            else:
                df_view = df_audit.copy()
                df_view["entry_time"] = pd.to_datetime(df_view["entry_time"], errors="coerce")
                df_view["pnl_num"] = pd.to_numeric(df_view["pnl"], errors="coerce")
                df_view = df_view.sort_values("entry_time", ascending=False)

                def _resultado(row):
                    status = str(row.get("status", "") or "").upper().strip()
                    pnl = row.get("pnl_num")
                    if status == "OPEN":
                        return "EM ANDAMENTO", "#facc15"
                    if pd.isna(pnl):
                        return "FECHADA", "#93c5fd"
                    if float(pnl) > 0:
                        return "DEU BOM", "#22c55e"
                    if float(pnl) < 0:
                        return "LOSS", "#ef4444"
                    return "ZERO A ZERO", "#93c5fd"

                st.markdown(
                    """
                    <style>
                    .trade-card {
                        border: 1px solid rgba(255,255,255,0.12);
                        border-radius: 14px;
                        padding: 14px;
                        background: linear-gradient(160deg, rgba(13,17,23,0.95), rgba(23,30,45,0.95));
                        margin-bottom: 12px;
                    }
                    .trade-title {
                        font-size: 1.0rem;
                        font-weight: 700;
                        margin-bottom: 6px;
                        color: #f8fafc;
                    }
                    .trade-sub {
                        font-size: 0.82rem;
                        color: #94a3b8;
                        margin-bottom: 8px;
                    }
                    .trade-row {
                        font-size: 0.88rem;
                        color: #e2e8f0;
                        line-height: 1.45;
                    }
                    </style>
                    """,
                    unsafe_allow_html=True,
                )

                symbol_options = ["TODOS"] + sorted(df_view["symbol"].dropna().astype(str).unique().tolist())
                col_filter_1, col_filter_2 = st.columns([2, 1])
                with col_filter_1:
                    selected_symbol = st.selectbox("Filtrar auditoria por ativo", symbol_options, index=0, key="trades_symbol_filter")
                with col_filter_2:
                    max_cards = st.number_input("Qtd. de cards", min_value=3, max_value=30, value=12, step=1, key="trades_card_limit")

                if selected_symbol != "TODOS":
                    df_view = df_view[df_view["symbol"] == selected_symbol]

                df_cards = df_view.head(int(max_cards))
                if df_cards.empty:
                    st.info("Sem ordens para o filtro selecionado.")
                else:
                    cols = st.columns(3)
                    for idx, (_, row) in enumerate(df_cards.iterrows()):
                        result_text, result_color = _resultado(row)
                        entry_time = row["entry_time"].strftime("%Y-%m-%d %H:%M:%S") if pd.notna(row["entry_time"]) else "-"
                        pnl_text = "-" if pd.isna(row["pnl_num"]) else f"{float(row['pnl_num']):.2f}"

                        html = f"""
                        <div class="trade-card">
                            <div class="trade-title">{format_symbol_pair(row.get('symbol'))} | {row.get('type', '-')} | {str(row.get('timeframe', '-')).upper()}</div>
                            <div class="trade-sub">Estrategia: {row.get('strategy', '-')} | Ticket: {row.get('ticket', '-')}</div>
                            <div class="trade-row"><b style="color:{result_color};">Status: {result_text}</b></div>
                            <div class="trade-row">Entrada: {row.get('entry_price', '-')} | SL: {row.get('sl', '-')} | TP: {row.get('tp', '-')}</div>
                            <div class="trade-row">PnL: {pnl_text} | Hora entrada: {entry_time}</div>
                        </div>
                        """
                        with cols[idx % 3]:
                            st.markdown(html, unsafe_allow_html=True)

                with st.expander("Tabela completa de trades"):
                    st.dataframe(df_audit, use_container_width=True)
        except Exception as exc:
            st.error(f"Falha ao consultar logs: {exc}")

