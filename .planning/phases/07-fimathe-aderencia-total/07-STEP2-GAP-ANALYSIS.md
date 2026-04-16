# Passo 2 - Gap Analysis (SPEC vs Codigo Atual)

## Escala usada
- `IMPLEMENTADO`: regra existe e funciona no fluxo principal.
- `PARCIAL`: existe parte da regra, faltando componentes importantes.
- `NAO IMPLEMENTADO`: nao existe no codigo atual.

## Matriz de aderencia

| Regra | Status | Evidencia atual | Gap principal |
|---|---|---|---|
| FIM-001 Coleta de dados | IMPLEMENTADO | `src/analysis/signals.py` valida dados de `trend_tf` e `entry_tf` | Sem issue critica |
| FIM-002 Classificacao de mercado (alta/baixa/lateral) | PARCIAL | Usa slope linear em `src/analysis/signals.py` | Falta leitura estrutural de topos/fundos da tecnica |
| FIM-003 Marcacao explicita de Ponto-A/Ponto-B | NAO IMPLEMENTADO | Nao existe modelo A/B explicito no motor | Falta detector dedicado de regioes A/B |
| FIM-004 Projecao de estrutura (50/80/85/100) | PARCIAL | Existe conceito de canal/mid (50%) no sinal | Faltam niveis 80/85/100 e projecao formal da tecnica |
| FIM-005 Validacao de regiao negociavel | PARCIAL | `near_sr` baseado em niveis de `LevelDetector` | Nao valida todas as regioes da Fimathe (A/B/projecao/50/100) |
| FIM-006 Agrupamento no tempo menor | NAO IMPLEMENTADO | Usa canal por lookback no menor timeframe | Falta detector de consolidacao/agrupamento real |
| FIM-007 Rompimento + reteste | IMPLEMENTADO | `require_channel_break` e `require_pullback_retest` em `signals.py` | Pode precisar calibracao por estrutura Fimathe |
| FIM-008 Regra anti-achometro | PARCIAL | Motor e deterministico | Falta checklist de confluencia formal por regra |
| FIM-009 Stop tecnico inicial | PARCIAL | `RiskManager` usa fixo/dinamico por nivel proximo | Falta stop baseado no invalidador estrutural A/B/agrupamento |
| FIM-010 Movimentacao de stop por perda de topo/50/100 | PARCIAL | Existe trailing/breakeven em `src/main.py` | Falta logica explicita por "perdeu topo, perdeu 50, perdeu 100" |
| FIM-011 Risco maximo 3% por operacao | NAO IMPLEMENTADO | `risk_percentage` existe, mas lote em % nao e aplicado (`RiskManager.calculate_lot`) | Falta calculo de lote por risco real |
| FIM-012 TP em 80-100 da expansao | NAO IMPLEMENTADO | TP atual fixo ou trailing generico | Falta alvo por projecao Fimathe |
| FIM-013 Limites de exposicao | IMPLEMENTADO | `max_open_positions` + `symbol_cooldown_seconds` | Opcional: adicionar limite global consolidado |
| FIM-014 Transparencia operacional por fase | PARCIAL | Cards runtime em `Auditoria e Logs` com fases | Falta detalhamento total dos gatilhos Fimathe por regra ID |

## Diagnostico consolidado
- Regras totais: 14
- Implementado: 4
- Parcial: 7
- Nao implementado: 3

## Riscos se nao fechar os gaps
1. Entradas fora da estrutura real da tecnica (A/B e agrupamentos).
2. Gestao de risco desconectada da logica original (50/100/topo).
3. Usuario com baixa rastreabilidade do motivo tecnico da decisao.

## Priorizacao tecnica para fechamento
1. `Alta prioridade`: FIM-003, FIM-004, FIM-006, FIM-010, FIM-011.
2. `Media prioridade`: FIM-009, FIM-012, FIM-014.
3. `Baixa prioridade`: refinos de UI e telemetria adicional.

