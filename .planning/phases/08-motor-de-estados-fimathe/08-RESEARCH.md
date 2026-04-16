# Phase 08 Research: Motor de Estados Fimathe

Data: 2026-04-16
Status: completo

## Objetivo

Definir abordagem tecnica para separar a logica de estado Fimathe em arquitetura
deterministica e testavel, sem perder compatibilidade com o runtime atual.

## Estado atual do codigo

Arquivos avaliados:
- `src/analysis/signals.py`
- `src/main.py`
- `config/settings.json`
- `.planning/phases/07-fimathe-aderencia-total/07-STEP1-SPEC.md`
- `.planning/research/FIMATHE-ESTRATEGIA.md`

Capacidades ja presentes:
- Tendencia no timeframe maior por slope e filtros de mercado lateral.
- Marcacao de Ponto-A/Ponto-B e projecoes 50/80/85/100.
- Gate de regiao negociavel e gate de agrupamento no timeframe menor.
- Rastreio por regra (`rule_id`, `rule_name`, `next_trigger`, `rule_trace`) para auditoria.

Limites atuais:
- `SignalDetector.evaluate_signal_details` concentra calculo, estado e decisao em bloco unico.
- Transicoes de estado nao estao modeladas explicitamente.
- Cobertura de testes focada em ciclo de risco (`FIM-010`), sem suite dedicada de estados de entrada (`FIM-001..FIM-008`).

## Opcoes de arquitetura

### Opcao A (recomendada): state engine dedicado + detector como adaptador
- Criar modulo `src/analysis/fimathe_state_engine.py` com funcoes puras.
- Entrada: snapshot tecnico (trend, canal, projecoes, agrupamento, proximidade SR).
- Saida: estado atual, sinal candidato, reason, rule metadata e trilha de transicao.
- `SignalDetector` passa a calcular insumos e delegar decisao ao state engine.

Vantagens:
- Testes unitarios diretos sem dependencia de MT5.
- Reduz acoplamento e facilita evolucao futura (Phase 9/10).
- Preserva contrato atual de payload no runtime.

Riscos:
- Refatoracao de `signals.py` pode quebrar campos esperados pelo dashboard se nao houver teste de regressao.

### Opcao B: manter monolito com funcoes auxiliares internas
- Menor delta de arquivos, porem mantem alto acoplamento.
- Dificulta validacao de transicoes e rastreabilidade de estados.

Conclusao: **seguir Opcao A**.

## Maquina de estados sugerida (entrada)

Estados funcionais:
1. `COLETA_DADOS`
2. `TENDENCIA`
3. `REGIAO_AB`
4. `PROJECAO`
5. `REGIAO_NEGOCIAVEL`
6. `AGRUPAMENTO`
7. `ROMPIMENTO_RETESTE`
8. `PRONTO_PARA_ENTRADA`

Transicoes bloqueadas devem sempre devolver:
- `reason` padronizado
- `rule_id` correspondente
- `next_trigger` acionavel
- `rule_trace` atualizado

## Riscos tecnicos relevantes

1. Inconsistencia BUY/SELL em transicoes de breakout/pullback.
2. Regressao de payload em `build_analysis_flow_payload` apos refatoracao.
3. Ambiguidade entre "regiao negociavel" e "SR touch" se gates forem aplicados fora de ordem.

## Recomendacoes para o plano

1. Criar state engine e fixtures de estado antes de mexer no detector.
2. Refatorar `signals.py` em duas camadas:
   - camada de aquisicao/calculo de insumos
   - camada de decisao via state engine
3. Cobrir com testes unitarios:
   - fluxos BUY e SELL
   - bloqueios por cada gate critico
   - liberacao para entrada (`setup_pronto`)
4. Validar compatibilidade do payload para runtime/dashboard.

## Validacao recomendada

- Sanidade de codigo:
  - `python -m py_compile src/analysis/fimathe_state_engine.py src/analysis/signals.py src/main.py`
- Teste de unidade (novo):
  - `pytest tests/test_fimathe_state_engine.py -q`
- Teste funcional rapido:
  - `python tests/verify_signals.py`

## Validation Architecture

Dimensoes de validacao para esta fase:
1. Determinismo das transicoes de estado para BUY e SELL.
2. Cobertura de bloqueios FIM-001..FIM-008 com `reason` e `rule_id` corretos.
3. Compatibilidade do schema de payload consumido por runtime/dashboard.
4. Coerencia de thresholds configuraveis em `config/settings.json`.

Estrutura de feedback:
- Quick checks por tarefa com `py_compile`.
- Unit tests do state engine por transicao critica.
- Smoke funcional no detector com script de verificacao.
