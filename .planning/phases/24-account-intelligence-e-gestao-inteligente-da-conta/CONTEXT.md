# CONTEXT: Phase 24 - Account Intelligence e Gestao Inteligente da Conta

## Objetivo da fase
Transformar resultados tecnicos do laboratorio (Phase 23) em uma experiencia de gestao de conta orientada a decisao, com foco em qualidade operacional do robo por ativo e horizonte temporal.

## Motivacao
- O usuario precisa saber se a conta esta em fase boa/ruim por dia, semana e mes.
- O usuario precisa identificar quais ativos estao mais aderentes ao setup atual.
- O usuario precisa receber sugestoes praticas de preset/configuracao com explicacao clara.

## Dependencia critica
- Consome dados de simulacao/ranking da Phase 23 como base de evidencia.

## Escopo inicial
- Rota/tela dedicada para Account Intelligence (gestao da conta).
- Painel de saude operacional e risco agregado.
- Ranking de oportunidade por ativo e recomendacao de preset.
- Explicabilidade minima para cada sugestao mostrada.

## Fora de escopo
- Execucao automatica de mudanca de preset sem confirmacao do usuario.
- Qualquer alteracao no motor de entrada sem cobertura validada.

## Decisoes base
- Recomendacoes sempre com rastreio da evidencia (periodo, ativo, configuracao comparada).
- UI prioriza leitura rapida para tomada de decisao intraday e semanal.
- Persistencia de snapshots de inteligencia para comparacao historica.
