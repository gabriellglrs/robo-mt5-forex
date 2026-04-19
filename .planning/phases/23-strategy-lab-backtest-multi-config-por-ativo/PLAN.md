# PLAN: Phase 23 - Strategy Lab Backtest Multi-Config por Ativo

Implementar um laboratorio de replay/backtest para comparar ativos, presets e variacoes de configuracao Fimathe em 2/7/14 dias com rastreabilidade completa.

## Objetivo de Entrega

Ao final da fase, o sistema deve:
- Rodar simulacoes historicas por ativo no mesmo fluxo de decisao do runtime.
- Evitar lookahead bias no processamento candle a candle.
- Salvar resultados de laboratorio em armazenamento separado da operacao real.
- Expor API + rota web para disparo, acompanhamento e ranking.

## Escopo Tecnico Confirmado

- Reuso do nucleo atual: `src/analysis/signals.py` + `src/main.py` (sem duplicar regra Fimathe).
- Entrada de dados historicos via MT5 usando padrao ja existente em `src/api/main.py`.
- Persistencia em MySQL via camada atual de banco (`src/core/database.py`) com tabelas de laboratorio dedicadas.
- Entrega web no dashboard Next.js (nova rota, sem interferir em `/monitor`).

## Wave 1 - Contratos e Engine de Replay

### 1.1 Contrato canonico de simulacao
- [ ] Definir schema de request do laboratorio: `symbol`, `window_days`, `preset_id`, `override_config`, `spread_model`, `slippage_model`.
- [ ] Definir schema de resposta: metricas consolidadas, metadata de execucao, hash de configuracao e id de reproducao.
- [ ] Padronizar status de job (`queued`, `running`, `done`, `failed`, `cancelled`) para UI e API.

### 1.2 Replay candle a candle sem lookahead
- [ ] Criar modulo dedicado do laboratorio (ex.: `src/analysis/strategy_lab/`) para orquestrar replay.
- [ ] Garantir que cada passo usa apenas historico ate o candle corrente.
- [ ] Simular execucao com custos (spread/slippage/comissao) configuraveis.
- [ ] Registrar eventos de bloqueio por `rule_id` para auditoria comparavel com runtime.

## Wave 2 - Matriz Multi-Config e Ranking

### 2.1 Geracao de combinacoes sem explosao combinatoria
- [ ] Cobrir 100% dos presets oficiais (`FIM-010`, `FIM-017`, `FIM-018` e demais ativos no sistema).
- [ ] Implementar variacoes pairwise para parametros criticos (risco, timeframe, filtros, exposicao).
- [ ] Implementar suite critica fixa para cenarios de risco (FIM-012 e bloqueios operacionais).

### 2.2 Pipeline de metricas e score
- [ ] Calcular PnL, win rate, payoff, profit factor, drawdown maximo, total de trades e taxa de bloqueio.
- [ ] Definir score unico e explicavel para ranking por ativo/configuracao.
- [ ] Salvar breakdown de score para permitir auditoria (por que configuracao A ficou acima de B).

## Wave 3 - Persistencia e API

### 3.1 Banco dedicado de laboratorio
- [ ] Criar tabelas separadas para `lab_runs`, `lab_results`, `lab_trades` (sem misturar com `trades` reais).
- [ ] Salvar snapshot de configuracao por run para reproducao fiel.
- [ ] Adicionar indices por `symbol`, `window_days`, `preset_id`, `created_at` para consulta rapida.

### 3.2 Endpoints do laboratorio
- [ ] Criar endpoints para iniciar run, listar runs, consultar detalhes e ranking.
- [ ] Implementar paginacao e filtros por ativo/periodo/preset.
- [ ] Adicionar endpoint de export (CSV/JSON) por run e ranking agregado.

## Wave 4 - Interface Web do Strategy Lab

### 4.1 Rota e controles de execucao
- [ ] Criar rota web dedicada (ex.: `/estrategia` ou `/lab`) com formulario de disparo 2/7/14 dias.
- [ ] Exibir fila/progresso/erro/sucesso por run.
- [ ] Permitir rerun com a mesma configuracao em um clique.

### 4.2 Ranking e analise comparativa
- [ ] Exibir tabela de ranking por ativo com filtros por janela e preset.
- [ ] Exibir comparacao lado a lado entre configuracoes selecionadas.
- [ ] Exibir justificativa do score (metricas e pesos) para decisao do usuario.

## UAT (Criterios de Aceite)

- [ ] Usuario dispara simulacao 2/7/14 dias por ativo e recebe status ate conclusao.
- [ ] Ranking final mostra comparacao clara entre presets/configuracoes por ativo.
- [ ] Todos os resultados ficam persistidos em tabelas de laboratorio e podem ser reconsultados.
- [ ] Reexecucao com mesma configuracao gera resultados consistentes (variacao controlada apenas por custos/mercado).

## Plano de Testes

- [ ] Unit: replay sem lookahead e consistencia de eventos por candle.
- [ ] Unit: calculo de metricas e score com fixtures deterministicas.
- [ ] Integration: pipeline completo (`request -> replay -> persist -> ranking`).
- [ ] Integration: isolamento entre dados de laboratorio e operacao real.
- [ ] API: contratos de erro/sucesso, filtros e export.
- [ ] UI/Component: fluxo de disparo, progresso e render de ranking.

## Riscos e Mitigacoes

- Risco: divergencia entre comportamento do runtime e laboratorio.
  Mitigacao: reutilizar o mesmo nucleo de decisao e criar teste de paridade em cenarios fixos.

- Risco: volume alto de combinacoes gerar custo excessivo.
  Mitigacao: presets completos + pairwise + suite critica (sem busca exaustiva total).

- Risco: ranking opaco para o usuario.
  Mitigacao: expor formula de score e breakdown por metrica no frontend.

## Definicao de Pronto

- [ ] Engine de replay validada com testes anti-lookahead.
- [ ] Matriz multi-config implementada com cobertura pragmatica.
- [ ] Persistencia separada e API de consulta/export operacionais.
- [ ] Rota web de laboratorio entregue com ranking e comparacao.
- [ ] Base pronta para alimentar a Phase 24 (Account Intelligence).
