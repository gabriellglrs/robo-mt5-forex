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

- [x] **Phase 09: GestÃ£o de Risco Fimathe**
    - [x] Trava de seguranÃ§a de 3% (Balance-based).
    - [x] Auto-trailing proativo (50% BE / 100% Lock).
    - [x] Stop TÃ©cnico Inicial (STI) estrutural.

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
4. Hot-reload de ativos permite mudar o monitoramento sem reiniciar o robÃ´.

### Phase 12: Monitor de ExecuÃ§Ã£o Advanced UI/UX
**Goal**: Transformar o monitor tÃ©cnico em um dashboard premium com indicadores visuais, coloraÃ§Ã£o semÃ¢ntica e rastreio explÃ­cito das regras Fimathe.
**Depends on**: Phase 10
**Success Criteria**:
1. ColoraÃ§Ã£o semÃ¢ntica baseada na fase operacional (Monitoramento, Entrada, Risco).
2. Card de TendÃªncia com timeframe e ajuda didÃ¡tica para "pts".
3. SimulaÃ§Ã£o visual da estrutura tÃ©cnica (Price vs Levels) em tempo real.
4. SeÃ§Ã£o de Auditoria de Regras explicitando bloqueios/gatilhos (FIM-001..FIM-014).

Plans:
- [x] TBD (run /gsd-plan-phase 12 to break down)

### Phase 13: Financial Transparency & Profit Monitoring
**Goal**: Implementar monitoramento financeiro em tempo real com exibiÃ§Ã£o de saldo, equidade e lucro flutuante (PnL) por ativo no dashboard.
**Depends on**: Phase 12
**Success Criteria**:
1. InformaÃ§Ãµes da conta (Saldo, Lucro Aberto) exibidas no cabeÃ§alho do monitor.
2. Cada card de ativo exibe seu lucro/prejuÃ­zo flutuante atual com coloraÃ§Ã£o semÃ¢ntica.
3. Dados financeiros integrados ao snapshot de runtime gerado pelo robÃ´.
4. Rebuild da infraestrutura Docker para suportar as mudanÃ§as de UI.

Plans:
- [x] **Phase 14: Rigorous Strategy Hardening (Full Alignment)**
  - [x] LÃ³gica de ReversÃ£o FIM-015 (2 nÃ­veis + 10-candle triangle).
  - [x] TendÃªncia Estrutural FIM-016 (Topos/Fundos).
  - [x] MarcaÃ§Ã£o A/B por Densidade/ConsolidaÃ§Ã£o.
  - [x] SincronizaÃ§Ã£o total com Web Dashboard.

### Phase 13: Financial Transparency & Profit Monitoring
**Goal**: Implementar monitoramento financeiro em tempo real com exibiÃ§Ã£o de saldo, equidade e lucro flutuante (PnL) por ativo no dashboard.
**Depends on**: Phase 12
**Success Criteria**:
1. InformaÃ§Ãµes da conta (Saldo, Lucro Aberto) exibidas no cabeÃ§alho do monitor.
2. Cada card de ativo exibe seu lucro/prejuÃ­zo flutuante atual com coloraÃ§Ã£o semÃ¢ntica.
3. Dados financeiros integrados ao snapshot de runtime gerado pelo robÃ´.
4. Rebuild da infraestrutura Docker para suportar as mudanÃ§as de UI.

Plans:
- [x] TBD (run /gsd-plan-phase 13 to break down)

### Phase 14: Rigorous Strategy Hardening (Full Alignment)
**Goal**: Trazer o robÃ´ para 100% de conformidade com o documento FIMATHE-ESTRATEGIA.md, focando em endurecer as regras de entrada e reversÃ£o.
**Depends on**: Phase 13
**Success Criteria**:
1. Regra FIM-015: Venda em tendÃªncia de alta sÃ³ permitida apÃ³s queda de 2 nÃ­veis + triÃ¢ngulo (10 velas M1).
2. Regra FIM-016: ConfirmaÃ§Ã£o de tendÃªncia por Topos/Fundos ascendentes/descendentes.
3. Regra FIM-003: Pontos A/B detectados por clusters de preÃ§o (densidade) em vez de picos isolados.
4. UI Dashboard: Expor novas regras e o toggle de "Alvo 85%" explicitado no material.

