# Plano de Implementacao: Phase 4 (Banco de Dados e Historico)

Implementar o ciclo completo de persistencia operacional: abertura e fechamento de trades, auditoria de ordens rejeitadas e exportacao de relatorios para analise externa.

## Objetivo da Phase

- Garantir historico confiavel para dashboard e auditoria.
- Registrar o ciclo de vida completo dos trades (OPEN -> CLOSED).
- Persistir erros/rejeicoes de execucao com contexto suficiente para diagnostico.
- Disponibilizar exportacao CSV para analise e backup.

## Mudancas Propostas

### 1. Evolucao do banco (`src/core/database.py`) [MODIFY]
- Adicionar metodo `close_trade(ticket, exit_price, pnl)` para atualizar `exit_price`, `exit_time`, `pnl` e `status='CLOSED'`.
- Adicionar metodo `save_order_rejection(...)` para registrar recusas com `retcode`, `comment`, `symbol`, `volume`, `sl`, `tp`, `timeframe` e `strategy`.
- Criar tabela `order_rejections` no bootstrap (`_create_tables`) com indice por `timestamp` e `symbol`.
- Adicionar metodo de exportacao `export_trades_csv(output_path)` usando query ordenada por `entry_time DESC`.

### 2. Integracao na execucao (`src/execution/orders.py`) [MODIFY]
- Quando `mt5.order_send` retornar erro, registrar tambem em `order_rejections` (alem de `system_logs`).
- Garantir que `indicators` nunca seja `None` ao persistir (padrao `{}`), evitando JSON nulo inconsistente.
- Preservar persistencia de abertura de trade ja existente sem regressao.

### 3. Fechamento de trades no loop principal (`src/main.py`) [MODIFY]
- Implementar reconciliacao periodica de tickets abertos no banco contra `mt5.positions_get()` e `mt5.history_orders_get()`.
- Para tickets sem posicao aberta e com confirmacao no historico, chamar `db_manager.close_trade(...)`.
- Registrar eventos de reconciliacao (quantidade de trades fechados por ciclo).

### 4. Cobertura de teste e validacao (`tests/`) [MODIFY/NEW]
- Atualizar `tests/test_db_persistence.py` para validar:
  - criacao de `order_rejections`,
  - insercao de rejeicao mock,
  - fechamento de trade mock via `close_trade`.
- Criar `tests/test_trade_lifecycle.py` com fluxo OPEN -> CLOSED em banco (sem depender de envio real ao MT5).

## Tasks de Execucao

- [ ] **Task 4.1**: Expandir schema e API do `DatabaseManager` com `close_trade`, `save_order_rejection` e `export_trades_csv`.
- [ ] **Task 4.2**: Integrar persistencia de rejeicoes no `OrderEngine` para todos os `retcode != TRADE_RETCODE_DONE`.
- [ ] **Task 4.3**: Implementar reconciliacao de fechamento no loop principal e atualizar status dos trades.
- [ ] **Task 4.4**: Criar/atualizar testes de persistencia e ciclo de vida para validar schema novo e update de fechamento.
- [ ] **Task 4.5**: Executar testes e registrar evidencias de validacao no resumo da fase.

## Plano de Verificacao

### Testes Automatizados
- `python -m pytest tests/test_db_persistence.py -q`
- `python -m pytest tests/test_trade_lifecycle.py -q`

### Verificacao Manual
- Rodar o robo em demo por alguns minutos.
- Confirmar no banco:
  - novos registros em `trades` com `status='OPEN'`,
  - transicao para `status='CLOSED'` apos fechamento no MT5,
  - registros em `order_rejections` quando houver erro de envio.
- Executar exportacao CSV e validar arquivo gerado com cabecalhos esperados.
