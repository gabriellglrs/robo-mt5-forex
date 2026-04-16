# Research Dimension: Stack

## Recommended 2025 Stack
For a premium trading system with a high-end dashboard:

- **Core**: Python 3.11+
- **MT5 Integration**: `MetaTrader5` (Official Library)
- **Data Engineering**: `Pandas` & `NumPy`
- **Technical Analysis**: `pandas-ta` (Robust and fast)
- **Dashboard/UI**: `Streamlit` with `Plotly` (Modern, dark-mode, financial-grade charts)
- **Database (Local Stats)**: `SQLite` (Fast, serverless, perfect for 7/15/30 day performance tracking)
- **Process Management**: `Watchdog` or simple loop with `asyncio`

## Rationale
- **Python-MT5**: Allows leveraging Python's superior data science ecosystem while maintaining direct execution on MT5.
- **Streamlit**: Provides a "SaaS" look and feel for the dashboard compared to the dated MT5 UI.
- **SQLite**: Essential for the required long-term performance tracking without requiring a full database server.

## Confidence Levels
- **MT5 Integration**: High (Industry standard)
- **Streamlit Performance**: High (Excellent for this scale)
- **S/R Consistency**: Medium (Requires fine-tuning of the " Wick" detection logic)
