# Phase 02 Research: Logica de Indicadores e Sinais

Data: 2026-04-16
Status: completo

## Objetivo

Definir uma estrategia tecnica para consolidar o motor de sinais modular com:
- Suite de indicadores (Bollinger, RSI, PinBar, Stochastic, Volume)
- Confluencia entre timeframes operacionais
- Diagnostico de decisao para auditoria e dashboard

## Estado atual do codigo

Arquivos avaliados:
- `src/analysis/indicators.py`
- `src/analysis/signals.py`
- `src/main.py`
- `config/settings.json`
- `tests/verify_signals.py`

Capacidades ja presentes:
- Indicadores calculados em `IndicatorManager.get_all_indicators`.
- Decisao modular em `SignalDetector.evaluate_signal_details`.
- Integracao no loop principal em `src/main.py` com payload de fluxo de analise.
- Configuracao de filtros e minimo de confirmacoes em `config/settings.json`.

## Riscos tecnicos relevantes

1. Divergencia de contrato entre `analysis.timeframes` e `signal_logic.timeframes` quando configuracoes mudam dinamicamente.
2. Ausencia de testes automatizados de unidade para os motivos de bloqueio (`reason`) no detector de sinais.
3. Evolucao de estrategia pode quebrar o formato de payload usado pelo dashboard se o schema nao for mantido estavel.

## Recomendacoes para o plano

1. Congelar o contrato de dados de indicadores por timeframe:
   - chaves obrigatorias: `price`, `open`, `bb_upper`, `bb_lower`, `rsi`, `stoch_k`, `stoch_d`, `volume`, `avg_volume`, `pinbar`, `prev_pinbar`.
2. Padronizar motivos de decisao (`reason`) no detector:
   - `sem_dados_timeframe`
   - `direcao_divergente_entre_timeframes`
   - `nenhum_filtro_ativo`
   - `confirmacoes_insuficientes`
   - `longe_do_nivel_sr`
   - `setup_pronto`
3. Cobrir com testes:
   - caso pronto para entrada
   - caso sem confluencia
   - caso fora da zona S/R
4. Preservar compatibilidade do payload enviado para `AnalysisFlow` no banco.

## Validacao recomendada

- Teste rapido: `python tests/verify_signals.py`
- Sanidade de codigo: `python -m py_compile src/analysis/indicators.py src/analysis/signals.py src/main.py`

## Validation Architecture

Dimensoes de validacao para esta fase:
1. Correta leitura de contexto multi-timeframe.
2. Regras de votacao por filtros ativos.
3. Gate de proximidade S/R por tolerancia em pontos.
4. Persistencia do diagnostico em payload de fluxo de analise.

Estrutura de feedback:
- Quick checks a cada tarefa: `python -m py_compile ...`
- Check funcional da fase: `python tests/verify_signals.py`

