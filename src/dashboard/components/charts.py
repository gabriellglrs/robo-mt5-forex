import plotly.graph_objects as go
import streamlit as st
import pandas as pd

def render_fimathe_chart(symbol_data):
    if not symbol_data:
        st.warning("Aguardando dados de mercado...")
        return

    symbol = symbol_data.get("symbol", "N/A")
    price = symbol_data.get("price")
    
    # Extrair níveis
    levels = {
        "High": symbol_data.get("channel_high"),
        "Mid": symbol_data.get("channel_mid"),
        "Low": symbol_data.get("channel_low"),
        "Point A": symbol_data.get("point_a"),
        "Point B": symbol_data.get("point_b"),
        "Proj 50": symbol_data.get("projection_50"),
        "Proj 100": symbol_data.get("projection_100"),
    }

    fig = go.Figure()

    # Adicionar Preço Atual
    if price:
        fig.add_trace(go.Scatter(
            x=[0], y=[price],
            mode="markers+text",
            name="Preço Atual",
            text=[f"R$ {price}"],
            textposition="top center",
            marker=dict(color="#00FF00", size=12, symbol="diamond")
        ))

    # Adicionar Linhas de Nível
    colors = {
        "High": "#FF00FF",
        "Mid": "#808080",
        "Low": "#FF00FF",
        "Point A": "#00FFFF",
        "Point B": "#00FFFF",
        "Proj 50": "#FFFF00",
        "Proj 100": "#FFA500",
    }

    for name, val in levels.items():
        if val:
            fig.add_hline(
                y=val, 
                line_dash="dash", 
                line_color=colors.get(name, "white"),
                annotation_text=name,
                annotation_position="bottom right"
            )

    fig.update_layout(
        title=f"📊 Monitoria Fimathe: {symbol}",
        template="plotly_dark",
        height=500,
        showlegend=True,
        xaxis=dict(showticklabels=False, range=[-1, 1]),
        yaxis=dict(title="Preço", gridcolor="#333"),
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
    )

    st.plotly_chart(fig, use_container_width=True)
