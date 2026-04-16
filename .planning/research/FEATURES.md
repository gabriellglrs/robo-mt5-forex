# Research Dimension: Features

## Key Feature Implementation

### 1. Weekly S/R Wicks Detection
- **Mechanism**: Fetch `MT5_TIMEFRAME_W1` candles.
- **Logic**: Identify `High` and `Low` of the wicks for the last 52 weeks.
- **Filtering**: Use a "Clustering" algorithm (like DBSCAN or simple price binning) to find levels where multiple candle wicks converge.
- **Ranking**: Select 10-30 levels closest to the current price.

### 2. Signal Confluence Logic
- **Indicator**: Bollinger Bands (20 periods, 2.0 StdDev, Applied to Price Open).
- **Entry Rules**: 
    - **SELL**: Current price >= Weekly Resistance AND Current price > Upper Bollinger Band.
    - **BUY**: Current price <= Weekly Support AND Current price < Lower Bollinger Band.
- **Confirmation**: Wait for the price to "touch" the line while being "outside" the band.

### 3. Performance Dashboard
- **7/15/30 Day Windows**: Calculate win/loss ratios by querying the local SQLite database.
- **UI Elements**: 
    - Interactive candlestick chart with S/R lines overlay.
    - Metrics cards (Profit, Total Trades, Win Rate).
    - Session start/stop button.

## Complexity
- **S/R Clustering**: Medium (Needs careful thresholding).
- **Real-time UI**: Low (Streamlit handles this efficiently).
