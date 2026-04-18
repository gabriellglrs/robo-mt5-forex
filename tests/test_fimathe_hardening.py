import pytest
import pandas as pd
import numpy as np
from unittest.mock import MagicMock, patch
from src.analysis.signals import SignalDetector
from src.analysis.levels import LevelDetector
from src.execution.risk import RiskManager

@pytest.fixture
def mock_symbol_info():
    info = MagicMock()
    info.point = 0.00001
    info.digits = 5
    info.trade_tick_value = 1.0
    info.trade_tick_size = 0.00001
    info.volume_min = 0.01
    info.volume_max = 100.0
    info.volume_step = 0.01
    return info

@pytest.fixture
def signal_detector():
    settings = {
        "trend_timeframe": "H1",
        "entry_timeframe": "M15",
        "trend_min_slope_points": 0.2,
        "strict_reversal_logic": False,
        "require_structural_trend": False,
        "triangle_m1_candles": 10,
        "breakout_buffer_points": 0,
        "require_channel_break": False,
        "require_pullback_retest": False,
        "require_sr_touch": False,
        "require_grouping": False,
        "sr_tolerance_points": 100,
        "max_spread_points": 100,
        "target_level_mode": "80"
    }
    with patch("MetaTrader5.symbol_info") as mock_info:
        mock_info.return_value.point = 0.00001
        sd = SignalDetector("EURUSD", settings)
        sd.point = 0.00001
        return sd

def test_fim_001_data_fail(signal_detector):
    signal_detector._load_rates = MagicMock(return_value=None)
    res = signal_detector.evaluate_signal_details(1.1000, [])
    assert res["reason"] == "sem_dados_timeframe"

def test_fim_002_lateral_market(signal_detector):
    h1_data = pd.DataFrame({"close": [1.1000]*100, "high": [1.1000]*100, "low": [1.1000]*100, "open": [1.1000]*100})
    signal_detector._load_rates = MagicMock(return_value=h1_data)
    signal_detector._detect_trend = MagicMock(return_value=(None, 0.05))
    res = signal_detector.evaluate_signal_details(1.1000, [])
    assert res["reason"] == "mercado_lateral"

def test_fim_003_ab_ok(signal_detector):
    h1_data = pd.DataFrame({"close": [1.1000]*100, "high": [1.1010]*100, "low": [1.1000]*100, "open": [1.1005]*100})
    signal_detector._load_rates = MagicMock(return_value=h1_data)
    signal_detector._detect_trend = MagicMock(return_value=("BUY", 0.5))
    res = signal_detector.evaluate_signal_details(1.1015, [])
    assert res["rule_trace"]["FIM-003"] == "ok"

def test_fim_012_risk_limit(mock_symbol_info):
    rm = RiskManager("EURUSD", {"lot_mode": "risk_percent", "risk_percentage": 3.0})
    rm.symbol_info = mock_symbol_info
    mock_acc = MagicMock()
    mock_acc.balance = 10000.0
    with patch("MetaTrader5.account_info", return_value=mock_acc):
        lot = rm.calculate_lot(0.0100)
        assert lot == pytest.approx(0.3)

def test_fim_013_target_management(signal_detector, mock_symbol_info):
    h1_data = pd.DataFrame({"close": [1.1000]*100, "high": [1.1010]*100, "low": [1.1000]*100, "open": [1.1005]*100})
    signal_detector._load_rates = MagicMock(return_value=h1_data)
    signal_detector._detect_trend = MagicMock(return_value=("BUY", 0.5))
    details = signal_detector.evaluate_signal_details(1.1010, [])
    
    rm = RiskManager("EURUSD", {"sl_tp_mode": "fimathe", "fimathe_target_level": "80"})
    rm.symbol_info = mock_symbol_info
    sl, tp = rm.calculate_prices("BUY", 1.1010, signal_details=details)
    assert tp == pytest.approx(1.1018)
    
    rm.settings["fimathe_target_level"] = "100"
    sl, tp = rm.calculate_prices("BUY", 1.1010, signal_details=details)
    assert tp == pytest.approx(1.1020)

def test_fim_014_audit_compliance(signal_detector):
    h1_data = pd.DataFrame({"close": [1.1000]*100, "high": [1.1010]*100, "low": [1.1000]*100, "open": [1.1005]*100})
    signal_detector._load_rates = MagicMock(return_value=h1_data)
    signal_detector._detect_trend = MagicMock(return_value=("BUY", 0.5))
    res = signal_detector.evaluate_signal_details(1.1010, [])
    assert "rule_trace" in res
    assert "FIM-001" in res["rule_trace"]

