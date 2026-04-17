from unittest.mock import MagicMock

import pytest

from src.execution.fimathe_cycle import evaluate_fimathe_cycle_event, initialize_cycle_state
from src.execution.risk import RiskManager


@pytest.fixture
def mock_mt5(monkeypatch):
    mock = MagicMock()
    symbol_info = MagicMock()
    symbol_info.point = 0.00001
    symbol_info.trade_tick_value = 1.0
    symbol_info.trade_tick_size = 0.00001
    symbol_info.volume_min = 0.01
    symbol_info.volume_step = 0.01
    mock.symbol_info.return_value = symbol_info

    account_info = MagicMock()
    account_info.balance = 10000.0
    mock.account_info.return_value = account_info

    monkeypatch.setattr("src.execution.risk.mt5", mock)
    return mock


def test_compliance_pagina_10_risk_limit(mock_mt5):
    """Pagina 10: Garantir limite maximo de 3% de risco por operacao."""
    settings = {
        "lot_mode": "risk_percent",
        "risk_percentage": 5.0,
        "risk_max_per_trade_percent": 3.0,
    }
    rm = RiskManager("EURUSD", settings)

    sl_dist = 0.00300
    lot = rm.calculate_lot(sl_dist)
    assert lot <= 1.01


def test_compliance_pagina_6_7_stop_movement_buy(mock_mt5):
    """Pagina 6/7: Trail Stop BE em 50% e Lock em 100%."""
    config = {
        "fimathe_cycle_top_level": "80",
        "fimathe_cycle_top_retrace_points": 45,
        "fimathe_cycle_min_profit_points": 80,
    }

    context = {
        "point_a": 1.08500,
        "point_b": 1.08000,
        "projection_50": 1.08750,
        "projection_100": 1.09000,
    }

    point = 0.00001
    open_price = 1.08510
    state = initialize_cycle_state("BUY", open_price, open_price)

    res = evaluate_fimathe_cycle_event("BUY", 1.08600, open_price, context, state, config, point)
    assert res["action"] is None

    res = evaluate_fimathe_cycle_event("BUY", 1.08760, open_price, context, res["state"], config, point)
    assert res["action"]["event"] == "perdeu_50"
    assert res["action"]["candidate_sl"] < 1.08510

    res = evaluate_fimathe_cycle_event("BUY", 1.09010, open_price, context, res["state"], config, point)
    assert res["action"]["event"] == "perdeu_100"
    assert res["action"]["candidate_sl"] > 1.08700


def test_compliance_pagina_10_tp_exhaustion(mock_mt5):
    """Pagina 10: Alvo dinamico entre 80-100% da expansao."""
    details = {
        "point_a": 1.08500,
        "point_b": 1.08000,
        "projection_80": 1.08900,
        "projection_85": 1.08925,
        "projection_100": 1.09000,
    }

    rm_default = RiskManager("EURUSD", {"sl_tp_mode": "fimathe"})
    sl, tp = rm_default.calculate_prices("BUY", 1.08510, signal_details=details)
    assert tp == 1.08900

    rm_exhaustion = RiskManager("EURUSD", {"sl_tp_mode": "fimathe", "fimathe_target_level": "85"})
    sl, tp = rm_exhaustion.calculate_prices("BUY", 1.08510, signal_details=details)
    assert tp == 1.08925
