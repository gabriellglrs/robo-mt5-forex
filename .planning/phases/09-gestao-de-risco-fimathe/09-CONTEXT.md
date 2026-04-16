# Context: Phase 09 - Gestao de Risco Fimathe

## Domain Boundary
This phase focuses on the risk management motor (Risk Manager) to ensure deterministic stop placement, trailing behavior, and lot sizing according to the Fimathe strategy.

## Canonical Refs
- [FIMATHE-ESTRATEGIA.md](file:///c:/DEV/robo-mt5-v2/.planning/research/FIMATHE-ESTRATEGIA.md) - Official strategy guide.
- [ROADMAP.md](file:///c:/DEV/robo-mt5-v2/.planning/ROADMAP.md) - Phase 09 goals.

## Decisions (Lock-in)

### 1. Stop Técnico Inicial (STI)
- **Rules**:
  - In a breakout of the "Canal de Referência" (Trend Channel), the SL is placed at the bottom of the "Zona Neutra" (Neutral Zone).
  - If entering on a refined agrupamento (M15), the SL is placed at the bottom of that agrupamento.
- **Reference**: FIMATHE-ESTRATEGIA.md (Page 7, item 1; Page 5, item 3).

### 2. Ciclo de Movimentação de Stop (Trailing)
- **Level 50% (Break-even)**: When price hits 50% of the first projection, move SL to entry price (BE).
- **Level 100% (Locking Profit)**: When price hits 100% of the first projection (closing above it), move SL to the 50% level of that projection.
- **Continuous Trailing**: For each subsequent projection level (200%, 300%), move SL to the previous 100% or 50% level as per the "Sempre que o preço perde um topo, move-se o stop" rule.
- **Reference**: FIMATHE-ESTRATEGIA.md (Page 6, item 1; Page 7, item 4).

### 3. Gestão de Risco e Lote
- **Risk Cap**: Absolute maximum of 3% per trade.
- **Base Calculation**: `Account Balance`.
- **Lot Precision**: Must be rounded to the nearest `volume_step` provided by MT5.
- **Reference**: FIMATHE-ESTRATEGIA.md (Page 10, item 1).

## Specifics
- Integrate with `src/analysis/fimathe_state_engine.py` to get current levels and projection targets.
- Update `src/execution/risk.py` to handle the new logic.

## Deferred Items
- Multi-position risk (hedging/stacking) - To be evaluated in future phases if needed.
- Dynamic teto based on volatility (VIX/ATR) - Not part of the official manual provided.
