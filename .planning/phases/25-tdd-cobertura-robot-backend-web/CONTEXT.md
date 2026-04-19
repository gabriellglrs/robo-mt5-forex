# Phase 25 - Context

**Gathered:** 2026-04-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Implementar uma base de testes TDD para reduzir regressao entre robo (`src/main.py`), API (`src/api/main.py`) e web dashboard (`web-dashboard`), com foco no fluxo operacional Fimathe.

Escopo desta fase:
- Definir contrato de teste minimo por camada (robot, backend, frontend).
- Cobrir cenarios criticos com testes automatizados primeiro (RED -> GREEN).
- Padronizar comandos de execucao local para validacao rapida antes de deploy.
- Documentar limites do que deve ser bloqueado por validacao de configuracao.

Fora de escopo desta fase:
- Refatoracao ampla de arquitetura.
- Reescrita completa de suites antigas.
- Cobertura 100% de linhas em todo o projeto.

</domain>

<decisions>
## Implementation Decisions

### Prioridade de cobertura (MVP)
- Robot: regras de bloqueio de configuracao Fimathe que evitam conflito operacional.
- Backend: endpoints de configuracao/notificacao com validacoes e retornos consistentes.
- Frontend: validacao de formulario, alertas visuais de conflito e reset para preset oficial.

### Estrategia TDD
- Cada fluxo novo ou bug fix deve iniciar com teste falhando.
- Fix minimo para passar teste sem alterar comportamentos fora do escopo.
- Regressao obrigatoria para erros ja reportados no monitor por ativo.

### Gate de qualidade
- `pytest` para backend/robot.
- `npm --prefix web-dashboard run test` (ou suite equivalente existente) para frontend.
- `npm --prefix web-dashboard run lint` tratado como gate parcial: falhas pre-existentes devem ser separadas de regressao nova.

### the agent's Discretion
- Escolha exata dos arquivos de teste por modulo.
- Nivel de mock por camada para manter execucao estavel no ambiente local.
- Estrutura de helper/shared fixtures.

</decisions>

<canonical_refs>
## Canonical References

- `.planning/ROADMAP.md`
- `src/main.py`
- `src/api/main.py`
- `src/core/database.py`
- `web-dashboard/src/app/monitor/[symbol]/page.tsx`
- `web-dashboard/src/app/settings/page.tsx`
- `web-dashboard/src/app/notifications/page.tsx`

</canonical_refs>

<specifics>
## Specific Ideas

- Cobrir explicitamente combinacoes invalidas de FIM-017/FIM-018 e gatilhos de arraste.
- Cobrir fluxo de alerta visual no card/input responsavel pelo conflito.
- Garantir que reset de configuracao restaure preset padrao oficial sem lixo residual.

</specifics>

<deferred>
## Deferred Ideas

- Pipeline CI completo com matriz de browser + python versions.
- Metricas de cobertura por modulo no dashboard interno.
- Testes de carga para rajada de notificacoes em producao.

</deferred>

---

*Phase: 25-tdd-cobertura-robot-backend-web*
*Context gathered: 2026-04-18*
