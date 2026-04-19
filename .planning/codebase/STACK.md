# Stack

## Runtime principal
- Linguagem principal: Python 3.x no backend (`src/main.py`, `src/api/main.py`).
- Frontend web: Next.js 16 + React 19 em TypeScript (`web-dashboard/package.json`).
- Dashboard legado adicional: Streamlit (`src/ui/dashboard.py`, `src/dashboard/app.py`).
- Banco relacional: MySQL 8 via `mysql-connector-python` e `docker-compose.yml`.
- Execucao de trading: biblioteca `MetaTrader5` conectada ao terminal local.

## Bibliotecas backend
- API HTTP: FastAPI + Uvicorn (`src/api/main.py`).
- Auth: `python-jose` (JWT) + `bcrypt` (`src/api/main.py`).
- Persistencia: `mysql.connector.pooling` (`src/core/database.py`).
- Data/science: `numpy`, `pandas`, `scikit-learn`, `scipy`, `matplotlib` (`requirements.txt`).
- Notificacoes externas: integracao Telegram por `urllib.request` (`src/notifications/providers.py`).

## Bibliotecas frontend
- UI e rendering: `next`, `react`, `react-dom` (`web-dashboard/package.json`).
- Visualizacao: `lightweight-charts`, `recharts`.
- Animacao e icones: `framer-motion`, `lucide-react`.
- Estilo: Tailwind CSS v4 + PostCSS (`web-dashboard/postcss.config.mjs`).

## Ferramentas e operacao
- Orquestracao local: `run_system.bat` (Docker + pip + API).
- Containers: `docker-compose.yml` sobe `mysql-db`, `adminer`, `web-dashboard`.
- Testes: `pytest` com `testpaths=tests` e `pythonpath=src` (`pytest.ini`).

## Configuracoes e estado
- Config app: `config/settings.json`.
- Estado runtime do robo: `config/robot_runtime.json` e `logs/fimathe_runtime.json`.
- Logs operacionais: `logs/robot_runtime.log` e tabela `system_logs` no MySQL.

## Observacoes de stack
- O README raiz ainda cita PostgreSQL, mas o codigo e compose usam MySQL.
- O monorepo contem dois frontends ativos (Next.js e Streamlit) em paralelo.
