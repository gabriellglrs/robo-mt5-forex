# Requirements: robo-mt5-v2

## 1. Core Trading Strategy
- **W1 Structural Analysis (Weekly S/R)**:
    - [ ] The system must fetch 52 weeks of historical data for the selected symbols.
    - [ ] It must identify Support and Resistance levels based on candle wicks (pavios).
    - [ ] It must cluster nearby levels to avoid "line noise" and identify strong zones.
    - [ ] It must select 10-30 most relevant levels per symbol at any given time.
- **M5/M15 Signal Execution**:
    - [ ] Monitor real-time prices on M5 and M15 timeframes.
    - [ ] Calculate Bollinger Bands (20 periods, 2.0 Standard Deviation, Applied to Open).
    - [ ] **Entry Logic**:
        - **SELL**: Price >= Weekly Resistance AND Current High > Upper BB.
        - **BUY**: Price <= Weekly Support AND Current Low < Lower BB.
    - [ ] **Trade Management**:
        - [ ] Automated Stop Loss (S/L).
        - [ ] Automated Take Profit (T/P).
        - [ ] (Optional) Trailing Stop for profit maximization.

## 2. Interactive Dashboard (Premium UI)
- **Live Monitoring**:
    - [ ] Interactive Plotly chart showing price, BB, and active Weekly S/R lines.
    - [ ] Status indicator (Running/Stopped/Error).
- **Performance Analytics**:
    - [ ] Calculate Win Rate (Assertividade) for 7, 15, and 30-day windows.
    - [ ] Display Total Profit/Loss.
    - [ ] List recent 10-20 entries with results.
- **Control Panel**:
    - [ ] Button to START the robot.
    - [ ] Button to STOP the robot.
    - [ ] Inputs for basic configurations (Lot size, Symbols, Timeframe selection).

## 3. Technical Requirements
- **Integration**: Must use the official `MetaTrader5` Python library.
- **Data Persistence**: Use `SQLite3` to store trade history for consistent stats tracking.
- **UI Framework**: Use **Streamlit** for the dashboard implementation.
- **Resilience**: The system must detect MT5 disconnections and attempt reconnection automatically.

## 4. Documentation
- [ ] Installation guide (requirements.txt, MT5 setup).
- [ ] Usage guide.
