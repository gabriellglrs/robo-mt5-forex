from types import SimpleNamespace

import numpy as np
import pandas as pd

from src.analysis.signals import SignalDetector


def _build_df(rows: int, base: float = 100.0, step: float = 0.1) -> pd.DataFrame:
    x = np.arange(rows, dtype=float)
    close = base + (x * step)
    return pd.DataFrame(
        {
            "open": close - 0.02,
            "high": close + 0.05,
            "low": close - 0.05,
            "close": close,
            "tick_volume": np.full(rows, 100, dtype=int),
        }
    )


def _build_detector(monkeypatch, settings: dict) -> SignalDetector:
    monkeypatch.setattr("src.analysis.signals.mt5.symbol_info", lambda _symbol: SimpleNamespace(point=0.01))
    return SignalDetector("ETHUSD", settings)


def test_timeframes_and_requested_windows_are_used(monkeypatch):
    detector = _build_detector(
        monkeypatch,
        {
            "trend_timeframe": "H4",
            "entry_timeframe": "M5",
            "trend_candles": 30,
            "entry_lookback_candles": 40,
            "require_grouping": False,
            "require_channel_break": False,
            "require_pullback_retest": False,
            "require_sr_touch": False,
            "strict_reversal_logic": False,
            "require_structural_trend": False,
        },
    )
    trend_df = _build_df(120, base=100, step=0.05)
    entry_df = _build_df(120, base=100, step=0.03)
    calls = []

    def fake_load_rates(timeframe, count):
        calls.append((str(timeframe).upper(), int(count)))
        return trend_df if str(timeframe).upper() == "H4" else entry_df

    monkeypatch.setattr(detector, "_load_rates", fake_load_rates)

    captured = {}

    def fake_state_machine(technicals, settings):
        captured["technicals"] = technicals
        return {
            "signal": technicals.get("candidate_signal"),
            "reason": "setup_pronto",
            "rule_trace": {},
            "rule_id": "FIM-008",
            "rule_name": "Confluencia valida",
            "next_trigger": "Executar entrada",
        }

    monkeypatch.setattr("src.analysis.signals.evaluate_state_machine", fake_state_machine)

    details = detector.evaluate_signal_details(current_price=105.0, levels=[], current_spread=2.0)

    assert ("H4", 50) in calls  # trend_candles (30) + 20 warmup
    assert ("M5", 60) in calls  # entry_lookback (40) + 20 warmup
    assert details["trend_timeframe"] == "H4"
    assert details["entry_timeframe"] == "M5"
    assert "technicals" in captured


def test_trend_candles_tail_is_applied(monkeypatch):
    detector = _build_detector(
        monkeypatch,
        {
            "trend_timeframe": "H1",
            "entry_timeframe": "M15",
            "trend_candles": 25,
            "entry_lookback_candles": 50,
            "require_grouping": False,
            "require_channel_break": False,
            "require_pullback_retest": False,
            "require_sr_touch": False,
            "strict_reversal_logic": False,
            "require_structural_trend": False,
        },
    )
    trend_df = _build_df(100, base=200, step=0.03)
    entry_df = _build_df(100, base=200, step=0.02)

    monkeypatch.setattr(
        detector,
        "_load_rates",
        lambda timeframe, count: trend_df if str(timeframe).upper() == "H1" else entry_df,
    )

    captured = {"len": None}

    def fake_detect_trend(df):
        captured["len"] = len(df)
        return "BUY", 0.8

    monkeypatch.setattr(detector, "_detect_trend", fake_detect_trend)
    monkeypatch.setattr(
        "src.analysis.signals.evaluate_state_machine",
        lambda technicals, settings: {
            "signal": technicals.get("candidate_signal"),
            "reason": "setup_pronto",
            "rule_trace": {},
            "rule_id": "FIM-008",
            "rule_name": "Confluencia valida",
            "next_trigger": "Executar entrada",
        },
    )

    detector.evaluate_signal_details(current_price=202.0, levels=[], current_spread=2.0)
    assert captured["len"] == 25


def test_ab_lookback_has_minimum_of_7(monkeypatch):
    detector = _build_detector(monkeypatch, {"ab_lookback_candles": 3})
    df = _build_df(20, base=50.0, step=1.0)
    projection = detector._build_ab_projection(df, "BUY")

    last7 = df.tail(7)
    assert projection["point_a"] == float(last7["high"].max())
    assert projection["point_b"] == float(last7["low"].min())
