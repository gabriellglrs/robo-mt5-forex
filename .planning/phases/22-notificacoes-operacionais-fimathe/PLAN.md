# PLAN: Phase 22 - Notificacoes Operacionais Fimathe

Implementar pipeline de notificacoes do robo com priorizacao, anti-spam e entrega inicial via Telegram.

## Objetivo de Entrega

Ao final da fase, o sistema deve:
- Disparar alertas criticos de execucao/risco/saude em tempo real.
- Evitar ruido com deduplicacao, cooldown e agregacao.
- Expor historico de notificacoes na web para auditoria operacional.

## Wave 1 - Contrato e Motor de Notificacao

### 1.1 Definir contrato de evento de notificacao
- [ ] Criar schema unico de notificacao (campos obrigatorios e opcionais).
- [ ] Mapear eventos do runtime atual para `event_type` canonico.
- [ ] Definir taxonomia de prioridade (P1/P2/P3) e severidade.

### 1.2 Implementar policy anti-spam
- [ ] Deduplicacao por chave de evento em janela temporal.
- [ ] Cooldown por `event_type` e por simbolo.
- [ ] Agregador para eventos repetidos (ex.: trailing em sequencia).

### 1.3 Persistencia/auditoria minima
- [ ] Registrar notificacoes emitidas/suprimidas com motivo.
- [ ] Garantir estrutura consumivel pela API sem quebrar monitor atual.

## Wave 2 - Entrega de Canal (Telegram) e Integracao Runtime

### 2.1 Integrador Telegram
- [ ] Implementar provider Telegram com timeout/retry controlado.
- [ ] Tratar falhas de entrega sem interromper loop do robo.
- [ ] Incluir controle global on/off para notificacoes.

### 2.2 Integrar com eventos do robo
- [ ] Notificar ordem aberta/fechada/rejeitada.
- [ ] Notificar BE 0x0, trailing de SL e FIM-012.
- [ ] Notificar desconexao/reconexao MT5 e erro critico.

### 2.3 Templates padronizados
- [ ] Criar templates curtos por tipo de evento.
- [ ] Incluir `symbol`, `ticket`, `side`, `rule_id` e preco quando houver.

## Wave 3 - API + Web (Monitor e Settings)

### 3.1 API de notificacoes
- [ ] Expor endpoint para historico/status de notificacoes.
- [ ] Expor contadores (emitidas, suprimidas, falhas de entrega).

### 3.2 Monitor Web
- [ ] Adicionar painel de notificacoes recentes com prioridade.
- [ ] Exibir motivo de supressao (dedupe/cooldown/agregacao).

### 3.3 Settings Web (basico)
- [ ] Toggle global de notificacoes.
- [ ] Seletores minimos de categorias (execucao, risco, saude, setup).

## UAT (criterios de aceite)

- [ ] Abrir operacao gera alerta P1 com dados tecnicos minimos.
- [ ] Fechar operacao por TP/SL gera alerta P1 com resultado.
- [ ] BE 0x0 e trailing geram alertas sem spam em rajada.
- [ ] Evento repetido em janela curta e suprimido corretamente.
- [ ] MT5 desconectado gera alerta imediato; reconexao gera alerta de retorno.
- [ ] Monitor web mostra historico coerente com o runtime.

## Testes Recomendados

- [ ] Unit: normalizacao de eventos e montagem de chave de dedupe.
- [ ] Unit: regras de cooldown/agregacao.
- [ ] Integration: runtime -> policy -> provider Telegram (mock).
- [ ] Integration: API retorna historico e metricas esperadas.
- [ ] E2E web: visualizacao e filtros basicos de notificacao.

## Riscos e Mitigacoes

- Risco: spam por eventos de trailing em alta frequencia.
  Mitigacao: agregacao por ticket + janela curta + resumo consolidado.

- Risco: falha de canal externo bloquear loop principal.
  Mitigacao: envio assincrono, timeout curto e captura de excecoes.

- Risco: divergencia entre runtime e painel web.
  Mitigacao: contrato unico e endpoint de auditoria com timestamps.

## Definicao de Pronto

- [ ] Eventos obrigatorios do MVP cobertos.
- [ ] Policy anti-spam ativa e validada.
- [ ] Telegram funcionando em ambiente local/homologacao.
- [ ] Monitor e settings com controles basicos entregues.
- [ ] Testes essenciais passando.
