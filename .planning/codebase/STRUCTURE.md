# Structure

## Root layout
- `src/`: backend core, engine, API e dashboards Python.
- `web-dashboard/`: frontend Next.js (App Router) com paginas operacionais.
- `tests/`: suites pytest e scripts de verificacao manual.
- `config/`: arquivos de configuracao e estado do robo.
- `logs/`: runtime snapshot e log de execucao.
- `.planning/`: artefatos de roadmap, fases e mapa de codigo.

## Backend Python (`src`)
- `src/main.py`: orchestrator principal do ciclo operacional do robo.
- `src/api/main.py`: API de gerenciamento, auth, metricas e manutencao.
- `src/core/`: conexao MT5, banco e validacao de settings.
- `src/analysis/`: deteccao de setup, niveis e state engine Fimathe.
- `src/execution/`: envio/ajuste de ordens e logica de risco/ciclo.
- `src/notifications/`: schema, policy, provider e service de alertas.
- `src/ui/` e `src/dashboard/`: interfaces Streamlit e componentes.

## Frontend Next.js (`web-dashboard/src`)
- `web-dashboard/src/app/page.tsx`: dashboard principal.
- `web-dashboard/src/app/monitor/page.tsx`: monitor de regras/sinais.
- `web-dashboard/src/app/settings/page.tsx`: controle operacional e parametros.
- `web-dashboard/src/app/notifications/page.tsx`: central de alertas.
- `web-dashboard/src/app/stats/page.tsx`: BI/performance consolidada.
- `web-dashboard/src/components/`: wrappers, chart, topbar e componentes reutilizaveis.
- `web-dashboard/src/types/index.ts`: tipagens compartilhadas de UI.

## Testes e verificacao
- Unitarios de state machine e ciclo em `tests/test_fimathe_state_engine.py` e `tests/test_fimathe_cycle.py`.
- Regressao/hardening em `tests/test_fimathe_hardening.py`.
- Persistencia DB em `tests/test_db_persistence.py`.
- Scripts de validacao manual em `tests/verify_signals.py`, `tests/verify_orders.py`, `tests/verify_levels.py`.

## Infra e automacao
- `docker-compose.yml`: MySQL, Adminer e web dashboard.
- `run_system.bat`: bootstrap local (Docker + dependencias + API).
- `requirements.txt` e `web-dashboard/package.json`: dependencias de runtime.

## Observacoes estruturais
- Existem artefatos gerados no repo (`__pycache__`, `.next`, `node_modules`) misturados ao codigo fonte.
- A duplicidade de UI (Next.js + Streamlit) aumenta superficie de manutencao.
