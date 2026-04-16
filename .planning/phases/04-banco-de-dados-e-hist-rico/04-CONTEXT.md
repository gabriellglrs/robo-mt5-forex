# Contexto da Phase 4: Banco de Dados e Histórico

Decisões de persistência e auditoria operacional.

## Áreas de Decisão

### 1. Detalhamento de Sinais
- [ ] Salvar valores exatos dos indicadores no momento do sinal (RSI, Bollinger Width, etc).
- [ ] Salvar o timeframe originador (M5/M15).

### 2. Ciclo de Vida do Trade no DB
- **Abertura**: Registrado assim que `mt5.order_send` retorna sucesso.
- **Fechamento**: (Pendente) Monitoramento periódico via `mt5.history_orders_get` ou `positions_get`.

### 3. Log de Rejeições
- [ ] Registrar ordens negadas (Ex: Requote, AutoTrading Disabled, Sem Margem).

### 4. Relatórios
- [ ] Exportação CSV/Excel integrada.

## Requisitos de Implementação
- Arquivo `src/core/database.py` (Classe `DatabaseManager`).
- Integração no Loop Principal em `src/main.py`.
