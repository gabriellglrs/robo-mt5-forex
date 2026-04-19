# CONTEXT: Phase 23 - Strategy Lab Backtest Multi-Config por Ativo

## Objetivo da fase
Construir um laboratorio de simulacao historica (replay/backtest) para medir, comparar e ranquear o desempenho do robo por ativo, preset e configuracao Fimathe em janelas curtas (2/7/14 dias).

## Motivacao
- Reduzir decisao por intuicao na escolha de ativo/configuracao.
- Produzir evidencias objetivas para apoiar a fase de inteligencia de conta (fase 24).
- Aumentar confianca operacional antes de aplicar mudancas em conta real.

## Problemas a resolver
1. Como testar multiplas configuracoes sem explosao combinatoria.
2. Como reaproveitar o mesmo motor de decisao do runtime sem lookahead bias.
3. Como armazenar resultados de forma auditavel para comparacao historica.

## Escopo inicial
- Ativos alvo: pares principais configurados no robo (ex.: EURUSD, GBPUSD, USDJPY).
- Janelas de teste: 2, 7 e 14 dias.
- Modos de configuracao: presets oficiais + variacoes criticas de risco/execucao/regras.
- Saida: metricas por execucao e ranking por ativo/configuracao.

## Fora de escopo desta fase
- Recomendacao automatica final para o usuario (fase 24).
- Otimizacao global exaustiva de todas as combinacoes possiveis.

## Decisoes base
- Backtest por replay candle a candle usando o mesmo nucleo de decisao Fimathe.
- Separacao de dados de simulacao das tabelas de operacao real.
- Cobertura de testes por estrategia mista (presets 100% + variacoes pairwise + suite critica de risco).

## Dependencias
- Phase 22 concluida para estabilidade de eventos e observabilidade operacional.
- Estrutura de persistencia existente em MySQL para extensao de tabelas de simulacao.
