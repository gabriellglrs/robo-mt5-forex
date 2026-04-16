import json
import os
import streamlit as st

SETTINGS_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../config/settings.json"))

def load_settings():
    if not os.path.exists(SETTINGS_FILE):
        return {}
    try:
        with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return {}

def save_settings(settings):
    os.makedirs(os.path.dirname(SETTINGS_FILE), exist_ok=True)
    with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
        json.dump(settings, f, indent=2, ensure_ascii=False)

def render_sidebar_controls():
    """Controles globais sempre visíveis na Sidebar."""
    st.sidebar.title("🎮 Global Control")
    
    settings = load_settings()
    
    # 1. Start / Stop
    is_running = settings.get("running_state", False)
    btn_label = "🔴 PARAR ROBÔ" if is_running else "🟢 INICIAR ROBÔ"
    if st.sidebar.button(btn_label, use_container_width=True):
        settings["running_state"] = not is_running
        save_settings(settings)
        st.rerun()

    st.sidebar.divider()
    
    # Status rápido na sidebar
    status_color = "#00FF00" if is_running else "#FF0000"
    st.sidebar.markdown(f"**Status:** <span style='color:{status_color}'>{'ATIVO' if is_running else 'PAUSADO'}</span>", unsafe_allow_html=True)
    
    return settings

def render_tab_controls():
    """Configurações detalhadas para a Aba de Configurações."""
    st.header("⚙️ Configurações Estratégicas")
    
    settings = load_settings()
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("🛡️ Gestão de Risco")
        risk_mgmt = settings.get("risk_management", {})
        current_risk = float(risk_mgmt.get("risk_percent", 1.0))
        
        new_risk = st.slider(
            "Risco por Operação (%)",
            min_value=0.1,
            max_value=3.0,
            value=current_risk,
            step=0.1,
            help="Percentual do balance arriscado por trade."
        )
        
        if new_risk != current_risk:
            risk_mgmt["risk_percent"] = new_risk
            settings["risk_management"] = risk_mgmt
            save_settings(settings)
            st.toast(f"Risco atualizado para {new_risk}%", icon="✅")

        max_pos = st.number_input(
            "Máximo de Posições por Ativo",
            min_value=1,
            max_value=30,
            value=int(risk_mgmt.get("max_open_positions", 1))
        )
        if max_pos != int(risk_mgmt.get("max_open_positions", 1)):
            risk_mgmt["max_open_positions"] = max_pos
            settings["risk_management"] = risk_mgmt
            save_settings(settings)

    with col2:
        st.subheader("🔍 Ativos & Filtros")
        analysis_cfg = settings.get("analysis", {})
        
        symbols_str = st.text_area(
            "Lista de Ativos (separados por vírgula)",
            value=analysis_cfg.get("symbols", "EURUSD"),
            help="Ex: EURUSD, USDJPY, GBPUSD, BTCUSD"
        )
        if symbols_str != analysis_cfg.get("symbols", "EURUSD"):
            analysis_cfg["symbols"] = symbols_str
            settings["analysis"] = analysis_cfg
            save_settings(settings)
            st.success("Lista de ativos atualizada!")

    st.divider()
    st.info("💡 As alterações são aplicadas instantaneamente no próximo ciclo do robô.")
