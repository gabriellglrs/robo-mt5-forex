# Integrations

## MetaTrader 5
- Conexao principal do robo via `mt5.initialize()` (`src/core/connection.py`, `src/main.py`).
- API consulta ticks, candles e posicoes (`src/analysis/signals.py`, `src/execution/orders.py`).
- Endpoint de grafico exposto em `/api/chart/{symbol}` (`src/api/main.py`).
- Dependencia operacional: terminal MT5 local logado e com algo trading habilitado.

## MySQL
- Persistencia com pool de conexoes (`src/core/database.py`).
- Tabelas principais: `trades`, `system_logs`, `settings_snapshots`, `notification_events`.
- Credenciais padrao usadas em API e DB manager (`src/api/main.py`, `src/core/database.py`).
- Infra local via container `mysql-db` em `docker-compose.yml`.

## Next.js <-> FastAPI
- Frontend consome API via `NEXT_PUBLIC_API_URL` com fallback `http://localhost:8000`.
- Endpoints usados: `/login`, `/status`, `/runtime`, `/settings`, `/metrics`, `/api/performance`, `/logs`.
- Modulo de notificacoes usa `/notifications*` para listagem, leitura, limpeza e teste.
- Chamadas autenticadas por bearer token armazenado no cliente (`web-dashboard/src/app/*`).

## Telegram
- Canal de entrega de alertas em `src/notifications/providers.py`.
- URL alvo: `https://api.telegram.org/bot<token>/sendMessage`.
- Politica de supressao e rate control em `src/notifications/policy.py` e `src/notifications/service.py`.
- Configuracoes ficam no payload `notifications.telegram` em `settings.json`.

## Processos locais e SO
- API inicia/paralisa engine por subprocess (`src/api/main.py`, rotas `/start` e `/stop`).
- Em Windows, encerramento usa `taskkill /PID /T /F`.
- `run_system.bat` integra Docker, instalacao pip e bootstrap da API.

## Observacoes de integracao
- CORS da API esta aberto para todas as origens (`allow_origins=["*"]`).
- Existe fluxo legada de dashboard Streamlit lendo arquivos locais e banco diretamente (`src/ui/dashboard.py`).
