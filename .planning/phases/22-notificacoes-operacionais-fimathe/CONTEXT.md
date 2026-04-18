# Phase 22 - Context

**Gathered:** 2026-04-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Implementar notificacoes operacionais do robo MT5 + Dashboard Web com foco em eventos de alta relevancia, evitando spam e garantindo rastreabilidade.

Escopo desta fase:
- Motor de notificacoes (classificacao, deduplicacao, cooldown, agregacao).
- Entrega inicial via Telegram.
- Exposicao de historico/estado de notificacoes para o frontend.
- Preferencias basicas de notificacao no Settings.

Fora de escopo desta fase:
- Integracao multi-canal completa (Discord/WhatsApp/SMS).
- IA generativa para reescrever mensagens.
- Motor de campanha/marketing.

</domain>

<decisions>
## Implementation Decisions

### Eventos obrigatorios (MVP)
- Execucao: ordem aberta, ordem fechada, ordem rejeitada.
- Risco: SL para 0x0 (break-even), trailing de SL, limite de exposicao (FIM-012).
- Saude: erro critico do motor, desconexao/reconexao MT5.

### Taxonomia de prioridade
- P1: execucao e saude critica (sempre notificar).
- P2: gestao de risco relevante (notificar com anti-spam).
- P3: setup informativo (desligado por padrao no MVP).

### Anti-spam (obrigatorio)
- Deduplicacao por chave de evento: tipo + simbolo + ticket + regra + janela temporal.
- Cooldown por tipo de evento e por simbolo.
- Agregacao de eventos repetidos (ex: trailing em rajada).

### Contrato de payload
- Campos minimos: timestamp, symbol, event_type, priority, message, rule_id, ticket, side, price, sl, tp.
- Campos ausentes devem ser preenchidos com null, sem quebrar serializacao.

### the agent's Discretion
- Estrutura interna dos modulos de notificacao.
- Escolha de nomes de arquivos/componentes para web.
- Estrategia de persistencia (arquivo/DB) desde que mantenha auditoria simples.

</decisions>

<canonical_refs>
## Canonical References

- `.planning/ROADMAP.md` - escopo e dependencias da fase.
- `src/main.py` - origem dos eventos runtime e execucao do robo.
- `src/api/main.py` - endpoints consumidos pela web.
- `logs/fimathe_runtime.json` - estrutura observavel de eventos no monitor.
- `web-dashboard/src/app/monitor/page.tsx` - monitor geral.
- `web-dashboard/src/app/monitor/[symbol]/page.tsx` - terminal por ativo.
- `web-dashboard/src/app/settings/page.tsx` - ponto de configuracao da UI.

</canonical_refs>

<specifics>
## Specific Ideas

- Mensagens curtas, acionaveis e tecnicas.
- Sempre incluir simbolo, lado, ticket e regra FIM quando aplicavel.
- No monitor web, exibir "entregue" vs "suprimida por anti-spam" para auditoria.

</specifics>

<deferred>
## Deferred Ideas

- Canal Discord.
- Resumo diario por email.
- Preferencias avancadas por usuario/perfil.

</deferred>

---

*Phase: 22-notificacoes-operacionais-fimathe*
*Context gathered: 2026-04-18*
