# Contexto da Phase 3: Execução de Trades e Gestão de Risco [FINALIZADO]

Decisões de controle modular para o motor de execução.

## Decisões de Design

### 1. Gestão de SL/TP Modular
- **Modo Fixo**: Distância em pontos (`sl_points`, `tp_points`).
- **Modo Dinâmico**: Stop posicionado X pontos além do pavio semanal que gerou o sinal.

### 2. Gestão de Volume (Lote)
- **Modo Fixo**: Volume constante definido pelo usuário.
- **Modo Risco %**: Cálculo dinâmico baseado no Balance da conta e na distância do Stop Loss.

### 3. Controle de Concorrência
- **Filtro de Posições**: Verificação via Magic Number antes de abrir novas ordens.
- **Configuração**: `max_open_positions` (int).

### 4. Mecanismos de Proteção
- **Break-Even**: Mover stop para entrada quando o lucro atingir `be_trigger` pontos.
- **Trailing Stop**: (Opcional) Acompanhamento de lucro.

## Próximos Passos
1. Implementar `src/execution/risk.py`.
2. Implementar `src/execution/orders.py`.
3. Integrar no `main.py`.
