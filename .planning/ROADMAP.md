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
**Success Criteria**:
1. Todos os parametros da tecnica expostos na UI com ajuda em PT-BR.
2. Painel de auditoria mostra regra ativa, estado atual e proximo gatilho.
3. Fluxo runtime apresenta explicacao clara para entradas, bloqueios e ajustes de risco.
4. Hot-reload de ativos permite mudar o monitoramento sem reiniciar o robô.

### Phase 12: Monitor de Execução Advanced UI/UX
**Goal**: Transformar o monitor técnico em um dashboard premium com indicadores visuais, coloração semântica e rastreio explícito das regras Fimathe.
**Depends on**: Phase 10
**Success Criteria**:
1. Coloração semântica baseada na fase operacional (Monitoramento, Entrada, Risco).
2. Card de Tendência com timeframe e ajuda didática para "pts".
3. Simulação visual da estrutura técnica (Price vs Levels) em tempo real.
4. Seção de Auditoria de Regras explicitando bloqueios/gatilhos (FIM-001..FIM-014).

Plans:
- [x] TBD (run /gsd-plan-phase 12 to break down)

### Phase 13: Financial Transparency & Profit Monitoring
**Goal**: Implementar monitoramento financeiro em tempo real com exibição de saldo, equidade e lucro flutuante (PnL) por ativo no dashboard.
**Depends on**: Phase 12
**Success Criteria**:
1. Informações da conta (Saldo, Lucro Aberto) exibidas no cabeçalho do monitor.
2. Cada card de ativo exibe seu lucro/prejuízo flutuante atual com coloração semântica.
3. Dados financeiros integrados ao snapshot de runtime gerado pelo robô.
4. Rebuild da infraestrutura Docker para suportar as mudanças de UI.

Plans:
- [x] **Phase 14: Rigorous Strategy Hardening (Full Alignment)**
  - [x] Lógica de Reversão FIM-015 (2 níveis + 10-candle triangle).
  - [x] Tendência Estrutural FIM-016 (Topos/Fundos).
  - [x] Marcação A/B por Densidade/Consolidação.
  - [x] Sincronização total com Web Dashboard.

### Phase 13: Financial Transparency & Profit Monitoring
**Goal**: Implementar monitoramento financeiro em tempo real com exibição de saldo, equidade e lucro flutuante (PnL) por ativo no dashboard.
**Depends on**: Phase 12
**Success Criteria**:
1. Informações da conta (Saldo, Lucro Aberto) exibidas no cabeçalho do monitor.
2. Cada card de ativo exibe seu lucro/prejuízo flutuante atual com coloração semântica.
3. Dados financeiros integrados ao snapshot de runtime gerado pelo robô.
4. Rebuild da infraestrutura Docker para suportar as mudanças de UI.

Plans:
- [x] TBD (run /gsd-plan-phase 13 to break down)

### Phase 14: Rigorous Strategy Hardening (Full Alignment)
**Goal**: Trazer o robô para 100% de conformidade com o documento FIMATHE-ESTRATEGIA.md, focando em endurecer as regras de entrada e reversão.
**Depends on**: Phase 13
**Success Criteria**:
1. Regra FIM-015: Venda em tendência de alta só permitida após queda de 2 níveis + triângulo (10 velas M1).
2. Regra FIM-016: Confirmação de tendência por Topos/Fundos ascendentes/descendentes.
3. Regra FIM-003: Pontos A/B detectados por clusters de preço (densidade) em vez de picos isolados.
4. UI Dashboard: Expor novas regras e o toggle de "Alvo 85%" explicitado no material.

