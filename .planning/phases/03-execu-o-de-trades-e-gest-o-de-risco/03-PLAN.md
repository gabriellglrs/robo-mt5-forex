# Plano de Implementação: Phase 3 (Execução e Risco)

Este plano detalha a codificação dos módulos de execução e a integração final do robô para operações reais.

## User Review Required

> [!IMPORTANT]
> **Modo de Preenchimento (Filling Mode)**: Diferentes corretoras exigem modos diferentes (`IOC`, `FOK` ou `RETURN`). Começaremos com `ORDER_FILLING_IOC`, mas se a ordem for rejeitada, precisaremos ajustar este parâmetro no `src/execution/orders.py`.

## Proposed Changes

### 1. Motor de Risco (`src/execution/risk.py`) [NEW]
- Gerenciar cálculos de Lote baseado em % de risco.
- Calcular preços exatos de SL e TP (Fixo vs Dinâmico).
- Validar se a margem é suficiente.

### 2. Executor de Ordens (`src/execution/orders.py`) [NEW]
- Função central `send_order(signal, price, sl, tp, volume, comment, magic)`.
- Gerenciamento de Retcode (sucesso/falha) e logs detalhados.
- Função `count_open_positions()` para respeitar o limite de ordens simultâneas.

### 3. Integração (`src/main.py`) [MODIFY]
- Conectar a saída do `SignalDetector` ao `OrderEngine`.
- Implementar o filtro de Magic Number para evitar múltiplas entradas no mesmo sinal.

### 4. Configurações (`config/settings.json`) [MODIFY]
- Adicionar a seção `risk_management` com todos os interruptores modulares decididos no CONTEXT.md.

## Verificação do Plano

### Automated Tests
- Criar `tests/verify_orders.py` para testar o envio de uma ordem de volume mínimo (0.01) na conta demo.

### Manual Verification
- Acompanhar a primeira entrada real do robô no terminal MT5 para validar SL e TP visuais.
