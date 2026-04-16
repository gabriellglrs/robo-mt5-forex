# ⚡ Robo MT5 Forex v2 - Enterprise Edition

Robô de trading automatizado de alta performance para **MetaTrader 5**, focado em suporte/resistência semanais e confluência avançada de indicadores.

## 🚀 Funcionalidades Principais
- **Análise Técnica**: RSI, Bollinger, Stochastic, PinBar e Volume em M5/M15.
- **Níveis Estatísticos**: Detecção de S/R baseada em histórico OHLC.
- **Persistência**: Docker + MySQL 8.0 para registro de auditoria e logs.
- **Centro de Comando Web**: Dashboard Streamlit com controle de configurações via navegador.
- **Gestão de Risco**: Cálculo de lote e SL/TP modular.

## 🛠️ Tecnologias
- **Python 3.14**
- **MetaTrader 5 API**
- **Docker & MySQL**
- **Streamlit & Plotly**

## 📦 Como Instalar
1. Clone o repositório.
2. Crie o ambiente virtual: `python -m venv venv`.
3. Instale as dependências: `pip install -r requirements.txt` (ou use os comandos mostrados no histórico).
4. Suba o Banco de Dados: `docker-compose up -d`.
5. Inicie o Dashboard: `streamlit run src/ui/dashboard.py`.
6. Inicie o Robô: `python src/main.py`.

---
*Desenvolvido para traders profissionais que buscam automação robusta e auditável.*
