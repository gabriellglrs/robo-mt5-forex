# PLAN: Phase 22 - Notificacoes Operacionais & Premium UI Harden

Implementar pipeline de notificacoes do robo com foco em UI/UX Premium, anti-spam e entrega inicial via Telegram, alem de refatorar o Mapa de Niveis para o formato Vertical (Fixed Price).

## Objetivo de Entrega

Ao final da fase, o sistema deve:
- Disparar alertas criticos de execucao/risco/saude em tempo real no Telegram.
- Possuir uma interface de notificacoes de alto nivel (Premium/Cockpit).
- Exibir o Mapa de Niveis em formato vertical com o preco fixo no centro.
- Garantir rastreabilidade total de eventos via Dashboard.

## Wave 1 - Contrato e Motor de Notificacao (Backend)

### 1.1 Definir contrato de evento de notificacao
- [ ] Criar schema unico de notificacao (campos obrigatorios e opcionais).
- [ ] Mapear eventos do runtime atual para `event_type` canonico.
- [ ] Definir taxonomia de prioridade (P1/P2/P3) e severidade.

### 1.2 Implementar policy anti-spam
- [ ] Deduplicacao por chave de evento em janela temporal.
- [ ] Cooldown por `event_type` e por simbolo.
- [ ] Agregador para eventos repetidos (ex.: trailing em sequencia).

### 1.3 Persistencia e API
- [ ] Registrar notificacoes emitidas/suprimidas com motivo.
- [ ] Criar endpoints `/notifications` para historico e contadores de metrica.

## Wave 2 - Entrega Telegram e Integracao Runtime

### 2.1 Integrador Telegram
- [ ] Implementar provider Telegram com timeout/retry e controle global ON/OFF.
- [ ] Tratar falhas de entrega de forma silenciosa e resiliente.

### 2.2 Integracao com Eventos do Robo
- [ ] Notificar ordem aberta/fechada/rejeitada (P1).
- [ ] Notificar BE 0x0, trailing de SL e limite de exposicao FIM-012 (P2).
- [ ] Notificar desconexao/reconexao MT5 (P1).

### 2.3 Templates Premium (Telegram)
- [ ] Criar templates curtos e tecnicos para Telegram.
- [ ] Incluir emojis semanticos e dados chave (symbol, ticket, rule_id).

## Wave 3 - Premium UI/UX Harden (Central de Alertas)

### 3.1 Redesenho da Pagina de Notificacoes
- [ ] Implementar layout "Cockpit Premium" em `/notifications`.
- [ ] Adicionar cards de notificacao com Glassmorphism, neon shadows e bordas animadas.
- [ ] Integrar `framer-motion` para transicoes e entrada escalonada dos cards.

### 3.2 Melhoria Visual do Icone e Cards
- [ ] Redesenhar o icone de notificacao (Bell) com badge dinamico de contagem.
- [ ] Adicionar micro-animacoes (pulso) quando novas notificacoes P1 chegarem.
- [ ] Separar visualmente categorias (Execucao vs Saúde) por cor e iconografia premium.

## Wave 4 - Refatoracao Mapa de Niveis (Vertical Gauge)

### 4.1 Logica de Preco Fixo Centralizado
- [ ] Refatorar `FimatheStructureGauge` para orientacao vertical.
- [ ] Implementar calculo de offset Y em relacao ao preco (Price = 0px / 50% height).
- [ ] Garantir que niveis fora do range sumam suavemente da visualizacao.

### 4.2 Visual "Altimetro de Batalha"
- [ ] Adicionar regua graduada (ticks) no eixo vertical.
- [ ] Implementar brilho neon nas linhas de alvos (Gattilho, 50%, 100%) e SL.
- [ ] Adicionar "marcador de agulha" fixo para o preco atual no centro.

## UAT (criterios de aceite)

- [ ] Notificacao VIP: Abrir/fechar ordens dispara alertas imediatos no Telegram.
- [ ] Anti-spam: Eventos repetidos em rajada (trailing) sao agregados em 1 alerta.
- [ ] Design Premium: A pagina `/notifications` segue o padrão visual do resto do site.
- [ ] Gauge Vertical: O preco fica estatico no meio enquanto as linhas se movem verticalmente.
- [ ] Responsividade: O novo gauge vertical nao quebra o layout dos cards do monitor.

## Definicao de Pronto

- [ ] Backend: Pipeline de notificacoes testado e persistido.
- [ ] Telegram: Mensagens entregues com sucesso com templates premium.
- [ ] Frontend: Dashboard redesenhado e Gauge refatorado.
- [ ] Testes: Cobertura de integracao e E2E basico funcional.
