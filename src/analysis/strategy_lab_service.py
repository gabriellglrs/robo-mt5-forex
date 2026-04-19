from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

import MetaTrader5 as mt5
import pandas as pd

from src.analysis.strategy_lab import (
    config_hash,
    estimate_bars_for_days,
    run_matrix_backtest,
)
from src.core.database import DatabaseManager


class StrategyLabService:
    def __init__(self, db: Optional[DatabaseManager] = None):
        self.db = db or DatabaseManager()

    def _ensure_mt5(self) -> bool:
        if mt5.initialize():
            return True
        return bool(mt5.initialize())

    def _fetch_candles(self, symbol: str, timeframe: str, window_days: int) -> pd.DataFrame:
        if not self._ensure_mt5():
            raise RuntimeError("MT5 indisponivel para replay do Strategy Lab.")
        tf_map = {
            "M1": mt5.TIMEFRAME_M1,
            "M5": mt5.TIMEFRAME_M5,
            "M15": mt5.TIMEFRAME_M15,
            "M30": mt5.TIMEFRAME_M30,
            "H1": mt5.TIMEFRAME_H1,
            "H4": mt5.TIMEFRAME_H4,
            "D1": mt5.TIMEFRAME_D1,
        }
        tf_key = str(timeframe or "M15").upper()
        mt5_tf = tf_map.get(tf_key, mt5.TIMEFRAME_M15)
        bars = estimate_bars_for_days(int(window_days), tf_key)
        rates = mt5.copy_rates_from_pos(symbol.upper(), mt5_tf, 0, bars)
        if rates is None or len(rates) == 0:
            mt5.symbol_select(symbol.upper(), True)
            rates = mt5.copy_rates_from_pos(symbol.upper(), mt5_tf, 0, bars)
        if rates is None or len(rates) == 0:
            raise RuntimeError(f"Sem candles para {symbol} ({tf_key}).")
        return pd.DataFrame(rates)

    def _point_value(self, symbol: str) -> float:
        info = mt5.symbol_info(symbol.upper())
        return float(getattr(info, "point", 0.0001) or 0.0001)

    def execute_run(
        self,
        symbol: str,
        window_days: int,
        preset_id: str,
        override_config: Optional[Dict[str, Any]] = None,
        spread_model: float = 0.0,
        slippage_model: float = 0.0,
        timeframe: str = "M15",
        include_pairwise: bool = True,
    ) -> Dict[str, Any]:
        symbol_upper = str(symbol).upper()
        override = dict(override_config or {})
        run_hash = config_hash(
            {
                "symbol": symbol_upper,
                "window_days": int(window_days),
                "preset_id": str(preset_id),
                "spread_model": float(spread_model),
                "slippage_model": float(slippage_model),
                "timeframe": str(timeframe).upper(),
                "override_config": override,
            }
        )
        run_id = self.db.create_lab_run(
            symbol=symbol_upper,
            window_days=int(window_days),
            preset_id=str(preset_id),
            spread_model=float(spread_model),
            slippage_model=float(slippage_model),
            config_snapshot=override,
            config_hash=run_hash,
        )
        if not run_id:
            raise RuntimeError("Falha ao criar run no banco.")

        self.db.update_lab_run_status(run_id=run_id, status="running")
        try:
            candles = self._fetch_candles(symbol=symbol_upper, timeframe=timeframe, window_days=int(window_days))
            base_config = dict(override)
            base_config["preset_id"] = str(preset_id)
            results = run_matrix_backtest(
                symbol=symbol_upper,
                candles_df=candles[["time", "open", "high", "low", "close"]],
                base_config=base_config,
                point_value=self._point_value(symbol_upper),
                spread_points=float(spread_model),
                slippage_points=float(slippage_model),
                include_pairwise=bool(include_pairwise),
            )
            for item in results:
                metrics = dict(item["metrics"])
                score_breakdown = metrics.pop("score_breakdown", {})
                result_id = self.db.save_lab_result(
                    run_id=run_id,
                    symbol=symbol_upper,
                    window_days=int(window_days),
                    preset_id=str(item.get("preset_id")),
                    config_hash=str(item.get("config_hash")),
                    score=float(item["metrics"].get("score", 0.0)),
                    score_breakdown=score_breakdown,
                    metrics=metrics,
                )
                if not result_id:
                    continue
                for trade in item["trades"]:
                    self.db.save_lab_trade(
                        run_id=run_id,
                        result_id=result_id,
                        trade={
                            "symbol": trade.symbol,
                            "side": trade.side,
                            "entry_time": trade.entry_time,
                            "exit_time": trade.exit_time,
                            "entry_price": trade.entry_price,
                            "exit_price": trade.exit_price,
                            "sl_price": trade.sl_price,
                            "tp_price": trade.tp_price,
                            "pnl_points": trade.pnl_points,
                            "result": trade.result,
                            "config_hash": trade.config_hash,
                        },
                    )
            self.db.update_lab_run_status(run_id=run_id, status="done")
        except Exception as exc:
            self.db.update_lab_run_status(run_id=run_id, status="failed", error_message=str(exc))
            raise
        detail = self.db.get_lab_run_detail(run_id)
        detail["finished_at_runtime"] = datetime.now().isoformat(timespec="seconds")
        return detail

    def list_runs(self, limit: int = 100, symbol: Optional[str] = None, window_days: Optional[int] = None, preset_id: Optional[str] = None) -> List[Dict[str, Any]]:
        return self.db.get_lab_runs(limit=limit, symbol=symbol, window_days=window_days, preset_id=preset_id)

    def run_detail(self, run_id: int) -> Dict[str, Any]:
        return self.db.get_lab_run_detail(run_id)

    def ranking(self, symbol: Optional[str] = None, window_days: Optional[int] = None, preset_id: Optional[str] = None, limit: int = 100) -> List[Dict[str, Any]]:
        return self.db.get_lab_ranking(symbol=symbol, window_days=window_days, preset_id=preset_id, limit=limit)
