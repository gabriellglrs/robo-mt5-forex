# Plan: Phase 17 - Dashboard de Performance e Insights (BI)

## Goal
Transformar dados brutos do histórico de trades em inteligência de trading acionável através de uma interface de Business Intelligence (BI) premium.

## Proposed Changes

### Backend Logic (`src/api/stats.py`)
- Implementar endpoints para cálculo de:
    - **Win Rate**: % de vitórias e derrotas.
    - **Profit Factor**: Lucro bruto / Prejuízo bruto.
    - **Payoff Ratio**: Média de vitória / Média de derrota.
    - **Drawdown Máximo**: Maior queda do topo até a mínima da conta.
- Garantir que o cálculo de Equidade considere trades abertos.

### Frontend UI (`web-dashboard/src/app/stats/page.tsx`)
- Criar nova rota `/stats`.
- Implementar componentes de gráfico (PieChart para WinRate, BarChart para PnL por ativo).
- Adicionar cards de KPIs com design Neon/Glassmorphism.

## Success Criteria
1. Rota `/stats` acessível pelo menu lateral.
2. KPIs calculados em tempo real com base no histórico do banco de dados.
3. Visualização clara do ranking de ativos mais lucrativos.
