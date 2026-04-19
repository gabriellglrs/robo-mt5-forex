import pytest
import pandas as pd
import numpy as np
from unittest.mock import MagicMock, patch
from src.analysis.signals import SignalDetector

@pytest.fixture
def mock_settings():
    return {
        "ab_lookback_candles": 7,
        "trend_candles": 20,
        "freeze_ab_during_breakout_wait": True,
        "require_grouping": True,
        "require_channel_break": True,
        "require_pullback_retest": False,
        "trend_min_slope_points": 0.2
    }

@pytest.fixture
def mock_signal_detector(mock_settings):
    with patch('MetaTrader5.symbol_info') as mock_info:
        mock_info.return_value.point = 0.00001
        detector = SignalDetector("EURUSD", mock_settings)
        return detector

def generate_mock_df(base_price, count, trend="UP"):
    data = {
        "tick_volume": np.random.randint(100, 1000, size=count),
        "open": base_price + np.arange(count) * (0.0001 if trend == "UP" else -0.0001),
        "high": base_price + np.arange(count) * (0.0001 if trend == "UP" else -0.0001) + 0.00005,
        "low": base_price + np.arange(count) * (0.0001 if trend == "UP" else -0.0001) - 0.00005,
        "close": base_price + np.arange(count) * (0.0001 if trend == "UP" else -0.0001),
    }
    return pd.DataFrame(data)

def test_box_locking_persistence(mock_signal_detector):
    # Setup inicial: Tudo OK, esperando rompimento
    # Mock de taxas de cambio
    df_trend = generate_mock_df(1.08000, 40, trend="UP")
    df_entry = generate_mock_df(1.08000, 40, trend="UP")
    
    with patch.object(SignalDetector, '_load_rates') as mock_load:
        mock_load.side_effect = [df_trend, df_entry]
        
        # Primeira execucao: deve detectar tendencia e pontos AB
        details1 = mock_signal_detector.evaluate_signal_details(1.08350, [1.08000, 1.08100])
        print(f"DEBUG: reason={details1['reason']}, box_locked={details1['box_locked']}")
        assert details1["box_locked"] is True
        pointA1 = details1["point_a"]
        pointB1 = details1["point_b"]
        
        # Segunda execucao: Preco andou, mas deve manter os mesmos pontos AB
        # Simulamos que o df_trend andou (novas maximas), mas o rob deve estar travado
        df_trend_moved = generate_mock_df(1.08100, 40, trend="UP") # Preco subiu
        mock_load.side_effect = [df_trend_moved, df_entry]
        
        details2 = mock_signal_detector.evaluate_signal_details(1.08360, [1.08000, 1.08100])
        assert details2["box_locked"] is True
        assert details2["point_a"] == pointA1
        assert details2["point_b"] == pointB1
        
        # Terceira execucao: Invalida TREND (vira lateral) -> deve destravar
        df_trend_side = generate_mock_df(1.08100, 40, trend="SIDE")
        # Mocking _detect_trend to return None (Lateral)
        with patch.object(SignalDetector, '_detect_trend', return_value=(None, 0.05)):
            mock_load.side_effect = [df_trend_side, df_entry]
            details3 = mock_signal_detector.evaluate_signal_details(1.08360, [1.08000, 1.08100])
            assert details3["box_locked"] is False
            assert "mercado_lateral" in details3["reason"]

def test_minimum_lookback_enforcement(mock_signal_detector):
    # Forcar settings com lookback 3 (menor que o novo min de 7)
    mock_signal_detector.settings["ab_lookback_candles"] = 3
    df_trend = generate_mock_df(1.08000, 40, trend="UP")

    # Ele deve usar 7 mesmo que o setting diga 3.
    proj = mock_signal_detector._build_ab_projection(df_trend, "BUY")
    last7 = df_trend.tail(7)
    assert proj["point_a"] == float(last7["high"].max())
    assert proj["point_b"] == float(last7["low"].min())
