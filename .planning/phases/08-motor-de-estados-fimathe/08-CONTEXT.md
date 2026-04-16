# Phase 08: Motor de Estados Fimathe - Context

**Gathered:** 2026-04-16
**Status:** Ready for planning
**Source:** Roadmap + Phase 07 artifacts + FIMATHE strategy base

<domain>
## Phase Boundary

Esta fase deve extrair e formalizar o motor de estados Fimathe em modulo dedicado,
mantendo comportamento equivalente ao fluxo atual de sinais e tornando as transicoes
explicitamente testaveis para BUY e SELL.

Fora de escopo:
- Mudancas amplas de UX (Phase 10).
- Reescrita completa do motor de risco (Phase 9).
- Alteracao da estrategia base Fimathe.

</domain>

<decisions>
## Implementation Decisions

### Locked Decisions
- Manter as regras FIM-001..FIM-008 como gates centrais do fluxo de entrada.
- Preservar campos de observabilidade ja usados no runtime (`rule_id`, `rule_name`, `next_trigger`, `rule_trace`, `reason`, `signal`).
- Tratar Ponto-A/Ponto-B, projecoes (50/80/85/100) e agrupamento como estado/transicao formal (nao apenas calculo inline monolitico).
- Garantir simetria funcional para sinais BUY e SELL.
- Evitar dependencia direta de MT5 dentro do nucleo da maquina de estados (nucleo deterministico e testavel).

### the agent's Discretion
- Definir nomes finais dos estados internos e estrutura de payload intermediario.
- Escolher se o motor de estados sera classe ou funcoes puras com dataclasses.
- Ajustar granularidade dos testes (unitarios puros vs integracao leve com `SignalDetector`).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Estrategia e regra
- `.planning/research/FIMATHE-ESTRATEGIA.md` - Base oficial da tecnica (A/B, canais, projecoes, agrupamentos e risco).
- `.planning/phases/07-fimathe-aderencia-total/07-STEP1-SPEC.md` - Regras FIM-001..FIM-014 em formato executavel.
- `.planning/phases/07-fimathe-aderencia-total/07-STEP2-GAP-ANALYSIS.md` - Mapeamento de cobertura e lacunas anteriores.

### Implementacao atual
- `src/analysis/signals.py` - Logica Fimathe vigente (atualmente monolitica).
- `src/main.py` - Integracao runtime/payload e registro de diagnostico.
- `config/settings.json` - Parametros operacionais de sinal.
- `tests/test_fimathe_cycle.py` - Exemplo de testes de ciclo deterministico.

</canonical_refs>

<specifics>
## Specific Ideas

- Introduzir `src/analysis/fimathe_state_engine.py` para encapsular estado e transicoes.
- Refatorar `SignalDetector.evaluate_signal_details` para atuar como orquestrador do state engine.
- Criar testes dedicados para transicoes de tendencia, regiao negociavel, agrupamento e liberacao final de entrada.

</specifics>

<deferred>
## Deferred Ideas

- Persistir historico completo de transicoes de estado em banco (avaliar em fase futura).
- Backtest automatizado em massa para calibracao de thresholds.

</deferred>

---

*Phase: 08-motor-de-estados-fimathe*
*Context gathered: 2026-04-16*
