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
    # Reaching 50% triggers the event immediately in the new proactive logic.
    result = evaluate_fimathe_cycle_event("BUY", 1.1076, open_price, context, state, config, point)
    assert result["action"] is not None
    assert result["action"]["event"] == "perdeu_50"
    assert result["action"]["rule_id"] == "FIM-010"
    assert result["state"]["moved_on_50"] is True


def test_event_perdeu_100_buy():
    point = 0.0001
    context = _base_context()
    config = _base_config()
    open_price = 1.1040

    state = None
    # Reach 100% (1.1100).
    result = evaluate_fimathe_cycle_event("BUY", 1.1105, open_price, context, state, config, point)
    assert result["action"] is not None
    assert result["action"]["event"] == "perdeu_100"
    assert "100%" in result["action"]["note"]
    assert result["state"]["moved_on_100"] is True


if __name__ == "__main__":
    try:
        test_event_perdeu_topo_buy()
        print("test_event_perdeu_topo_buy: OK")
        test_event_perdeu_50_buy()
        print("test_event_perdeu_50_buy: OK")
        test_event_perdeu_100_buy()
        print("test_event_perdeu_100_buy: OK")
        print("\nAll tests passed successfully!")
    except Exception as e:
        print(f"Test failed: {e}")
        sys.exit(1)

