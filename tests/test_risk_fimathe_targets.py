from types import SimpleNamespace

from src.execution.risk import RiskManager


def _build_manager(monkeypatch, target_level: str):
    fake_info = SimpleNamespace(
        point=0.01,
        volume_min=0.01,
        volume_max=100.0,
        volume_step=0.01,
        trade_tick_value=1.0,
        trade_tick_size=0.01,
    )
    monkeypatch.setattr("src.execution.risk.mt5.symbol_info", lambda _symbol: fake_info)
    return RiskManager(
        "ETHUSD",
        {
            "sl_tp_mode": "fimathe",
            "fimathe_stop_buffer_points": 10,
            "fimathe_target_level": target_level,
        },
    )


def _signal_details():
    return {
        "point_a": 120.0,
        "point_b": 100.0,
        "projection_50": 130.0,
        "projection_80": 136.0,
        "projection_85": 137.0,
        "projection_90": 138.0,
        "projection_95": 139.0,
        "projection_100": 140.0,
    }


def test_fimathe_target_levels_buy(monkeypatch):
    details = _signal_details()
    expected = {"50": 130.0, "80": 136.0, "85": 137.0, "90": 138.0, "95": 139.0, "100": 140.0}

    for level, expected_tp in expected.items():
        manager = _build_manager(monkeypatch, level)
        sl, tp = manager.calculate_prices("BUY", 125.0, signal_details=details)
        assert sl == 99.9  # point_b - buffer(10 * 0.01)
        assert tp == expected_tp


def test_fimathe_target_levels_sell(monkeypatch):
    details = _signal_details()
    expected = {"50": 130.0, "80": 136.0, "85": 137.0, "90": 138.0, "95": 139.0, "100": 140.0}

    for level, expected_tp in expected.items():
        manager = _build_manager(monkeypatch, level)
        sl, tp = manager.calculate_prices("SELL", 125.0, signal_details=details)
        assert sl == 120.1  # point_a + buffer(10 * 0.01)
        assert tp == expected_tp
