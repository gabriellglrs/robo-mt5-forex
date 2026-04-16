def get_custom_css():
    """Retorna o CSS customizado para o Dashboard Premium."""
    return """
    <style>
    /* Estilo Geral de Cartões Glassmorphism */
    .stMetric {
        background: rgba(255, 255, 255, 0.05) !important;
        backdrop-filter: blur(10px) !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        border-radius: 15px !important;
        padding: 15px !important;
        box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5) !important;
    }
    
    /* Hover nos botões */
    .stButton>button {
        width: 100%;
        border-radius: 10px;
        background-color: transparent;
        border: 1px solid #00FFAA;
        color: #00FFAA;
        transition: all 0.3s ease;
    }
    
    .stButton>button:hover {
        background-color: #00FFAA;
        color: #0E1117;
        box-shadow: 0 0 15px #00FFAA;
    }
    
    /* Labels e Títulos */
    h1, h2, h3 {
        color: #00FFAA !important;
        font-weight: 700 !important;
    }
    
    /* Esconder o Menu Padrão do Streamlit para um visual mais limpo */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
    </style>
    """
