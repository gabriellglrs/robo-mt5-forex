# Roadmap do Projeto: Robo MT5 v2

Este roadmap detalha o ciclo de desenvolvimento do robô de trading automatizado.

## Milestone 1: MVP Operacional & Persistência (Concluído)

- [x] **Phase 1: Conexão e Análise de Dados Semanais**
    - [x] Integração estável com MT5.
    - [x] Detector de suporte e resistência baseado em estatística/pivôs.
- [x] **Phase 2: Lógica de Indicadores e Sinais**
    - [x] Implementação de RSI, Bollinger, Stochastic, PinBar e Volume.
    - [x] Motor de confluência multi-timeframe.
- [x] **Phase 3: Execução de Trades e Gestão de Risco**
    - [x] Cálculo de lote e SL/TP dinâmicos.
    - [x] Executor de ordens a mercado com Magic Number.
- [x] **Phase 4: Banco de Dados e Histórico**
    - [x] Docker com MySQL 8.0 e Adminer.
    - [x] Persistência de logs de sistema e snapshot de trades.
- [x] **Phase 5: Dashboard Interativo (Streamlit)**
    - [x] Curva de Equity em tempo real.
    - [x] KPIs de performance (Win Rate, PnL).
- [x] **Phase 6: Centro de Comando & Redesign Premium**
    - [x] Interface de configuração Web (sem tocar no código).
    - [x] Monitoramento de Heartbeat (Luz de Status).

---
**Status do Projeto**: 100% CONCLUÍDO | MODO OPERACIONAL ATIVO
