import streamlit as st

def render_audit_timeline(runtime_snapshot):
    st.subheader("📝 Auditoria de Risco e Eventos")
    
    events = runtime_snapshot.get("recent_events", [])
    
    if not events:
        st.info("Aguardando primeiros eventos do robô...")
        return
        
    # Inverter para mostrar os mais recentes primeiro
    for event in reversed(events):
        with st.expander(f"[{event.get('timestamp')}] {event.get('symbol')} - {event.get('level')}", expanded=False):
            st.write(event.get("message"))
            
            # Se for um evento de Risco (BE/Lock), destacar
            if event.get("level") == "RISK":
                st.success("Evento de Proteção de Capital Detectado.")
            elif event.get("level") == "ERROR":
                st.error("Erro Detectado no Ciclo Operacional.")
            elif event.get("level") == "ENTRY":
                st.info("Execução de Entrada Confirmada.")

def render_state_analysis(symbol_data):
    if not symbol_data:
        return
        
    st.divider()
    st.subheader("🧬 Análise da Máquina de Estados")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.metric("Regra Fimathe", symbol_data.get("rule_id", "FIM-000"))
        st.caption(symbol_data.get("rule_name", "N/A"))
        
    with col2:
        status_phase = symbol_data.get("status_phase", "OFFLINE").upper()
        delta_color = "normal"
        if status_phase == "ERRO": delta_color = "inverse"
        st.metric("Fase da Trade", status_phase, delta_color=delta_color)

    st.info(f"👉 **Próximo Gatilho:** {symbol_data.get('next_trigger', 'Monitorar mercado.')}")
    
    with st.expander("Ver Detalhes Técnicos (Rule Trace)"):
        st.json(symbol_data)
