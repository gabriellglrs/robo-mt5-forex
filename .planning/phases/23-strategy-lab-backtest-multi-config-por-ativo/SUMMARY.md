# SUMMARY: Phase 23 - Strategy Lab Backtest Multi-Config por Ativo

## Entregas implementadas

- Engine de laboratorio evoluida em `src/analysis/strategy_lab.py` com:
  - score breakdown explicavel por componente (pnl, win rate, profit factor, drawdown);
  - metrica de bloqueio (`blocked_rate`);
  - execucao de matriz multi-config via `run_matrix_backtest`.
- Servico de execucao dedicado `src/analysis/strategy_lab_service.py` para:
  - buscar historico no MT5 por janela (2/7/14 via API);
  - executar replay candle a candle sem lookahead;
  - persistir run/resultados/trades no banco.
- Persistencia separada de laboratorio adicionada em `src/core/database.py`:
  - tabelas `lab_runs`, `lab_results`, `lab_trades`;
  - indices de consulta para ranking e historico;
  - metodos CRUD/consulta para runs, detalhes e ranking agregado.
- API do Strategy Lab adicionada em `src/api/main.py`:
  - `POST /lab/runs`
  - `GET /lab/runs`
  - `GET /lab/runs/{run_id}`
  - `GET /lab/ranking`
  - `GET /lab/runs/{run_id}/export?format=json|csv`
- UI web entregue em `web-dashboard/src/app/lab/page.tsx` com:
  - formulario de disparo (ativo, janela, preset, spread/slippage);
  - tabela de runs recentes com status/erro;
  - ranking agregado por ativo/preset/janela.
- Navegacao atualizada em `web-dashboard/src/components/Sidebar.tsx` com entrada `Strategy Lab`.

## Testes

- Novo arquivo `tests/test_strategy_lab.py` cobrindo:
  - presets oficiais e variacoes;
  - metricas do replay e score breakdown;
  - ordenacao do ranking da matriz por score.
- Execucao local:
  - `py -m pytest tests/test_strategy_lab.py -q`
  - Resultado: `3 passed` (com warning de `.pytest_cache` no ambiente Windows).

## Observacoes

- A execucao de run depende de MT5 conectado no backend.
- Os dados de laboratorio permanecem isolados das tabelas de operacao real (`trades`).