Plans:
- [x] [implementation_plan.md](file:///C:/Users/gabri/.gemini/antigravity/brain/21b9a612-2f90-40ef-9c62-575d69adcf67/implementation_plan.md) (Completed & Validated)

### Phase 15: ExcelÃªncia UX - Tooltips Inteligentes Fimathe
**Goal**: Implementar tooltips premium (balÃµes) sobre o Ã­cone (i) com descriÃ§Ãµes ricas, propÃ³sito e impacto de ativaÃ§Ã£o/desativaÃ§Ã£o para as 16 regras.
**Depends on**: Phase 14
**Success Criteria**:
1. Tooltips premium com framer-motion disparados pelo Ã­cone (i).
2. DescriÃ§Ãµes completas (PropÃ³sito + Impacto On/Off) para todas as regras.
3. Design Glassmorphism + Neon alinhado ao tema Cockpit.
4. RemoÃ§Ã£o da animaÃ§Ã£o de hover antiga que obstruÃ­a os cards.

### Phase 16: Central de EducaÃ§Ã£o (Fimathe Academy)
**Goal**: Criar uma enciclopÃ©dia interativa (/academy) com explicaÃ§Ãµes profundas de cada regra FIM, guias de configuraÃ§Ã£o e dicas operacionais.
**Depends on**: Phase 15
**Success Criteria**:
1. Nova rota `/academy` com layout estilo Wiki/Doc especializado.
2. Artigos detalhados para todas as 16 regras (MotivaÃ§Ã£o, LÃ³gica e ConsequÃªncias).
3. SeÃ§Ã£o de "Dicas Pro" para configuraÃ§Ã£o de filtros opcionais.
4. Deep-links dos tooltips das Settings para a Academy.

### Phase 17: Dashboard de Performance e Insights (BI)
**Goal**: Transformar dados brutos de trades em inteligÃªncia de trading (Win Rate, Profit Factor, Drawdown, PnL por Ativo) em uma rota dedicada `/stats`.
**Depends on**: Phase 14
**Success Criteria**:
1. Nova rota `/stats` (ou `/performance`) com visual premium de BI.
2. GrÃ¡fico circular de Win Rate (VitÃ³rias/Derrotas).
3. GrÃ¡fico de barras de PnL agrupado por Ativo.
4. KPIs principais: Profit Factor, Payoff e Drawdown MÃ¡ximo calculados pelo Backend.

---
**Status Atual**: Milestone 2 CONCLUÃDO. Conformidade Fimathe 100% Validada (FIM-001 atÃ© FIM-016) e Performance BI Entregue. Iniciando Milestone 3.

## Milestone 3: ExpansÃ£o Operacional & Conectividade (Ativo)

### Phase 18: Perfis de OperaÃ§Ã£o e Presets (Fimathe Profiles) [DONE]
**Goal**: Implementar presets que configuram automaticamente os timeframes de acordo com o perfil e adicionar selos visuais no monitor.
**Depends on**: Phase 17
**Success Criteria**: [COMPLETED]

### Phase 19: UX Educativo - Tooltips Globais
**Goal**: Adicionar Tooltips explicativos em todas as configuraÃ§Ãµes da dashboard para facilitar o entendimento tÃ©cnico.
**Depends on**: Phase 18
**Success Criteria**:
1. Ãcone `(?)` em todos os campos de `/settings` (Analysis, Signal Logic, Risk, Connection, UI).
2. DescriÃ§Ãµes detalhadas e didÃ¡ticas baseadas na estratÃ©gia Fimathe para cada parÃ¢metro.
3. Componente de visualizaÃ§Ã£o padronizado e premium.

### Phase 20: Stop Loss EstratÃ©gico (FIM-017, FIM-018) [COMPLETED]
**Goal**: Implementar as novas regras de Stop Loss Purista (FIM-017 e FIM-018) para maior seguranÃ§a e lucratividade.
**Depends on**: Phase 19
**Success Criteria**:
1. LÃ³gica FIM-017 implementada no motor de execuÃ§Ã£o.
2. LÃ³gica FIM-018 implementada no motor de execuÃ§Ã£o.
3. ConfiguraÃ§Ãµes visuais e tooltips adicionados para as novas regras.

- [x] **Phase 21: Asset Deep Dive & Live Charting (Terminal de Batalha)**
  - [x] ConexÃ£o MT5 (`copy_rates_from_pos`) escalonÃ¡vel.
  - [x] Componente `LiveChart.tsx` integrado com alto desempenho.
  - [x] Sensibilidade dinÃ¢mica (Lookback 5+ velas).
  - [x] Hot-Reload de parÃ¢metros sem restart.
  - [x] CorreÃ§Ã£o de visibilidade em mercado lateral.

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

### Phase 22: Notificacoes Operacionais Fimathe (Tempo Real)
**Goal**: Implementar um sistema de notificacoes operacionais com baixa latencia e baixo ruido, cobrindo eventos criticos de execucao, risco e saude do robo.
**Depends on**: Phase 21, Phase 21.1
**Success Criteria**:
1. Alertas P1 para abertura/fechamento/rejeicao de ordens e erros criticos do motor.
2. Alertas de gestao de risco para BE (0x0), trailing de SL e limite de exposicao (FIM-012).
3. Mecanismo anti-spam com cooldown, deduplicacao por evento e agregacao de eventos repetidos.
4. Entrega inicial via Telegram com templates padronizados por tipo de evento.

Plans:
- [ ] [PLAN.md](file:///c:/DEV/robo-mt5-v2/.planning/phases/22-notificacoes-operacionais-fimathe/PLAN.md)

### Phase 23: Strategy Lab Backtest Multi-Config por Ativo
**Goal**: Implementar um laboratorio de backtest/replay para avaliar desempenho do robo por ativo, preset e configuracoes Fimathe em janelas de 2/7/14 dias.
**Depends on**: Phase 22
**Success Criteria**:
1. Executar simulacoes historicas por ativo com o mesmo motor de decisao do runtime, sem lookahead bias.
2. Comparar presets oficiais e variacoes criticas de configuracao com metricas consolidadas (PnL, win rate, payoff, PF, drawdown).
3. Persistir execucoes e resultados no banco para consulta historica e ranking por ativo/configuracao.
4. Disponibilizar rota/tela propria para disparo e analise de testes do laboratorio.

Plans:
- [ ] [PLAN.md](file:///c:/DEV/robo-mt5-v2/.planning/phases/23-strategy-lab-backtest-multi-config-por-ativo/PLAN.md)

### Phase 24: Account Intelligence e Gestao Inteligente da Conta
**Goal**: Criar uma rota/tela de gestao inteligente da conta para apoiar decisoes do usuario com base em desempenho por dia/semana/mes, regime de mercado por ativo e recomendacao de preset/configuracao.
**Depends on**: Phase 23
**Success Criteria**:
1. Exibir saude operacional da conta com leitura temporal (dia/semana/mes) e principais riscos ativos.
2. Ranquear ativos por oportunidade/aderencia da estrategia usando evidencias do laboratorio da Phase 23.
3. Sugerir preset/configuracao por ativo com explicacao objetiva e rastreavel.
4. Disponibilizar rota/tela propria para tomada de decisao do usuario (gestao de conta orientada a dados).

Plans:
- [ ] [PLAN.md](file:///c:/DEV/robo-mt5-v2/.planning/phases/24-account-intelligence-e-gestao-inteligente-da-conta/PLAN.md)
### Phase 25: TDD Cobertura Robot + Backend + Web
**Goal**: Estruturar uma camada pragmatica de TDD para validar configuracoes Fimathe, bloquear combinacoes conflitantes e reduzir regressao no fluxo monitor/settings/notificacoes.
**Depends on**: Phase 22
**Success Criteria**:
1. Matriz minima de combinacoes invalidas formalizada com testes automatizados.
2. Backend bloqueia configuracoes conflitantes com retorno estruturado por campo/cartao.
3. Frontend destaca visualmente os pontos de conflito e impede salvar estado invalido.
4. Acao de reset restaura configuracao oficial funcional sem efeitos colaterais.

Plans:
- [x] `.planning/phases/25-tdd-cobertura-robot-backend-web/PLAN.md`


