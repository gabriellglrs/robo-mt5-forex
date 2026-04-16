# Research Dimension: Pitfalls

## Critical Mistakes to Avoid

### 1. MT5 Terminal Latency
- **Risk**: The Python API can be slower than pure MQL5.
- **Solution**: Use `mt5.copy_rates_from` optimized calls and avoid heavy processing inside the tick loop.

### 2. Timezone Mismatches
- **Risk**: Weekly wicks vs. M5 entries might fail if Broker time vs. Local time is not aligned.
- **Solution**: Normalize all timestamps to UTC or specifically use the Broker's Time Server as the source of truth.

### 3. Historical Data Gaps
- **Risk**: Weekly data might be missing for older periods or certain symbols.
- **Solution**: Implement a "Data Warmup" sequence that checks for minimum 52 weeks of W1 data before starting execution.

### 4. Concurrency Management
- **Risk**: Streamlit and the Engine might try to write/read to SQLite simultaneously.
- **Solution**: Use SQLite WAL (Write-Ahead Logging) mode or simple file-locking to ensure data integrity.

### 5. Multi-Symbol Handling
- **Risk**: Calculating 10-30 peak levels for many symbols can scale poorly.
- **Solution**: Compute the levels once per hour/day and cache them; do not recalculate on every tick.
