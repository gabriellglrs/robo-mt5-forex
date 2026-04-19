import pytest

from src.core.settings_schema import SettingsValidationError, validate_and_normalize_settings


def _base_settings():
    return {
        "analysis": {
            "symbols": ["ETHUSD"],
            "trend_candles": 120,
            "ab_lookback_candles": 40,
        },
        "signal_logic": {
            "trend_timeframe": "H1",
            "entry_timeframe": "M15",
            "sr_tolerance_points": 35,
            "max_spread_points": 30,
            "breakout_buffer_points": 10,
            "pullback_tolerance_points": 20,
            "trend_min_slope_points": 0.2,
            "require_grouping": True,
            "require_pullback_retest": False,
            "require_sr_touch": True,
            "strict_reversal_logic": True,
            "require_structural_trend": True,
            "require_channel_break": True,
            "fimathe_cycle_top_level": "80",
        },
        "risk_management": {
            "max_open_positions": 1,
            "symbol_cooldown_seconds": 300,
            "risk_percent": 1.0,
            "fimathe_management_mode": "standard",
            "fimathe_be_trigger_percent": 50,
            "fimathe_trail_step_percent": 100,
            "fimathe_cycle_enabled": True,
        },
        "notifications": {
            "enabled": True,
            "min_priority": "P2",
            "categories": {
                "execution": True,
                "risk": True,
                "health": True,
                "setup": False,
            },
            "telegram": {
                "bot_token": "",
                "chat_id": "",
                "timeout_seconds": 2.5,
                "retries": 2,
            },
        },
    }


def test_normalizes_cycle_top_level_from_target_mode():
    settings = _base_settings()
    del settings["signal_logic"]["fimathe_cycle_top_level"]
    settings["signal_logic"]["target_level_mode"] = "95"

    normalized = validate_and_normalize_settings(settings)
    assert normalized["signal_logic"]["fimathe_cycle_top_level"] == "95"
    assert normalized["signal_logic"]["target_level_mode"] == "95"


def test_rejects_invalid_cycle_top_level():
    settings = _base_settings()
    settings["signal_logic"]["fimathe_cycle_top_level"] = "42"

    with pytest.raises(SettingsValidationError) as exc:
        validate_and_normalize_settings(settings)

    assert any("fimathe_cycle_top_level" in msg for msg in exc.value.errors)


def test_rejects_invalid_management_mode():
    settings = _base_settings()
    settings["risk_management"]["fimathe_management_mode"] = "turbo"

    with pytest.raises(SettingsValidationError) as exc:
        validate_and_normalize_settings(settings)

    assert any("fimathe_management_mode" in msg for msg in exc.value.errors)


def test_rejects_invalid_max_open_positions():
    settings = _base_settings()
    settings["risk_management"]["max_open_positions"] = 0

    with pytest.raises(SettingsValidationError) as exc:
        validate_and_normalize_settings(settings)

    assert any("max_open_positions" in msg for msg in exc.value.errors)
