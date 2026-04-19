from datetime import datetime
import sys
import types

import MetaTrader5 as mt5
import pandas as pd

# Test environment may not have mysql connector installed; stub it before importing service module.
if "mysql" not in sys.modules:
    mysql_module = types.ModuleType("mysql")
    connector_module = types.ModuleType("connector")
    connector_module.pooling = types.SimpleNamespace(MySQLConnectionPool=object)
    mysql_module.connector = connector_module
    sys.modules["mysql"] = mysql_module
    sys.modules["mysql.connector"] = connector_module

from src.analysis.strategy_lab_service import StrategyLabService


class _StubDb:
    def __init__(self, cache=None):
        self.cache = cache
        self.last_symbol = None
        self.last_tf = None

    def get_lab_local_data(self, symbol, timeframe):
        self.last_symbol = symbol
        self.last_tf = timeframe
        return self.cache


class _RunDbStub:
    def __init__(self):
        self.saved_results = []
        self.saved_trades = []
        self.created_snapshot = None
        self.status_updates = []

    def create_lab_run(self, **kwargs):
        self.created_snapshot = kwargs
        return 101

    def update_lab_run_status(self, run_id, status, error_message=None):
        self.status_updates.append((run_id, status, error_message))

    def save_lab_result(self, **kwargs):
        self.saved_results.append(kwargs)
        return len(self.saved_results)

    def save_lab_trade(self, **kwargs):
        self.saved_trades.append(kwargs)
        return True

    def get_lab_run_detail(self, run_id):
        return {"id": run_id, "results": [], "trades": []}


def test_fetch_candles_uses_mt5_timeframe_constants(monkeypatch):
    captured = {"tf": None}
    db = _StubDb(cache=None)
    service = StrategyLabService(db=db)

    def fake_copy_rates(symbol, tf, start, bars):
        captured["tf"] = tf
        return [
            {"time": 1_700_000_000, "open": 1.0, "high": 1.1, "low": 0.9, "close": 1.05, "tick_volume": 100},
            {"time": 1_700_000_060, "open": 1.05, "high": 1.12, "low": 1.0, "close": 1.1, "tick_volume": 120},
        ]

    monkeypatch.setattr(service, "_ensure_mt5", lambda: True)
    monkeypatch.setattr(mt5, "copy_rates_from_pos", fake_copy_rates)
    monkeypatch.setattr(mt5, "symbol_select", lambda symbol, visible: True)

    df = service._fetch_candles(symbol="ETHUSD", timeframe="H1", window_days=2)
    assert isinstance(df, pd.DataFrame)
    assert not df.empty
    assert captured["tf"] == mt5.TIMEFRAME_H1


def test_fetch_candles_uses_normalized_timeframe_for_cache(monkeypatch):
    cache = {
        "last_sync": datetime.now(),
        "candles": [
            {"time": 1_700_000_000, "open": 1.0, "high": 1.1, "low": 0.9, "close": 1.05, "tick_volume": 100},
            {"time": 1_700_000_060, "open": 1.05, "high": 1.12, "low": 1.0, "close": 1.1, "tick_volume": 120},
        ],
    }
    db = _StubDb(cache=cache)
    service = StrategyLabService(db=db)

    # Should not reach MT5 when cache is fresh.
    monkeypatch.setattr(mt5, "copy_rates_from_pos", lambda *args, **kwargs: (_ for _ in ()).throw(RuntimeError("mt5 should not be called")))

    df = service._fetch_candles(symbol="ethusd", timeframe="h1", window_days=2)
    assert isinstance(df, pd.DataFrame)
    assert db.last_symbol == "ETHUSD"
    assert db.last_tf == "H1"


def test_execute_run_defaults_require_sr_touch_to_false(monkeypatch):
    db = _RunDbStub()
    service = StrategyLabService(db=db)

    fake_candles = pd.DataFrame(
        [{"time": datetime.now(), "open": 1.0, "high": 1.1, "low": 0.9, "close": 1.05, "tick_volume": 100}]
    )
    captured = {"base_config": None}

    monkeypatch.setattr(service, "_fetch_candles", lambda symbol, timeframe, window_days: fake_candles)
    monkeypatch.setattr(service, "_point_value", lambda symbol: 0.0001)

    def fake_backtest(**kwargs):
        captured["base_config"] = dict(kwargs["base_config"])
        return []

    monkeypatch.setattr("src.analysis.strategy_lab_service.run_matrix_backtest", fake_backtest)

    service.execute_run(
        symbol="ETHUSD",
        window_days=7,
        preset_id="FIM-010",
        override_config={},
        timeframe="M15",
        include_pairwise=False,
    )

    assert captured["base_config"] is not None
    assert captured["base_config"]["require_sr_touch"] is False


def test_execute_run_keeps_explicit_require_sr_touch_true(monkeypatch):
    db = _RunDbStub()
    service = StrategyLabService(db=db)

    fake_candles = pd.DataFrame(
        [{"time": datetime.now(), "open": 1.0, "high": 1.1, "low": 0.9, "close": 1.05, "tick_volume": 100}]
    )
    captured = {"base_config": None}

    monkeypatch.setattr(service, "_fetch_candles", lambda symbol, timeframe, window_days: fake_candles)
    monkeypatch.setattr(service, "_point_value", lambda symbol: 0.0001)

    def fake_backtest(**kwargs):
        captured["base_config"] = dict(kwargs["base_config"])
        return []

    monkeypatch.setattr("src.analysis.strategy_lab_service.run_matrix_backtest", fake_backtest)

    service.execute_run(
        symbol="ETHUSD",
        window_days=7,
        preset_id="FIM-010",
        override_config={"require_sr_touch": True},
        timeframe="M15",
        include_pairwise=False,
    )

    assert captured["base_config"] is not None
    assert captured["base_config"]["require_sr_touch"] is True
