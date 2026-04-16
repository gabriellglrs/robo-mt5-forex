# Plano de Execucao - Fase 07 (Fimathe Aderencia Total)

## Objetivo macro
Implementar o robo para aderencia pratica total ao framework Fimathe documentado, com configuracao completa via pagina e observabilidade didatica.

## Entradas obrigatorias
- [07-STEP1-SPEC.md](C:/DEV/robo-mt5-v2/.planning/phases/07-fimathe-aderencia-total/07-STEP1-SPEC.md)
- [07-STEP2-GAP-ANALYSIS.md](C:/DEV/robo-mt5-v2/.planning/phases/07-fimathe-aderencia-total/07-STEP2-GAP-ANALYSIS.md)
- [FIMATHE-ESTRATEGIA.md](C:/DEV/robo-mt5-v2/.planning/research/FIMATHE-ESTRATEGIA.md)

## Bloco 3 - Motor de decisao por estados Fimathe
### Tarefas
1. Criar modulo de estados Fimathe (`src/analysis/fimathe_state_engine.py`).
2. Implementar detector de Ponto-A/Ponto-B (consolidacao valida no timeframe maior).
3. Implementar projecao estrutural com niveis 50/80/85/100.
4. Implementar detector de agrupamento no timeframe menor.
5. Encadear estados e regras FIM-001..FIM-008.

### Aceite
- Cada decisao possui `state`, `rule_id`, `reason`.
- Nao abre ordem sem passar por todos gates.

## Bloco 4 - Gestao de risco Fimathe
### Tarefas
1. Reescrever `RiskManager.calculate_lot` para risco percentual real.
2. Implementar stop inicial tecnico com base estrutural (A/B/agrupamento).
3. Implementar movimentacao de stop por eventos da tecnica:
- perdeu topo -> mover stop;
- perdeu 50% -> mover stop;
- perdeu 100% -> mover stop novamente.
4. Implementar alvo por projecao (80%-100%) com opcao de trailing.

### Aceite
- Nunca exceder risco configurado (cap em 3% por operacao).
- Regra de stop e rastreavel no log por evento.

## Bloco 5 - Configuracoes e UX explicativa
### Tarefas
1. Expor todos parametros Fimathe na pagina Configuracoes.
2. Padronizar labels 100% PT-BR.
3. Revisar e expandir baloes (`help=`) com explicacao completa:
- o que e,
- impacto na entrada/risco,
- exemplo pratico.
4. No painel Auditoria e Logs, incluir trilha por regra (`rule_id`) e "proximo gatilho tecnico".

### Aceite
- Usuario consegue operar sem editar codigo.
- Usuario entende o motivo de cada decisao no painel.

## Sequenciamento recomendado
1. Bloco 3
2. Bloco 4
3. Bloco 5

## Estimativa pragmatica
- Bloco 3: medio/alto
- Bloco 4: alto
- Bloco 5: medio

## Risco de execucao
- Maior risco: ambiguidade na traducao de "agrupamento" para regra objetiva.
- Mitigacao: criar criterio mensuravel + testes de cenario.

