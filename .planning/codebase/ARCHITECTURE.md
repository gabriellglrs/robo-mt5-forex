# Architecture

O robô utiliza uma arquitetura de **Pipeline de Decisão**.

1. **Camada de Dados**: Busca ticks (tempo real) e rates (histórico W1).
2. **Camada de Análise**:
   - `LevelDetector` (Pivôs/Fractais de 10 anos).
   - `IndicatorManager` (BB, RSI, etc.).
3. **Camada de Decisão**: `SignalDetector` (Sistema de Scoring e Quórum).
4. **Camada de Execução**: (Pendente) Envio de ordens e gestão de risco.

# Integrations

- **MetaTrader 5 API**: Conexão socket local com o terminal aberto.
- **Python-MT5 Gateway**: Conversão de objetos MqlTradeRequest em dicionários Python.
