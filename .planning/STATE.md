---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: Phase 21 Hardened (Sensitivity & Hot-Reload) — milestone-3
last_updated: "2026-04-18T00:15:31.000Z"
progress:
  total_phases: 14
  completed_phases: 3
  total_plans: 6
  completed_plans: 7
  percent: 100
---

# Project State: robo-mt5-v2

## Contexto Atual

Projeto com Phase 20 finalizada. O motor de execução `fimathe_cycle.py` agora é um sistema de gestão dinâmica completo, suportando modos Padrão, Conservador e Infinity, com total transparência via Academy e Dashboard.

## Status das Fases (Recentes)

- [x] Phase 1 a 17: BI, Performance e Core
- [x] Phase 18: Trailing Purista (FIM-010)
- [x] Phase 19: UX Educativo (Tooltips Globais)
- [x] Phase 20: Stop Loss Estratégico (FIM-017 / FIM-018)
- [x] Phase 20.1: Hotfix de Sincronização e Reconciliação
- [x] Phase 21: Asset Deep Dive & Live Charting (Sensibilidade Hardened)

## Estado Atual

## Entregas fechadas na Phase 21 (Asset Deep Dive)

- **Gráficos em Tempo Real**: Integração de TradingView Lightweight Charts para velas M1/M15.
- **Sensibilidade de Canal (A/B)**: Remoção de restrições rígidas, permitindo canais micro (5+ velas) para estratégias scalper.
- **Hot-Reload Operacional**: Recálculo dinâmico de todos os parâmetros (Trailing, Buffers, Cooldowns) a cada ciclo de 1s sem restart.
- **API High-Performance**: Otimização da conexão MT5 no backend, reduzindo latência de atualização de 4s para <1s.
- **Sincronismo Lateral**: Correção do bug que ocultava canais em mercados sem tendência clara.

## Entregas fechadas na Phase 20 (Stop Loss Estratégico)

- SPEC e Gap Analysis consolidados.
- Ciclo explicito de stop por eventos adicionado.
- Rastreio por `rule_id` integrado ao runtime.

## Entregas fechadas na Phase 8

- **Motor de Estados Dedicado**: `src/analysis/fimathe_state_engine.py` centralizando regras FIM-001..FIM-008.
- **RefatoraÃ§Ã£o de Sinais**: `src/analysis/signals.py` simplificado e desacoplado.
- **Suite de Testes**: 11 cenÃ¡rios de teste unitÃ¡rio em `tests/test_fimathe_state_engine.py`.
- **ValidaÃ§Ã£o Funcional**: Smoke test `tests/verify_signals.py` aprovado com MT5 venv.

## Entregas fechadas na Phase 9

- **CÃ¡lculo de Lote DeterminÃ­stico**: Trava de risco em 3% do Account Balance.
- **Stop TÃ©cnico Fimathe (STI)**: Posicionamento automÃ¡tico com base na Zona Neutra.
- **Trailing Stop Proativo**: Gatilhos automÃ¡ticos para Break-even (50%) e Trava de Lucro (100%).
- **Suite de Testes de Risco**: ValidaÃ§Ã£o de gatilhos proativos em `tests/test_fimathe_cycle.py`.

## Entregas fechadas na Phase 13

- **Snapshot Financeiro**: InjeÃ§Ã£o de `Balance`, `Equity` e `Profit` global no runtime snapshot.
- **PnL por Ativo**: Rastreamento individual de lucro/prejuÃ­zo flutuante por sÃ­mbolo.
- **Dashboard Financeiro & Fluxo de Logs**: Novo CabeÃ§alho global com widgets neon para capital e grid unificado de histÃ³rico.
- **Blindagem Visual StandBy Global**: Todo o painel oculta painÃ©is de tabelas e mÃ©tricas dinÃ¢micas caso a chave mestra seja desligada, resolvendo resquÃ­cios de front-end assÃ­ncrono perigoso com a barreira "MOTOR EM STANDBY".
- **BotÃµes Premium Cockpit**: O botÃ£o de Iniciar/Parar RobÃ´ repaginados ao estilo cyberpunk/sci-fi com animaÃ§Ã£o "glass fx", alertas pulsantes em vermelho caso rodando, e caixa alta.
- **RÃ©gua de NÃ­veis**: Novo componente `FimatheStructureGauge` para visualizaÃ§Ã£o grÃ¡fica da posiÃ§Ã£o do preÃ§o em relaÃ§Ã£o aos nÃ­veis A/B e alvos.
- **Interatividade Total**: ExibiÃ§Ã£o explÃ­cita de `rule_id`, `next_trigger` em tempo real e tooltips ricos.

## Validacao comportamental

- MÃ¡quina de estados desacoplada com transiÃ§Ãµes explÃ­citas.
- GestÃ£o de risco proativa sem depender de cruzamento de volta (retrataÃ§Ã£o) para proteÃ§Ã£o inicial.
- 100% de aproveitamento nos testes unitÃ¡rios de ciclo.

## Entregas fechadas na Phase 17 (Performance BI)

- **Central de Inteligência**: Nova rota `/stats` com visual "Relatório Executivo".
- **KPIs Profissionais**: Implementação de Fator de Lucro, Payoff Ratio e Win Rate no Backend.
- **Análise de Risco**: Cálculo automático de Drawdown Máximo Realizado.
- **Gráficos Dinâmicos**: Curva de Equity Realizada, Distribuição Win/Loss e Ranking de Performance por Ativo (BarChart).

## Proximo passo imediato

Monitorar a precisão dos dados de performance conforme mais trades são fechados e validar se os cálculos de drawdown refletem fielmente a realidade da conta vinculada.

## Accumulated Context

### Roadmap Evolution

- **2026-04-16**: Phase 11 added (HomologaÃ§Ã£o e Testes de Funcionalidade Fimathe) baseada no manual de estratÃ©gia original.

- **2026-04-17**: Backlog futuro da Web Next.js registrado no ROADMAP (seguranca de sessao, contrato API/UI, validacoes, testes, a11y e observabilidade).
- **2026-04-17**: Backlog futuro de implementacoes funcionais Web + MT5 registrado no ROADMAP (conexao operacional, validacoes de corretora, reconciliacao, risco operacional, alertas e relatorios).
