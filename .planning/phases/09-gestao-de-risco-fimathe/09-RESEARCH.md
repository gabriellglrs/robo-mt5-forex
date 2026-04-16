# Research: Phase 09 - Gestao de Risco Fimathe

## Technical Objectives
1. **Precise Lot Sizing**: Implementation of the 3% risk cap based on `AccountBalance`.
2. **Dynamic Initial Stop**: SL placement coordinated with the Fimathe levels (Trend Channel vs. Neutral Zone).
3. **Deterministic Trailing**: Automatic SL movement to BE (at 50% expansion) and Lock Profit (at 100% expansion).

## Architecture Analysis

### Current State
- `src/execution/risk.py`: Contains `RiskManager` with basic Fimathe SL/TP logic. It uses `details.get("point_b")` for BUY SL and `details.get("point_a")` for SELL SL.
- `src/analysis/fimathe_state_engine.py`: Encapsulates setup logic but doesn't handle trailing or position monitoring yet.

### Proposed Changes

#### 1. Risk Motor Enhancement (`src/execution/risk.py`)
- **Action**: Ensure `calculate_lot` uses `AccountInfo().balance` and strict `min(risk_percentage, 3.0)`.
- **Refinement**: Improve `calculate_prices` to accept specialized `ab_levels` for precise STI (Stop Técnico Inicial).

#### 2. Trailing Engine (`src/execution/trailing.py`) **[NEW]**
- **Reasoning**: To keep `risk.py` focused on initial calculations and `trailing.py` on runtime monitoring.
- **Logic**:
  - `check_trailing(position, engine_data)`:
    - If `price` reached > 50% of projection: Move SL to `entry_price + buffer`.
    - If `price` reached > 100% of projection: Move SL to `level_50` of the projection.
    - This requires the `engine_data` to provide the specific levels for the current cycle.

#### 3. Main Integration (`src/main.py` or `src/trading/monitor.py`)
- **Action**: The monitoring loop should call the `TrailingManager` for every open position with specific `magic_number`.

## Technical Risks
1. **State Persistence**: The robot needs to know which expansion level was reached even if restarted.
   - *Mitigation*: Re-calculate current level based on historical max price since the order open time.
2. **Execution Latency**: SL updates must be fast.
   - *Mitigation*: Use `mt5.order_send` for SL modifications with strict error handling.

## Testing Strategy
- **Unit**: Verify `calculate_lot` with various balance sizes and stop distances.
- **Unit**: Verify `check_trailing` with mock position data and price levels.
- **Integration**: Replay a "50/100" cycle in the Strategy Tester.
