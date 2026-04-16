# Phase 1 Research: Conexão e Análise de Níveis

## Technical Approach

### 1. Connection Lifecycle
- **Library**: `MetaTrader5`
- **Method**: `mt5.initialize()` is called once at startup.
- **Stability**: Implement a heartbeat check using `mt5.terminal_info()` to ensure the connection is alive before every data fetch.

### 2. S/R Extraction (The "Wick Logic")
- **Data Source**: `mt5.copy_rates_from_pos(symbol, mt5.TIMEFRAME_W1, 0, 520)`
- **Calculation**:
    - `Upper Wick = High - max(Open, Close)`
    - `Lower Wick = min(Open, Close) - Low`
- **Filtering**: Consider wicks significant only if they occupy a certain percentage of the total candle range (e.g., > 30%).

### 3. Clustering Algorithm (Dynamic Levels)
- **Algorithm**: `KMeans` (from `scikit-learn`).
- **Input**: A flattened array of all `High` and `Low` prices from the significant wicks.
- **Parameters**: `n_clusters` defaulted to 20, but dynamically adjusted based on price range.
- **Validation**: Filter out clusters with very few points to ensure only "tested" levels are kept.

### 4. Code Patterns
- Use `pandas` for all vectorised math.
- Use `scipy.signal.find_peaks` as an alternative/validator for clustering to ensure we are catching local price extrema.

## Recommended Libraries
- `MetaTrader5`
- `pandas`
- `scikit-learn`
- `numpy`
- `matplotlib` (for initial visual verification)
