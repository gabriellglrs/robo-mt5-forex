# PLAN: Phase 23 - Strategy Lab Backtest Multi-Config por Ativo

## Objetivo de entrega
Entregar um laboratorio funcional para rodar simulacoes historicas por ativo/preset/configuracao e gerar ranking com metricas confiaveis.

## Wave 1 - Base de simulacao

### 1.1 Engine de replay
- [ ] Criar motor de replay que percorre OHLC em ordem temporal e chama o nucleo de decisao atual.
- [ ] Garantir modo sem lookahead (cada candle so enxerga historico disponivel ate aquele ponto).
- [ ] Aplicar regras de execucao simulada (spread, slippage e custos configuraveis).

### 1.2 Contrato de execucao
- [ ] Definir payload de run (ativo, janela, preset, variacao, custos, seed).
- [ ] Definir formato canonico de resultado (PnL, win rate, payoff, PF, drawdown, trades, bloqueios).
- [ ] Registrar rastreio de configuracao usada em cada run.

## Wave 2 - Cobertura multi-config

### 2.1 Matriz de configuracoes
- [ ] Rodar 100% dos presets oficiais.
- [ ] Gerar variacoes pairwise para parametros criticos (timeframe, risco, regras, exposicao).
- [ ] Criar suite critica exaustiva para bloqueios de risco e limites operacionais.

### 2.2 Persistencia de laboratorio
- [ ] Criar tabelas de simulacao separadas da operacao real.
- [ ] Persistir runs, resultados agregados e trades simulados.
- [ ] Permitir consulta por ativo, periodo, preset e score.

## Wave 3 - Interface de uso

### 3.1 Rota/tela do laboratorio
- [ ] Criar rota dedicada (ex.: `/lab`) para disparar testes 2/7/14 dias.
- [ ] Exibir progresso, status e erros de execucao.
- [ ] Exibir ranking por ativo e comparacao entre presets/configuracoes.

### 3.2 Export e auditoria
- [ ] Exportar resultados consolidados (CSV/JSON).
- [ ] Exibir explicacao minima de criterios do score.
- [ ] Garantir reprodutibilidade por run id + configuracao.

## UAT (criterios de aceite)

- [ ] Usuario consegue rodar simulacao para 2/7/14 dias por ativo.
- [ ] Sistema compara multiplas configuracoes e retorna ranking legivel.
- [ ] Resultados ficam salvos e consultaveis no banco sem misturar com trades reais.
- [ ] Execucao e score sao reprodutiveis com a mesma configuracao.

## Testes recomendados

- [ ] Unit: validacao do replay e regras anti-lookahead.
- [ ] Unit: calculo de metricas (PF, payoff, drawdown, win rate).
- [ ] Integration: persistencia completa de run + resultados.
- [ ] Integration: pipeline preset -> simulacao -> ranking.
- [ ] UI/Component: render de ranking, filtros e estado de execucao.

## Riscos e mitigacoes

- Risco: explosao combinatoria de configs.
  Mitigacao: presets completos + pairwise + suite critica.

- Risco: divergencia entre motor real e motor de simulacao.
  Mitigacao: reutilizar o mesmo nucleo de decisao e criar testes de paridade.

- Risco: custo alto de execucao em muitos ativos.
  Mitigacao: filas por lote, limite de concorrencia e cache de dados historicos.

## Definicao de pronto

- [ ] Engine de replay funcional sem lookahead.
- [ ] Matriz inicial multi-config operacional.
- [ ] Persistencia e ranking disponiveis em rota propria.
- [ ] Suite minima de testes cobrindo calculo, persistencia e pipeline.
