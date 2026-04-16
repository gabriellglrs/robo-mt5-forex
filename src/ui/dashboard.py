import streamlit as st
import pandas as pd
import json
import os
import plotly.express as px
from datetime import datetime, timedelta
from styles import get_custom_css
from streamlit_autorefresh import st_autorefresh

# Caminho das configurações
SETTINGS_FILE = "config/settings.json"

# Configuração da página
st.set_page_config(page_title="Robo MT5 v2 - Command Center", layout="wide", page_icon="⚡")

# Aplicar CSS Customizado
st.markdown(get_custom_css(), unsafe_allow_html=True)

def load_settings():
    if not os.path.exists(SETTINGS_FILE):
        return {}
    with open(SETTINGS_FILE, "r") as f:
        return json.load(f)

def save_settings(new_settings):
    with open(SETTINGS_FILE, "w") as f:
        json.dump(new_settings, f, indent=4)
    st.success("✅ Configurações salvas!")

# 1. Carregar Configurações
settings = load_settings()

# 2. Configurar Auto-Refresh
refresh_rate = settings.get("ui_settings", {}).get("refresh_rate_seconds", 10)
if refresh_rate > 0:
    st_autorefresh(interval=refresh_rate * 1000, key="data_refresh_timer")

# 3. Conexão DB Centralizada
try:
    conn = st.connection("mysql", type="sql")
except:
    st.error("Erro ao conectar ao banco de dados.")
    st.stop()

# --- SIDEBAR & STATUS ---
st.sidebar.title("🎮 Centro de Comando")
page = st.sidebar.radio("Navegar para:", ["📊 Dashboard de Performance", "⚙️ Configurações do Robô", "📑 Auditoria e Logs"])

st.sidebar.markdown("---")
st.sidebar.subheader("Integridade do Sistema")

# Lógica de Heartbeat (Verifica se houve sinal no último minuto)
try:
    # Ajustamos para o fuso horário correto se necessário, aqui usamos 2 min de margem
    heartbeat_query = "SELECT timestamp FROM system_logs WHERE module = 'Heartbeat' ORDER BY timestamp DESC LIMIT 1;"
    last_hb = conn.query(heartbeat_query, ttl=2)
    
    if not last_hb.empty:
        last_time = pd.to_datetime(last_hb['timestamp'].iloc[0])
        # Streamlit e MySQL podem ter fusos diferentes, mas comparamos a diferença
        diff = datetime.now() - last_time
        
        if diff.total_seconds() < 120:
            st.sidebar.success(f"🟢 ROBÔ: AO VIVO")
            st.sidebar.caption(f"Último sinal: {last_time.strftime('%H:%M:%S')}")
        else:
            st.sidebar.error(f"🔴 ROBÔ: OFFLINE")
            st.sidebar.caption(f"Sem sinal desde: {last_time.strftime('%H:%M:%S')}")
    else:
        st.sidebar.warning("🟡 ROBÔ: AGUARDANDO...")
except:
    st.sidebar.error("⚪ STATUS: ERRO DB")

st.sidebar.info("● MySQL Online")
if refresh_rate > 0:
    st.sidebar.caption(f"🔄 Auto-update ativo ({refresh_rate}s)")

# --- CONTEÚDO DAS PÁGINAS ---
if page == "📊 Dashboard de Performance":
    st.header("⚡ Performance e Inteligência")
    
    df = conn.query("SELECT * FROM trades ORDER BY entry_time DESC;", ttl=2)

    if df.empty:
        st.info("Aguardando os primeiros trades para gerar estatísticas...")
        st.write("Dica: Certifique-se de que o robô (main.py) está rodando e o MT5 está com o Algo Trading ligado.")
    else:
        # KPIs
        total_pnl = df['pnl'].sum()
        win_rate = (len(df[df['pnl'] > 0]) / len(df) * 100)
        c1, c2, c3 = st.columns(3)
        c1.metric("LUCRO LÍQUIDO", f"$ {total_pnl:,.2f}", delta=f"{total_pnl:,.2f}")
        c2.metric("TAXA DE ACERTO", f"{win_rate:.1f} %")
        c3.metric("TRADES EXECUTADOS", len(df))

        st.markdown("<br>", unsafe_allow_html=True)
        col_g1, col_g2 = st.columns(2)
        with col_g1:
            st.subheader("📈 Curva de Equity")
            df_e = df.sort_values('entry_time')
            df_e['profit_cum'] = df_e['pnl'].cumsum()
            fig = px.line(df_e, x='entry_time', y='profit_cum', template="plotly_dark")
            fig.update_traces(line_color='#00FFAA', line_width=3)
            fig.update_layout(paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)')
            st.plotly_chart(fig, use_container_width=True)
        with col_g2:
            st.subheader("📊 Profit por Estratégia")
            strat_df = df.groupby('strategy')['pnl'].sum().reset_index()
            fig_b = px.bar(strat_df, x='strategy', y='pnl', color='strategy', template="plotly_dark")
            fig_b.update_layout(paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)')
            st.plotly_chart(fig_b, use_container_width=True)

elif page == "⚙️ Configurações do Robô":
    st.header("⚙️ Painel de Controle")
    if 'ui_settings' not in settings: settings['ui_settings'] = {"refresh_rate_seconds": 10}

    with st.form("settings_form"):
        col_s1, col_s2 = st.columns(2)
        with col_s1:
            st.subheader("🔹 Estratégia")
            settings['analysis']['strategy_mode'] = st.selectbox("Modo", ["fractal", "statistical"], index=0 if settings['analysis']['strategy_mode'] == "fractal" else 1, help="Define o algoritmo de detecção de níveis.")
            settings['analysis']['timeframes'] = st.multiselect("Timeframes", ["M5", "M15"], default=settings['analysis']['timeframes'], help="Tempos operacionais.")
            st.subheader("🔹 Gestão de Risco")
            settings['risk_management']['fixed_lot'] = st.number_input("Lote", value=settings['risk_management']['fixed_lot'], step=0.01, help="Volume das ordens.")
            settings['risk_management']['sl_points'] = st.number_input("Stop Loss (Pts)", value=settings['risk_management']['sl_points'])
            settings['risk_management']['tp_points'] = st.number_input("Take Profit (Pts)", value=settings['risk_management']['tp_points'])

        with col_s2:
            st.subheader("🔹 Filtros")
            settings['signal_logic']['mode'] = st.selectbox("Decisão", ["MIN_COUNT", "ALL"], index=0 if settings['signal_logic']['mode'] == "MIN_COUNT" else 1)
            settings['signal_logic']['min_confirmations'] = st.slider("Mínimo Conf.", 1, 5, value=settings['signal_logic']['min_confirmations'])
            for f_name in settings['signal_logic']['filters']:
                settings['signal_logic']['filters'][f_name] = st.checkbox(f_name.capitalize(), value=settings['signal_logic']['filters'][f_name])
            st.divider()
            settings['ui_settings']['refresh_rate_seconds'] = st.number_input("Auto-refresh (s)", min_value=0, value=settings['ui_settings']['refresh_rate_seconds'])

        if st.form_submit_button("SALVAR CONFIGURAÇÕES"):
            save_settings(settings)

elif page == "📑 Auditoria e Logs":
    st.header("📑 Histórico de Logs")
    df_audit = conn.query("SELECT * FROM trades ORDER BY entry_time DESC;", ttl=2)
    st.dataframe(df_audit, use_container_width=True)
    st.subheader("Fluxo de Análise")
    logs = conn.query("SELECT * FROM system_logs ORDER BY timestamp DESC LIMIT 100;", ttl=2)
    st.table(logs)
