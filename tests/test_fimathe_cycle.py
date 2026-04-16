import os
import sys

sys.path.append(os.path.join(os.getcwd(), "src"))

from execution.fimathe_cycle import evaluate_fimathe_cycle_event


def _base_context():
    return {
        "point_a": 1.1050,
        "point_b": 1.1000,
        "projection_50": 1.1075,
        "projection_80": 1.1090,
        "projection_85": 1.1093,
        "projection_100": 1.1100,
    }


def _base_config():
    return {
        "fimathe_cycle_top_level": "80",
        "fimathe_cycle_top_retrace_points": 30,
        "fimathe_cycle_min_profit_points": 50,
        "fimathe_cycle_protection_buffer_points": 10,
        "fimathe_cycle_breakeven_offset_points": 5,
    }


def test_event_perdeu_topo_buy():
    point = 0.0001
    context = _base_context()
    config = _base_config()
    open_price = 1.1040

    state = None
    # Price runs to a new top (above projection_80), arming the event.
    for price in [1.1080, 1.1092]:
        result = evaluate_fimathe_cycle_event("BUY", price, open_price, context, state, config, point)
        state = result["state"]

    # Retrace from top triggers "perdeu_topo".
    result = evaluate_fimathe_cycle_event("BUY", 1.1058, open_price, context, state, config, point)
    assert result["action"] is not None
    assert result["action"]["event"] == "perdeu_topo"
    assert result["action"]["rule_id"] == "FIM-010"


def test_event_perdeu_50_buy():
    point = 0.0001
    context = _base_context()
    config = _base_config()
    open_price = 1.1040

    state = None
    # Reach 50% first.
    for price in [1.1080, 1.1082]:
        result = evaluate_fimathe_cycle_event("BUY", price, open_price, context, state, config, point)
        state = result["state"]

    # Cross back below 50% to trigger event.
    result = evaluate_fimathe_cycle_event("BUY", 1.1070, open_price, context, state, config, point)
    assert result["action"] is not None
    assert result["action"]["event"] == "perdeu_50"
    assert result["action"]["rule_id"] == "FIM-010"


def test_event_perdeu_100_buy():
    point = 0.0001
    context = _base_context()
    config = _base_config()
    open_price = 1.1040

    state = None
    # Reach 100% first.
    for price in [1.1085, 1.1104]:
        result = evaluate_fimathe_cycle_event("BUY", price, open_price, context, state, config, point)
        state = result["state"]

    # Cross back below 100% to trigger event.
    result = evaluate_fimathe_cycle_event("BUY", 1.1095, open_price, context, state, config, point)
    assert result["action"] is not None
    assert result["action"]["event"] == "perdeu_100"
    assert result["action"]["rule_id"] == "FIM-010"