def test_fim_015_reversal_blocked(signal_detector):
    h1_data = pd.DataFrame({"close": [1.1000]*100, "high": [1.1000]*100, "low": [1.1000]*100, "open": [1.1000]*100})
    m1_data = pd.DataFrame({"high": [1.1010]*10, "low": [1.1000]*10, "close": [1.1005]*10, "open": [1.1005]*10})
    signal_detector.settings["strict_reversal_logic"] = True
    signal_detector._load_rates = MagicMock(side_effect=lambda tf, count: h1_data if tf=="H1" else m1_data)
    signal_detector._detect_trend = MagicMock(return_value=("BUY", 0.5))
    signal_detector._build_ab_projection = MagicMock(return_value={
        "point_a": 1.1010, "point_b": 1.1000, "channel_size": 0.0010,
        "projection_50": 1.0995, "projection_80": 1.0992, "projection_85": 1.09915,
        "projection_90": 1.0991, "projection_95": 1.09905, "projection_100": 1.0990
    })
    res = signal_detector.evaluate_signal_details(1.0995, [])
    assert res["rule_trace"]["FIM-015"] == "bloqueado"

def test_fim_016_structural_fail(signal_detector):
    h1_data = pd.DataFrame({"close": [1.1000]*100, "high": [1.1000]*100, "low": [1.1000]*100, "open": [1.1000]*100})
    signal_detector.settings["require_structural_trend"] = True
    signal_detector._load_rates = MagicMock(return_value=h1_data)
    signal_detector._detect_trend = MagicMock(return_value=("BUY", 0.5))
    signal_detector._check_structural_trend = MagicMock(return_value=False)
    res = signal_detector.evaluate_signal_details(1.1015, [])
    assert res["rule_trace"]["FIM-016"] == "bloqueado"

def test_ab_projection_freezes_while_waiting_breakout(signal_detector):
    signal_detector.settings["require_channel_break"] = True
    signal_detector.settings["breakout_buffer_points"] = 10
    signal_detector.settings["require_pullback_retest"] = False
    signal_detector.settings["require_sr_touch"] = False
    signal_detector.settings["require_grouping"] = False
    signal_detector.settings["sr_tolerance_points"] = 500

    trend_df_initial = pd.DataFrame({
        "close": np.linspace(1.1000, 1.1010, 100),
        "high": [1.1010] * 100,
        "low": [1.1000] * 100,
        "open": [1.1005] * 100,
    })
    trend_df_drift = pd.DataFrame({
        "close": np.linspace(1.1000, 1.1010, 100),
        "high": [1.1010] * 100,
        "low": [1.1000] * 99 + [1.0950],
        "open": [1.1005] * 100,
    })
    entry_df = pd.DataFrame({
        "high": [1.1010] * 100,
        "low": [1.1000] * 100,
        "close": [1.1006] * 100,
        "open": [1.1004] * 100,
    })

    call = {"n": 0}

    def mock_load_rates(timeframe, count):
        stage = min(call["n"] // 2, 1)
        call["n"] += 1
        if timeframe == "H1":
            return [trend_df_initial, trend_df_drift][stage]
        return entry_df

    signal_detector._load_rates = MagicMock(side_effect=mock_load_rates)
    signal_detector._detect_trend = MagicMock(return_value=("BUY", 0.5))

    first = signal_detector.evaluate_signal_details(1.1005, [])
    second = signal_detector.evaluate_signal_details(1.1005, [])

    assert first["reason"] == "aguardando_rompimento_canal"
    assert second["reason"] == "aguardando_rompimento_canal"
    assert first["point_b"] == pytest.approx(1.1000)
    assert second["point_b"] == pytest.approx(first["point_b"])

def test_ab_projection_unfreezes_after_setup_ready(signal_detector):
    signal_detector.settings["require_channel_break"] = True
    signal_detector.settings["breakout_buffer_points"] = 10
    signal_detector.settings["require_pullback_retest"] = False
    signal_detector.settings["require_sr_touch"] = False
    signal_detector.settings["require_grouping"] = False
    signal_detector.settings["sr_tolerance_points"] = 500

    trend_df_initial = pd.DataFrame({
        "close": np.linspace(1.1000, 1.1010, 100),
        "high": [1.1010] * 100,
        "low": [1.1000] * 100,
        "open": [1.1005] * 100,
    })
    trend_df_drift = pd.DataFrame({
        "close": np.linspace(1.1000, 1.1010, 100),
        "high": [1.1010] * 100,
        "low": [1.1000] * 99 + [1.0950],
        "open": [1.1005] * 100,
    })
    entry_df = pd.DataFrame({
        "high": [1.1010] * 100,
        "low": [1.1000] * 100,
        "close": [1.1006] * 100,
        "open": [1.1004] * 100,
    })

    call = {"n": 0}

    def mock_load_rates(timeframe, count):
        stage = min(call["n"] // 2, 2)
        call["n"] += 1
        if timeframe == "H1":
            return [trend_df_initial, trend_df_drift, trend_df_drift][stage]
        return entry_df

    signal_detector._load_rates = MagicMock(side_effect=mock_load_rates)
    signal_detector._detect_trend = MagicMock(return_value=("BUY", 0.5))

    waiting = signal_detector.evaluate_signal_details(1.1005, [])
    setup_ready = signal_detector.evaluate_signal_details(1.1007, [])
    post_reset = signal_detector.evaluate_signal_details(1.1005, [])

    assert waiting["reason"] == "aguardando_rompimento_canal"
    assert setup_ready["reason"] == "setup_pronto"
    assert post_reset["reason"] == "aguardando_rompimento_canal"
    assert post_reset["point_b"] == pytest.approx(1.0950)
