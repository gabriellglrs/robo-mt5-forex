# PLAN: Phase 25 - TDD Cobertura Robot + Backend + Web

Construir uma esteira minima e pragmatica de TDD para evitar regressoes em configuracoes Fimathe e no fluxo operacional monitor/settings/notificacoes.

## Objetivo de Entrega

Ao final da fase, o sistema deve:
- Ter testes criticos cobrindo regras de configuracao valida/invalida.
- Bloquear persistencia de combinacoes perigosas antes de chegar ao runtime.
- Exibir feedback visual claro no frontend quando houver conflito de configuracao.
- Possuir comando claro de validacao para robot, API e web.

## Wave 1 - Contratos de Teste e Matriz de Conflitos

### 1.1 Definir matriz minima de conflitos Fimathe
- [ ] Mapear combinacoes invalidas de presets/ciclo/arraste.
- [ ] Definir mensagens de erro canonicas para API + web.
- [ ] Registrar casos-limite aceitos (nao conflitantes) para evitar falso positivo.

### 1.2 Estruturar suites base de teste
- [ ] Padronizar organizacao de testes python (robot/backend) com fixtures reutilizaveis.
- [ ] Confirmar suite frontend e estrategia de mock para settings/monitor.
- [ ] Criar comandos de execucao rapida por camada.

## Wave 2 - TDD Backend/Robot (RED -> GREEN)

### 2.1 Validacao de configuracao no backend
- [ ] RED: testes falhando para payloads conflitantes.
- [ ] GREEN: implementar validacao e retorno estruturado (422 + campos afetados).
- [ ] Regressao: garantir payload valido continua salvando normalmente.

### 2.2 Protecao no runtime/robot
- [ ] RED: teste falhando para config conflitando com regras operacionais.
- [ ] GREEN: bloquear execucao de forma segura com log/auditoria clara.
- [ ] Regressao: config oficial de fabrica opera sem bloqueio indevido.

## Wave 3 - TDD Frontend + UX de Conflito

### 3.1 Feedback visual premium de erro por card/input
- [ ] RED: teste de UI para estado de conflito e destaque do campo responsavel.
- [ ] GREEN: implementar destaque visual (card/input) e mensagem objetiva.
- [ ] Garantir compatibilidade com layout atual do settings.

### 3.2 Controle de reset para configuracao de fabrica
- [ ] RED: teste para reset total de parametros, toggles e presets.
- [ ] GREEN: implementar acao de reset e confirmacao visual.
- [ ] Regressao: reset nao deve quebrar valores obrigatorios ou defaults de seguranca.

### 3.3 Indicadores e notificacoes de validacao
- [ ] Exibir resumo de conflitos ativos no topo da tela.
- [ ] Permitir limpar avisos apos correcao de configuracao.
- [ ] Garantir consistencia entre resposta da API e UI renderizada.

## UAT (criterios de aceite)

- [ ] Usuario tenta salvar configuracao invalida e recebe bloqueio com motivo claro.
- [ ] Campo/card causador do problema fica destacado visualmente.
- [ ] Reset restaura padrao oficial funcional em um clique.
- [ ] Configuracao valida salva e robot segue operando sem bloqueio.
- [ ] Suites principais passam no ambiente local sem regressao nova.

## Testes Recomendados

- [ ] Unit (python): validador de conflito por regra.
- [ ] Integration (python): endpoint de settings retorna erros estruturados.
- [ ] Unit/Component (web): highlight visual em card/input em conflito.
- [ ] E2E web (se houver infra): fluxo salvar invalido -> corrigir -> salvar valido.

## Riscos e Mitigacoes

- Risco: alto numero de combinacoes gerar manutencao pesada de testes.
  Mitigacao: comecar por matriz minima critica e expandir por incidentes reais.

- Risco: validação duplicada divergente entre backend e frontend.
  Mitigacao: contrato unico de erro e testes de regressao de serializacao.

- Risco: lint frontend com ruido antigo mascarar regressao real.
  Mitigacao: separar baseline atual e falhas novas no diff da fase.

## Definicao de Pronto

- [ ] Matriz minima de conflitos formalizada.
- [ ] Testes TDD para backend/robot implementados e passando.
- [ ] UI de conflito e reset implementados com testes.
- [ ] Comandos de validacao documentados e executados.
- [ ] Sem regressao funcional no fluxo monitor/settings/notificacoes.
