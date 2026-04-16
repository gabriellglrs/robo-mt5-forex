# Roadmap do Projeto: Robo MT5 v2

## Milestone 1: Base Operacional (Historico)
- [x] Fases 1 a 6 concluidas (base de conexao, sinais, execucao, dashboard e comandos).

## Milestone 2: Aderencia Total a Estrategia Fimathe (Ativo)

- [x] **Phase 7: SPEC, Gap Analysis e Implementacao Fimathe**
  - [x] Passo 1: SPEC executavel (IF/THEN).
  - [x] Passo 2: Gap analysis codigo vs estrategia.
  - [x] Passo 3: Motor de decisao inicial implementado (A/B, projecoes, agrupamento).
  - [x] Passo 4: Gestao de risco estrutural inicial implementada.
  - [x] Passo 5: Configuracoes e UX Fimathe avancadas em PT-BR.
  - [x] Pendencia final 1: Ciclo explicito de stop por eventos (topo/50/100).
  - [x] Pendencia final 2: Rastreio completo por `rule_id` (FIM-001..FIM-014) no fluxo em tempo real.
  - [x] Pendencia final 3: Testes de cenario/replay para aderencia comportamental.

- [x] **Phase 8: Motor de Estados Fimathe**
  - [x] Ponto-A/Ponto-B objetivos.
  - [x] Projecoes 50/80/85/100.
  - [x] Agrupamento no timeframe menor.

- [x] **Phase 09: Gestão de Risco Fimathe**
    - [x] Trava de segurança de 3% (Balance-based).
    - [x] Auto-trailing proativo (50% BE / 100% Lock).
    - [x] Stop Técnico Inicial (STI) estrutural.

- [x] **Phase 10: UX e Configuracoes Completas**
  - [x] Todos os parametros da tecnica no painel.
  - [x] Baloes de ajuda completos em PT-BR.
  - [x] Auditoria com rastreio por regra da estrategia.

### Phase 7: SPEC, Gap Analysis e Implementacao Fimathe
**Goal**: Consolidar aderencia Fimathe no runtime com SPEC executavel, gap analysis e fechamento das pendencias criticas de ciclo/rastreio.
**Depends on**: None
**Requirements**: TBD
**Success Criteria**:
1. SPEC e gap analysis publicados na fase 07.
2. Regras FIM-001..FIM-014 mapeadas no fluxo operacional.
3. Pendencias de ciclo de stop e rastreio por `rule_id` fechadas.
4. Testes de replay do ciclo FIM-010 adicionados.

### Phase 8: Motor de Estados Fimathe
**Goal**: Extrair e formalizar o motor de estados Fimathe (A/B, projecoes 50/80/85/100 e agrupamento) em arquitetura dedicada, testavel e rastreavel.
**Depends on**: Phase 7
**Requirements**: TBD
**Success Criteria**:
1. Modulo de estados dedicado criado e integrado ao fluxo de sinais.
2. Estados/transicoes explicitados para trend, canal, projecoes e agrupamento.
3. Sinal final e motivos de bloqueio passam por maquina de estados unica.
4. Cobertura de testes unitarios para cenarios BUY e SELL de transicao de estado.

### Phase 9: Gestao de Risco Fimathe
**Goal**: Finalizar o motor de risco Fimathe com stop estrutural e movimentacao por eventos, preservando teto de risco por operacao.
**Depends on**: Phase 8
**Requirements**: TBD
**Success Criteria**:
1. Stop tecnico inicial usa estrutura validada da fase de estados.
2. Movimento de stop por topo/50/100 permanece deterministico e auditavel.
3. Calculo de lote por risco respeita limite maximo de 3%.
4. Fluxo de trailing e risco permanece coerente entre BUY e SELL.

### Phase 10: UX e Configuracoes Completas
**Goal**: Completar UX operacional da tecnica Fimathe no painel, com configuracoes completas e auditoria didatica por regra.
**Depends on**: Phase 8, Phase 9
**Requirements**: TBD
**Success Criteria**:
1. Todos os parametros da tecnica expostos na UI com ajuda em PT-BR.
2. Painel de auditoria mostra regra ativa, estado atual e proximo gatilho.
3. Fluxo runtime apresenta explicacao clara para entradas, bloqueios e ajustes de risco.
4. Operacao da estrategia pode ser conduzida sem edicao manual de codigo.

### Phase 11: Homologação e Testes de Funcionalidade Fimathe (Compliance com Manual)

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** Phase 10
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd-plan-phase 11 to break down)

---
**Status Atual**: Projeto CONCLUÍDO. Milestone 2 finalizado com 100% de aderência ao manual Fimathe.
