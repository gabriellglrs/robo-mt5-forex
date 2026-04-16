import json
import os
import time
import pandas as pd
import streamlit as st
from components.controls import render_sidebar_controls, render_tab_controls
from components.charts import render_fimathe_chart
from components.audit_log import render_audit_timeline, render_state_analysis

# Configuração da Página
st.set_page_config(
    page_title="Robô MT5 v2 - Fimathe Center",
    page_icon="🤖",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Estilo Premium (Black & Neon)
st.markdown("""
    <style>
    .stApp {
        background-color: #0E1117;
    }
    .stMetric {
        background: rgba(255, 255, 255, 0.05);
        padding: 15px;
        border-radius: 10px;
        border: 1px solid rgba(0, 255, 0, 0.1);
    }
    .log-entry {
        font-family: 'Courier New', monospace;
        padding: 5px;
        border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .level-FLOW { color: #00D1FF; }
    .level-RISK { color: #FFD100; }
    .level-ENTRY { color: #00FF00; }
    .level-ERROR { color: #FF0000; }
    .level-INFO { color: #AAAAAA; }
    </style>
    """, unsafe_allow_html=True)

RUNTIME_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../logs/fimathe_runtime.json"))

def load_runtime_snapshot():
    if not os.path.exists(RUNTIME_FILE):
        return None
    try:
        with open(RUNTIME_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return None

def render_logs_tab(snapshot):
    st.header("📜 Logs de Auditoria")
    events = snapshot.get("recent_events", [])
    
    if not events:
        st.info("Nenhum log registrado recentemente.")
        return

    # Inverter para mostrar os mais recentes primeiro
    events_to_show = events[::-1][:50]
    
    st.markdown("### Últimos 50 Eventos")
    for event in events_to_show:
        level = event.get("level", "INFO")
        timestamp = event.get("timestamp", "").split("T")[-1]
        symbol = event.get("symbol", "SYS")
        message = event.get("message", "")
        
        st.markdown(f"""
            <div class="log-entry">
                <span style="color:#666">[{timestamp}]</span> 
                <span class="level-{level}">[{level}]</span> 
                <b>{symbol}:</b> {message}
            </div>
        """, unsafe_allow_html=True)

def main():
    # 1. Sidebar Control (Sempre visível)
    render_sidebar_controls()
    
    # 2. Load Data
    snapshot = load_runtime_snapshot()
    
    # 3. Navegação por Abas
    tab1, tab2, tab3 = st.tabs(["📊 Dashboard de Trade", "⚙️ Configurações", "📜 Logs"])
    
    if not snapshot:
        with tab1:
            st.info("Aguardando o robô iniciar para capturar dados em tempo real...")
            if st.button("Simular robô OFFLINE"): st.rerun()
        with tab2:
            render_tab_controls()
        return

    # Aba 1: Dashboard
    with tab1:
        st.title("🛡️ Fimathe Control Center")
        
        # Resumo Global
        status = snapshot.get("status", "unknown").upper()
        col_a, col_b, col_c = st.columns(3)
        col_a.metric("Status do Serviço", status)
        col_b.metric("Última Atualização", snapshot.get("updated_at", "N/A"))
        col_c.metric("Ativos Monitorados", len(snapshot.get("symbols", {})))

        st.divider()

        # Monitoramento por Ativo
        symbols_data = snapshot.get("symbols", {})
        if not symbols_data:
            st.warning("Nenhum ativo sendo monitorado no momento.")
        else:
            selected_symbol = st.selectbox("Selecione o Ativo:", list(symbols_data.keys()))
            symbol_item = symbols_data[selected_symbol]
            
            col_main, col_side = st.columns([2, 1])
            with col_main:
                render_fimathe_chart(symbol_item)
                render_state_analysis(symbol_item)
            with col_side:
                st.subheader("Análise Local")
                render_audit_timeline(snapshot) # Ajustado para mostrar o contexto do ativo

    # Aba 2: Configurações
    with tab2:
        render_tab_controls()

    # Aba 3: Logs
    with tab3:
        render_logs_tab(snapshot)

    # 4. Auto-refresh
    time.sleep(2)
    st.rerun()

if __name__ == "__main__":
    main()
