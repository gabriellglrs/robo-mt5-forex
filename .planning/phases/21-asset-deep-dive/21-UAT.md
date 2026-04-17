# UAT: Phase 21 - Asset Deep Dive & Live Charting

## Test Scenarios

### Test 1: Historical Candlestick Rendering
**Context:** The LiveChart component uses `lightweight-charts@4.1.3` to render historical OHLC data from MetaTrader 5 via the FastAPI bridge.
**Test Steps:** 
1. Open the Fimathe Web Dashboard in your browser.
2. Click the `Terminal` button inside any active Symbol Card (e.g., EURUSD).
3. Verify that the chart renders a fluid series of green/red candlesticks.
**Expected Result:** The user can view historical candlestick data on the new monitor page seamlessly, without console errors preventing UI rendering.

### Test 2: Timeframe Switching (M1 vs M15)
**Context:** Dynamic toggle for MT5 timeframe fetching.
**Test Steps:** 
1. In the `/monitor/[symbol]` page, locate the M1 / M5 / M15 / H1 buttons at the top right header.
2. Click on `M1` and then click back on `M15`.
**Expected Result:** The User can switch between M1 and M15 timeframes. The chart reloads the candles corresponding to the chosen active timeframe.

### Test 3: Fimathe Price Lines & PnL Live Update
**Context:** The chart overlays the specific runtime boundaries directly onto the visualization.
**Test Steps:** 
1. Wait for live price ticks to come in.
2. Verify that dotted dashed lines (Point A [Blue], Point B [Orange]) and solid lines (Target 50 [Green], TP [Emerald], SL [Red]) are visible at their correct price levels.
3. Verify that the last candle merges with the current Real-Time price dynamically.
**Expected Result:** The user can see Fimathe Price Lines overlaid on the chart, validating the trading robot's decision-making in real-time.

---
## Verification Check
Please run the tests and reply with the results (e.g., "Todos os testes passaram" or "O Teste 3 falhou porque as linhas não aparecem").
