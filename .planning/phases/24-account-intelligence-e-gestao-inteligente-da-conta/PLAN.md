# PLAN: Phase 24 - Account Intelligence e Gestao Inteligente da Conta

## Objetivo de entrega
Disponibilizar uma camada de inteligencia de conta que ajude o usuario a decidir onde, quando e com qual preset operar, com base em evidencias objetivas da Phase 23.

## Wave 1 - Dados e contratos de inteligencia

### 1.1 Contrato de entrada
- [ ] Definir consumo dos resultados da Phase 23 (ranking por ativo/configuracao/periodo).
- [ ] Definir score de saude da conta por horizonte (dia/semana/mes).
- [ ] Definir modelo de explicacao das recomendacoes (motivo, evidencia, confianca).

### 1.2 Persistencia
- [ ] Criar tabela(s) de snapshots de inteligencia de conta.
- [ ] Persistir ranking, recomendacoes e sinais de risco operacional.
- [ ] Permitir historico comparativo entre snapshots.

## Wave 2 - Motor de decisao para o usuario

### 2.1 Analise temporal
- [ ] Consolidar desempenho por dia/semana/mes.
- [ ] Detectar fase ruim/boa e alertas de deterioracao.
- [ ] Sinalizar ativos com queda de aderencia recente.

### 2.2 Recomendacao por ativo
- [ ] Gerar ranking de ativos por oportunidade atual.
- [ ] Sugerir preset/configuracao por ativo com justificativa objetiva.
- [ ] Exibir trade-off de risco antes de recomendar mudanca.

## Wave 3 - Rota/tela de Account Intelligence

### 3.1 Interface
- [ ] Criar rota dedicada (ex.: `/account-intelligence`).
- [ ] Exibir KPI de saude da conta + ranking de ativos.
- [ ] Exibir recomendacoes acionaveis com explicabilidade.

### 3.2 Operacao assistida
- [ ] Permitir aplicar sugestao de preset de forma assistida (com confirmacao).
- [ ] Registrar decisao do usuario e resultado posterior para aprendizado.
- [ ] Exportar leitura consolidada da conta (CSV/JSON).

## UAT (criterios de aceite)

- [ ] Usuario identifica rapidamente se periodo atual esta bom ou ruim.
- [ ] Usuario entende quais ativos sao mais aderentes no momento.
- [ ] Usuario recebe recomendacao de preset com motivo claro.
- [ ] Usuario consegue comparar recomendacoes com resultados historicos.

## Testes recomendados

- [ ] Unit: score de saude e ranking por ativo.
- [ ] Unit: explicabilidade e consistencia das recomendacoes.
- [ ] Integration: pipeline Phase23 -> inteligencia -> persistencia.
- [ ] UI/Component: render de painel, ranking e recomendacao com estados de erro.
- [ ] E2E: fluxo de consulta -> decisao -> aplicacao assistida.

## Riscos e mitigacoes

- Risco: recomendacoes sem contexto suficiente.
  Mitigacao: obrigar evidencia + periodo + confianca em toda sugestao.

- Risco: viés por janela curta.
  Mitigacao: comparar janelas 2/7/14 dias com sinal de estabilidade.

- Risco: acoplamento fraco com Phase 23.
  Mitigacao: contrato de dados versionado e validado por testes de integracao.

## Definicao de pronto

- [ ] Rota de Account Intelligence operacional.
- [ ] Ranking e recomendacoes por ativo com explicacao.
- [ ] Persistencia de snapshots e historico.
- [ ] Testes minimos cobrindo motor, contrato e UI.
