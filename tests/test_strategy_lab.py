import numpy as np
import pandas as pd

from src.analysis.strategy_lab import (
    OFFICIAL_PRESETS,
    build_strategy_variations,
    run_matrix_backtest,
    run_replay_backtest,
)


def _candles_fixture(rows: int = 420) -> pd.DataFrame:
    x_axis = np.arange(rows, dtype=float)
    base = 1.10 + (x_axis * 0.00005) + (np.sin(x_axis / 9.0) * 0.0008)
    open_price = base
    close_price = base + (np.sin(x_axis / 3.0) * 0.00015)
    high_price = np.maximum(open_price, close_price) + 0.00035
    low_price = np.minimum(open_price, close_price) - 0.00035
    return pd.DataFrame(
        {
            "time": (x_axis.astype(int) * 60) + 1_700_000_000,
            "open": open_price,
            "high": high_price,
            "low": low_price,
            "close": close_price,
        }
    )


def test_build_strategy_variations_includes_official_presets():
    variants = build_strategy_variations(base_config={"trend_candles": 120}, include_pairwise=False)
    ids = {item["preset_id"] for item in variants}
    assert set(OFFICIAL_PRESETS.keys()).issubset(ids)
    assert len(variants) == len(OFFICIAL_PRESETS)


def test_replay_backtest_returns_metrics_with_breakdown():
    candles = _candles_fixture()
    metrics, trades = run_replay_backtest(
        symbol="EURUSD",
        candles_df=candles,
        config={"trend_candles": 100, "ab_lookback_candles": 60, "breakout_buffer_points": 6},
        point_value=0.0001,
        spread_points=1.2,
        slippage_points=0.5,
    )
    assert "score" in metrics
    assert "score_breakdown" in metrics
    assert isinstance(metrics["score_breakdown"], dict)
    assert 0.0 <= metrics["blocked_rate"] <= 100.0
    assert isinstance(trades, list)


def test_run_matrix_backtest_is_sorted_by_score_desc():
    candles = _candles_fixture()
    results = run_matrix_backtest(
        symbol="EURUSD",
        candles_df=candles,
        base_config={"trend_candles": 120, "ab_lookback_candles": 70},
        point_value=0.0001,
        spread_points=1.0,
        slippage_points=0.4,
        include_pairwise=True,
    )
    assert len(results) >= 3
    scores = [float(item["metrics"]["score"]) for item in results]
    assert scores == sorted(scores, reverse=True)
