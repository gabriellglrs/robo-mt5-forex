# Concerns

## Security and secrets
- `SECRET_KEY` JWT hardcoded em `src/api/main.py`.
- Usuario admin e hash fixos no codigo (`FAKE_USER` em `src/api/main.py`).
- Credenciais MySQL hardcoded em API e database manager (`src/api/main.py`, `src/core/database.py`).
- CORS liberado para qualquer origem (`allow_origins=["*"]` em `src/api/main.py`).

## Operational risk
- Forte dependencia do terminal MT5 local e ambiente Windows para operacao completa.
- Controle de processo por PID/`taskkill` pode divergir se estado ficar desatualizado.
- Arquivo de runtime JSON usado como fonte de verdade para UI pode sofrer corrida de escrita/leitura.
- Duas UIs ativas (Next.js + Streamlit) aumentam risco de inconsistencias de comportamento.

## Code quality debt
- Arquivos gerados versionados no workspace (`__pycache__`, `.next`, `node_modules`) poluem exploracao e revisao.
- TODO explicito em `src/main.py` para atualizar dinamicamente config do RiskManager.
- Mistura de padroes de nomenclatura (pt/en) dificulta onboarding rapido.
- Arquivos muito extensos (`src/main.py`, `src/ui/dashboard.py`, `src/api/main.py`) concentram multiplas responsabilidades.

## Data and documentation drift
- README raiz descreve PostgreSQL, mas implementacao real usa MySQL.
- Partes do README do `web-dashboard` ainda estao no template padrao Next.js.
- Existe risco de divergencia entre schema de settings da web e normalizacao backend.

## Testing and release risk
- Ausencia de testes automatizados de API e frontend reduz confiabilidade em releases.
- Integracoes externas (MT5/Telegram) sem suite de regressao deterministica.
- Limpeza destrutiva de dados (`/maintenance/reset-data`, `/logs`) depende de protecao apenas por auth basica.

## Priority recommendations
- Mover segredos/credenciais para variaveis de ambiente imediatamente.
- Fechar CORS por ambiente e reforcar auth (usuarios reais + refresh token/rotacao).
- Dividir modulos grandes por dominio (engine loop, API handlers, dashboard streamlit).
- Padronizar pipeline de testes para API, frontend e integracoes mockadas antes de proxima fase.
