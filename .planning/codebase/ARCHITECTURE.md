# Architecture

## High level
- O sistema segue arquitetura em camadas: engine de trading, API de controle, e interfaces de observabilidade.
- Loop principal em `src/main.py` coordena analise, risco, ordens, reconciliacao e snapshot de runtime.
- API FastAPI em `src/api/main.py` expoe controle operacional e consulta de dados para frontend.
- Frontend Next.js (`web-dashboard/src/app`) e dashboard Streamlit (`src/ui/dashboard.py`) coexistem.

## Camada de analise
- Deteccao tecnica em `src/analysis/signals.py` com regras FIM e calculo de contexto de canal/projecoes.
- Maquina de estados em `src/analysis/fimathe_state_engine.py` define bloqueios, sinais e rastreio de regra.
- Calculo de niveis em `src/analysis/levels.py` e auxiliares em `src/analysis/indicators.py`.

## Camada de execucao e risco
- Geracao de ordens e modificacao SL/TP em `src/execution/orders.py`.
- Gestao de risco e lote em `src/execution/risk.py`.
- Eventos de ciclo (FIM-010/FIM-017/FIM-018) em `src/execution/fimathe_cycle.py`.
- Estado de tickets e trailing controlado no loop de `src/main.py`.

## Camada de persistencia e auditoria
- `DatabaseManager` concentra CRUD de trades, logs, snapshots e notificacoes (`src/core/database.py`).
- Estrategia de auditoria: salvar settings snapshot e vincular `settings_id` no trade.
- Runtime operacional em arquivo JSON (`logs/fimathe_runtime.json`) para consumo rapido de UI.

## Camada de notificacoes
- `NotificationService` aplica filtros por categoria/prioridade e politica de supressao.
- `TelegramProvider` entrega notificacoes externamente com retry curto.
- Metricas de emissao ficam em memoria e eventos completos persistem no MySQL.

## Fluxo principal de dados
- MT5 -> `SignalDetector` -> state machine -> `RiskManager` -> `OrderEngine`.
- Resultado operacional -> MySQL (`trades`, `system_logs`, `notification_events`).
- Snapshot consolidado -> `logs/fimathe_runtime.json` -> Next.js/Streamlit.
- Comandos de operacao (start/stop/settings) partem da API e retornam ao engine.

## Decisoes arquiteturais observadas
- Forte acoplamento ao runtime Windows + MT5 desktop.
- Interface web desacoplada da execucao por API, mas ainda com dados dependentes de arquivos locais de runtime.