Plans:
- [x] [implementation_plan.md](file:///C:/Users/gabri/.gemini/antigravity/brain/21b9a612-2f90-40ef-9c62-575d69adcf67/implementation_plan.md) (Completed & Validated)

### Phase 15: Excelência UX - Tooltips Inteligentes Fimathe
**Goal**: Implementar tooltips premium (balões) sobre o ícone (i) com descrições ricas, propósito e impacto de ativação/desativação para as 16 regras.
**Depends on**: Phase 14
**Success Criteria**:
1. Tooltips premium com framer-motion disparados pelo ícone (i).
2. Descrições completas (Propósito + Impacto On/Off) para todas as regras.
3. Design Glassmorphism + Neon alinhado ao tema Cockpit.
4. Remoção da animação de hover antiga que obstruía os cards.

### Phase 16: Central de Educação (Fimathe Academy)
**Goal**: Criar uma enciclopédia interativa (/academy) com explicações profundas de cada regra FIM, guias de configuração e dicas operacionais.
**Depends on**: Phase 15
**Success Criteria**:
1. Nova rota `/academy` com layout estilo Wiki/Doc especializado.
2. Artigos detalhados para todas as 16 regras (Motivação, Lógica e Consequências).
3. Seção de "Dicas Pro" para configuração de filtros opcionais.
4. Deep-links dos tooltips das Settings para a Academy.

### Phase 17: Dashboard de Performance e Insights (BI)
**Goal**: Transformar dados brutos de trades em inteligência de trading (Win Rate, Profit Factor, Drawdown, PnL por Ativo) em uma rota dedicada `/stats`.
**Depends on**: Phase 14
**Success Criteria**:
1. Nova rota `/stats` (ou `/performance`) com visual premium de BI.
2. Gráfico circular de Win Rate (Vitórias/Derrotas).
3. Gráfico de barras de PnL agrupado por Ativo.
4. KPIs principais: Profit Factor, Payoff e Drawdown Máximo calculados pelo Backend.

---
---
**Status Atual**: Milestone 2 CONCLUÍDO. Conformidade Fimathe 100% Validada (FIM-001 até FIM-016) e Performance BI Entregue. Iniciando Milestone 3.

## Milestone 3: Expansão Operacional & Conectividade (Ativo)

### Phase 18: Conexão MT5 Operacional via UI
**Goal**: Tornar a configuração de conexão com o MetaTrader 5 (Servidor, Login, Senha) totalmente funcional através da interface web, com teste de conexão em tempo real.
**Depends on**: Phase 17
**Success Criteria**:
1. Formulário de conexão em `/settings` salva dados válidos no `config.json`.
2. Botão "Testar Conexão" no Frontend retorna sucesso/erro do MT5 via Backend.
3. Robô inicia/para o terminal MT5 automaticamente baseado nas credenciais salvas.

### Phase 19: Validação de Ativos e Regras da Corretora
**Goal**: Implementar camada de pré-validação técnica antes de abrir qualquer ordem, respeitando limites da corretora.
**Depends on**: Phase 18
**Success Criteria**:
1. Verificação automática de `volume_min`, `volume_step` e `stops_level`.
2. Bloqueio de ordens se spread for maior que o limite configurado.
3. Log explícito de por que uma ordem foi rejeitada pela pré-validação.

### Phase 20: Painel de Execução e Reconciliação
**Goal**: Oferecer transparência total sobre o que acontece entre o robô e o MT5, com ferramentas de correção de divergências.
**Depends on**: Phase 19
**Success Criteria**:
1. Tela de Logs mostra o `retcode` original do MT5 para cada tentativa de ordem.
2. Ferramenta de Reconciliação detecta se posição no MT5 não bate com a tabela `trades` local.
3. Botão de "Sincronizar" para ajustar o estado do robô à realidade da conta.

## Backlog Futuro: Web Next.js (nao executar agora)

### Objetivo
Registrar melhorias futuras da camada web, sem alterar o escopo atual do robo.

### Prioridade P1 (alta)
1. Seguranca de sessao no frontend:
   - reduzir dependencia de token em `localStorage`;
   - implementar fluxo robusto de expiracao/refresh de sessao.
2. Contrato backend/frontend 100% consistente:
   - alinhar campos de configuracao (`risk_percent`/`risk_percentage`, `mt5_connection`/core);
   - garantir que tudo que a UI salva seja realmente consumido pelo robo.
3. Tratamento padrao de erros de API:
   - cliente HTTP centralizado com timeout/retry/fallback;
   - mensagens de erro padronizadas por endpoint.
4. Validacao forte dos formularios de Settings:
   - validacao de ranges e bloqueio de combinacoes invalidas antes do POST.
5. Correcao de build CSS (Tailwind):
   - remover classes dinamicas do tipo `bg-${...}`/`text-${...}`;
   - mapear classes estaticas para evitar quebra em build de producao.

### Prioridade P2 (media)
1. Finalizar acoes placeholder:
   - implementar `EXPORTAR` em Logs;
   - remover ou tornar dinamicos indicadores hoje fixos (ex.: fator de lucro estatico).
2. UX operacional:
   - trocar `alert/confirm` por modais consistentes;
   - adicionar aviso de alteracoes nao salvas.
3. Testes de frontend:
   - adicionar unit tests e E2E para login, monitor, settings e logs.

### Prioridade P3 (evolutiva)
1. Acessibilidade e responsividade fina:
   - auditoria de teclado/foco/contraste/aria;
   - ajustes mobile para telas densas.
2. Observabilidade da web:
   - telemetria de erros JS, latencia e taxa de falhas por rota.

## Backlog Futuro: Web + MT5 (implementacoes funcionais)

### Objetivo
Registrar funcionalidades pendentes para uso operacional real do robo com MetaTrader 5 via web.

### Prioridade P1 (alta)
1. Conexao MT5 realmente operacional na UI:
   - usar de fato server/login/senha/path no backend/core;
   - incluir botao "Testar conexao".
2. Validacao de ativos e regras da corretora:
   - validar simbolo, `volume_min/max/step`, `stops_level`, `freeze_level`, slippage e spread antes da execucao.
3. Painel de execucao de ordens MT5:
   - exibir request, `retcode`, comentario da corretora, retries e motivo de falha.
4. Reconciliacao MT5 x banco:
   - tela de divergencias entre posicoes/deals do MT5 e tabela `trades`, com acao de correcao.
5. Controles de risco operacionais:
   - kill switch global, limite de perda diaria, limite de perdas consecutivas e janela de operacao por ativo.

### Prioridade P2 (media)
1. Sessoes e filtros de mercado:
   - filtros por sessao (Londres/NY), bloqueio por spread extremo e opcional de noticias de alto impacto.
2. Alertas em tempo real:
   - Telegram/Discord/email para ordem rejeitada, erro critico, robo parado e drawdown elevado.
3. Historico de configuracoes:
   - versionamento de settings com autor, timestamp, diff e rollback.

### Prioridade P3 (evolutiva)
1. Seguranca de producao da web:
   - sessao robusta, perfis de usuario e CORS restrito por ambiente.
2. Exportacao e relatorios:
   - export real (CSV/JSON) de logs/trades e relatorio diario de performance/risco.
