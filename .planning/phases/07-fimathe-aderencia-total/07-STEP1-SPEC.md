# Passo 1 - SPEC Executavel Fimathe (v1)

## 1) Entradas e parametros obrigatorios
- `trend_timeframe` (padrao H1)
- `entry_timeframe` (padrao M15 ou M1 para scalper)
- `trend_candles`
- `entry_lookback_candles`
- `sr_tolerance_points`
- `breakout_buffer_points`
- `pullback_tolerance_points`
- `risk_per_trade_percent` (maximo 3.0%)
- `max_open_positions` por ativo e global

## 2) Definicoes operacionais da estrategia
- `Ponto-A`: resistencia da regiao de consolidacao valida no timeframe maior.
- `Ponto-B`: suporte da regiao de consolidacao valida no timeframe maior.
- `Canal`: faixa entre Ponto-A e Ponto-B.
- `Projecao`: extensao do movimento no sentido da tendencia, derivada do ultimo canal valido.
- `Niveis criticos`: 50%, 80%, 85% e 100% da projecao.
- `Agrupamento`: consolidacao no timeframe menor proxima de regiao negociavel.

## 3) Regras IF/THEN (sem ambiguidade)

### FIM-001 - Selecao de contexto
IF houver dados suficientes no timeframe maior e menor  
THEN continuar analise  
ELSE bloquear entrada (`SEM_DADOS`).

### FIM-002 - Classificacao de mercado
IF tendencia maior for de alta  
THEN priorizar somente compras  
IF tendencia maior for de baixa  
THEN priorizar somente vendas  
IF mercado lateral  
THEN bloquear entrada (`MERCADO_LATERAL`).

### FIM-003 - Marcacao de regioes A/B
IF houver consolidacao valida no timeframe maior  
THEN marcar Ponto-A (resistencia) e Ponto-B (suporte)  
ELSE bloquear entrada (`SEM_REGIAO_AB`).

### FIM-004 - Projecao da estrutura
IF Ponto-A e Ponto-B definidos  
THEN calcular projecao no sentido da tendencia e niveis 50/80/85/100.

### FIM-005 - Validacao de regiao negociavel
IF preco atual estiver fora da margem de tolerancia de regiao negociavel (A/B/50/100/projecao)  
THEN bloquear entrada (`FORA_DA_REGIAO`).

### FIM-006 - Confirmacao por agrupamento no tempo menor
IF houver agrupamento no timeframe menor proximo da regiao negociavel  
THEN habilitar cenario de entrada  
ELSE manter monitoramento (`AGUARDANDO_AGRUPAMENTO`).

### FIM-007 - Rompimento e reteste
IF estrategia exigir rompimento  
THEN entrada somente apos rompimento valido com buffer  
IF estrategia exigir pullback/reteste  
THEN entrada somente apos reteste dentro da tolerancia.

### FIM-008 - Regra anti-achometro
IF nao houver confluencia minima das regras FIM-002 a FIM-007  
THEN nao abrir ordem.

### FIM-009 - Definicao do stop inicial
IF ordem for aberta  
THEN stop inicial deve ser tecnico (estrutura invalidadora) e nunca arbitrario.

### FIM-010 - Gestao de stop por ciclo
IF preco perder topo e/ou perder 50%  
THEN mover stop para proteger risco conforme estrutura atual  
IF perder 100%  
THEN mover stop novamente para faixa de protecao superior.

### FIM-011 - Limite de risco por operacao
IF risco calculado da ordem > `risk_per_trade_percent` (max 3%)  
THEN reduzir lote ou bloquear ordem.

### FIM-012 - Objetivo de saida (TP)
IF estrategia operar por projecao  
THEN preferir alvos entre 80% e 100% da expansao  
AND permitir trailing conforme regras de protecao.

### FIM-013 - Limites de exposicao
IF ativo atingir limite de posicoes  
THEN bloquear novas entradas no ativo.

### FIM-014 - Transparencia operacional
IF robo estiver rodando  
THEN painel deve mostrar por ativo:
- fase atual da Fimathe,
- motivo do bloqueio/liberacao,
- proximo gatilho,
- acao de risco em andamento.

## 4) Maquina de estados (alto nivel)
`COLETA_DADOS -> TENDENCIA -> REGIAO_AB -> PROJECAO -> AGUARDANDO_AGRUPAMENTO -> AGUARDANDO_ROMPIMENTO/RETESTE -> ENTRADA -> GESTAO_DE_RISCO -> SAIDA`

## 5) Criterios de aceite da SPEC
- Cada regra FIM-001..FIM-014 mapeada para codigo ou tarefa de implementacao.
- Sem regra ambigua ("achar", "talvez", "intuir") no motor.
- Todas as regras devem ter rastreio em log de decisao.

