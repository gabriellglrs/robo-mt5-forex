# Testing

## Ferramental
- Framework principal: `pytest` (`pytest.ini`).
- Escopo padrao: pasta `tests/`.
- Import path controlado por `pythonpath = src` para testes do backend.

## Suites principais
- Estado Fimathe: `tests/test_fimathe_state_engine.py`.
- Ciclo de gestao de risco: `tests/test_fimathe_cycle.py` e `tests/test_fimathe_cycle_v2.py`.
- Hardening/regras operacionais: `tests/test_fimathe_hardening.py`.
- Persistencia e banco: `tests/test_db_persistence.py`.
- Compliance manual: `tests/homologacao/test_manual_compliance.py`.

## Scripts de verificacao manual
- `tests/verify_signals.py`: validacao funcional de sinais.
- `tests/verify_orders.py`: verificacao de fluxo de ordens.
- `tests/verify_levels.py`: cheque de niveis/projecoes.
- `tests/run_engine_tests.py`: orquestracao de execucoes de teste locais.

## Cobertura funcional observada
- Regras FIM de bloqueio e liberacao de setup sao exercitadas por asserts de `reason` e `rule_id`.
- Eventos de ciclo (`perdeu_topo`, `perdeu_50`, `perdeu_100`) possuem cenarios dedicados.
- Caminho feliz BUY/SELL da state machine esta coberto em testes unitarios.

## Lacunas atuais
- Nao ha evidencias de testes automatizados para API FastAPI (`/settings`, `/notifications`, `/start`, `/stop`).
- Nao ha suite automatizada de frontend Next.js (sem Jest/Playwright/Vitest configurados).
- Integracoes externas (Telegram e MT5 real) dependem de ambiente manual.
- Fluxos de seguranca (JWT expirado, abuso de endpoints) nao aparecem cobertos.

## Recomencacoes de evolucao
- Adicionar testes de contrato para API com `TestClient` FastAPI.
- Criar smoke E2E para frontend critico (`login`, `monitor`, `settings`).
- Isolar MT5 e Telegram com doubles de teste para cenarios deterministas.
- Cobrir regressao de schema em `validate_and_normalize_settings` por tabela de casos.

## Comando base de execucao
- `pytest` para rodar suite principal.
- `pytest tests/test_fimathe_state_engine.py -q` para feedback rapido do state engine.
