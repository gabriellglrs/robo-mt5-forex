# robo-mt5-v2

Automated Forex trading system for MT5 utilizing weekly Support/Resistance levels and Bollinger Bands confluences on M5/M15 timeframes.

## Context
The project aims to automate a specific price action strategy that identifies major weekly rejection levels (pavios) and waits for Bollinger Bands exhaustion in lower timeframes (M5/M15) to enter reversal trades. It includes a premium dashboard for tracking performance over 7, 15, and 30-day windows.

## Core Value
High-probability reversal entries by combining long-term structural levels with short-term statistical extremes.

## Requirements

### Validated
(None)

### Active
- [ ] **S/R Engine**: Automatically identify 10-30 Support and Resistance levels from weekly candle wicks.
- [ ] **Signal Logic**: Monitor price on M5/M15. Trigger when price hits a Weekly S/R while outside Bollinger Bands (20, 2.0, Applied to Open).
- [ ] **Execution**: Automated entry, Stop Loss, and Take Profit management.
- [ ] **Dashboard**: Real-time stats screen showing profit/loss, win rate (7/15/30 days), and total entries.
- [ ] **Control**: Start/Stop/Config UI.
- [ ] **Hybrid Stack**: Python for logic/dashboard, MQL5 for execution.

### Out of Scope
- High-frequency trading
- Manual trade intervention (for now)

## Key Decisions
| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Hybrid Approach | Python allows for superior UI and data analysis (stats), while MQL5 is best for MT5 execution. | Pending |
| Weekly S/R wicks | User strategy specifies pavios as the primary source of structural levels. | Pending |
| Bollinger "Open" | Specified in user's configuration image for faster signal response. | Pending |

## Evolution
This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-15 after initialization*
