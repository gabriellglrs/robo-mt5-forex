import hashlib
import json
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd


OFFICIAL_PRESETS: Dict[str, Dict[str, Any]] = {
    "FIM-010": {
        "name": "Padrao (BE 50%)",
        "breakout_buffer_points": 10,
        "pullback_tolerance_points": 20,
        "risk_percent": 1.0,
        "require_grouping": True,
        "require_channel_break": True,
        "require_structural_trend": True,
    },
    "FIM-017": {
        "name": "Conservador (BE fixo)",
        "breakout_buffer_points": 14,
        "pullback_tolerance_points": 24,
        "risk_percent": 0.8,
        "require_grouping": True,
        "require_channel_break": True,
        "require_structural_trend": True,
    },
    "FIM-018": {
        "name": "Infinity (Arraste)",
        "breakout_buffer_points": 12,
        "pullback_tolerance_points": 18,
        "risk_percent": 1.2,
        "require_grouping": False,
        "require_channel_break": True,
        "require_structural_trend": True,
    },
}


TIMEFRAME_TO_MINUTES: Dict[str, int] = {
    "M1": 1,
    "M5": 5,
    "M15": 15,
    "M30": 30,
    "H1": 60,
    "H4": 240,
    "D1": 1440,
}


@dataclass
class LabTrade:
    symbol: str
    side: str
    entry_time: datetime
    exit_time: datetime
    entry_price: float
    exit_price: float
    sl_price: float
    tp_price: float
    pnl_points: float
    result: str
    config_hash: str


def _safe_float(value: Any, fallback: float) -> float:
    try:
        return float(value)
    except Exception:
        return float(fallback)


def normalize_timeframe(value: Any) -> str:
    tf = str(value or "M15").upper()
    return tf if tf in TIMEFRAME_TO_MINUTES else "M15"


def estimate_bars_for_days(days: int, timeframe: str) -> int:
    tf = normalize_timeframe(timeframe)
    minutes = TIMEFRAME_TO_MINUTES[tf]
    bars = int((days * 1440) / minutes)
    return max(120, min(10000, bars))


def config_hash(config: Dict[str, Any]) -> str:
    stable_json = json.dumps(config, sort_keys=True, ensure_ascii=True)
    return hashlib.sha256(stable_json.encode("utf-8")).hexdigest()[:16]


def build_strategy_variations(base_config: Dict[str, Any], include_pairwise: bool = True) -> List[Dict[str, Any]]:
    variants: List[Dict[str, Any]] = []
    for preset_id, preset_data in OFFICIAL_PRESETS.items():
        merged = dict(base_config)
        merged.update(preset_data)
        merged["preset_id"] = preset_id
        variants.append(merged)

    if not include_pairwise:
        return variants

    pairwise_knobs: List[Tuple[str, List[Any]]] = [
        ("breakout_buffer_points", [8, 12, 18]),
        ("pullback_tolerance_points", [14, 20, 28]),
        ("risk_percent", [0.8, 1.0, 1.3]),
        ("require_grouping", [True, False]),
        ("require_structural_trend", [True, False]),
    ]

    for idx, variant in enumerate(list(variants)):
        if idx >= 3:
            break
        for key, values in pairwise_knobs:
            for value in values[:2]:
                cloned = dict(variant)
                cloned[key] = value
                cloned["preset_id"] = f"{variant.get('preset_id', 'CUSTOM')}-PW-{key}-{str(value).replace('.', '_')}"
                variants.append(cloned)

    deduped: Dict[str, Dict[str, Any]] = {}
    for variant in variants:
        variant_hash = config_hash(variant)
        if variant_hash not in deduped:
            deduped[variant_hash] = variant
    return list(deduped.values())


def _calc_slope_points(series: pd.Series, point_value: float) -> float:
    closes = series.astype(float).values
    x_axis = np.arange(len(closes), dtype=float)
    slope_price = np.polyfit(x_axis, closes, 1)[0]
    return slope_price / max(point_value, 1e-9)


def _score_from_metrics(metrics: Dict[str, float]) -> float:
    pnl_component = max(min(metrics.get("total_pnl_points", 0.0) / 250.0, 1.0), -1.0)
    win_component = max(min((metrics.get("win_rate", 0.0) - 50.0) / 50.0, 1.0), -1.0)
    dd_component = max(min((50.0 - metrics.get("max_drawdown_points", 0.0)) / 50.0, 1.0), -1.0)
    pf_component = max(min((metrics.get("profit_factor", 0.0) - 1.0) / 1.5, 1.0), -1.0)
    score = (0.35 * pnl_component) + (0.25 * win_component) + (0.20 * pf_component) + (0.20 * dd_component)
    return round(score * 100.0, 2)


def score_breakdown(metrics: Dict[str, float]) -> Dict[str, float]:
    pnl_component = max(min(metrics.get("total_pnl_points", 0.0) / 250.0, 1.0), -1.0)
    win_component = max(min((metrics.get("win_rate", 0.0) - 50.0) / 50.0, 1.0), -1.0)
    dd_component = max(min((50.0 - metrics.get("max_drawdown_points", 0.0)) / 50.0, 1.0), -1.0)
    pf_component = max(min((metrics.get("profit_factor", 0.0) - 1.0) / 1.5, 1.0), -1.0)
    weighted = {
        "pnl": round(0.35 * pnl_component * 100.0, 2),
        "win_rate": round(0.25 * win_component * 100.0, 2),
        "profit_factor": round(0.20 * pf_component * 100.0, 2),
        "drawdown": round(0.20 * dd_component * 100.0, 2),
    }
    weighted["total"] = round(sum(weighted.values()), 2)
    return weighted


def run_replay_backtest(
    symbol: str,
    candles_df: pd.DataFrame,
    config: Dict[str, Any],
    point_value: float,
    spread_points: float,
    slippage_points: float,
) -> Tuple[Dict[str, float], List[LabTrade]]:
    candles = candles_df.copy()
    candles["time"] = pd.to_datetime(candles["time"], unit="s")
    lookback = int(config.get("ab_lookback_candles", 80))
    trend_candles = int(config.get("trend_candles", 120))
    breakout_points = _safe_float(config.get("breakout_buffer_points"), 10.0)
    slope_min = _safe_float(config.get("trend_min_slope_points"), 0.2)
    rr_ratio = _safe_float(config.get("rr_ratio"), 1.0)

    open_trade: Optional[Dict[str, Any]] = None
    trades: List[LabTrade] = []
    pnl_points: List[float] = []
    equity_curve: List[float] = []
    running_equity = 0.0
    cfg_hash = config_hash(config)

    for idx in range(max(lookback, trend_candles), len(candles)):
        frame = candles.iloc[: idx + 1]
        row = frame.iloc[-1]
        close_price = float(row["close"])
        high_price = float(row["high"])
        low_price = float(row["low"])
        now_time: datetime = row["time"].to_pydatetime()

        if open_trade is not None:
            side = open_trade["side"]
            sl_price = open_trade["sl_price"]
            tp_price = open_trade["tp_price"]
            exit_price = None
            result = None
            if side == "BUY":
                if low_price <= sl_price:
                    exit_price = sl_price
                    result = "LOSS"
                elif high_price >= tp_price:
                    exit_price = tp_price
                    result = "WIN"
            else:
                if high_price >= sl_price:
                    exit_price = sl_price
                    result = "LOSS"
                elif low_price <= tp_price:
                    exit_price = tp_price
                    result = "WIN"

            if exit_price is not None:
                raw_points = (exit_price - open_trade["entry_price"]) / max(point_value, 1e-9)
                if side == "SELL":
                    raw_points = -raw_points
                cost_points = spread_points + slippage_points
                net_points = raw_points - cost_points
                running_equity += net_points
                equity_curve.append(running_equity)
                pnl_points.append(net_points)
                trades.append(
                    LabTrade(
                        symbol=symbol,
                        side=side,
                        entry_time=open_trade["entry_time"],
                        exit_time=now_time,
                        entry_price=open_trade["entry_price"],
                        exit_price=exit_price,
                        sl_price=sl_price,
                        tp_price=tp_price,
                        pnl_points=net_points,
                        result=result,
                        config_hash=cfg_hash,
                    )
                )
                open_trade = None
            continue

        trend_slice = frame["close"].tail(trend_candles)
        slope_points = _calc_slope_points(trend_slice, point_value)
        trend_direction = "BUY" if slope_points >= slope_min else "SELL" if slope_points <= -slope_min else None
        if trend_direction is None:
            continue

        channel_slice = frame.tail(lookback)
        channel_high = float(channel_slice["high"].max())
        channel_low = float(channel_slice["low"].min())
        channel_mid = (channel_high + channel_low) / 2.0
        breakout_price = breakout_points * point_value
        channel_size = max(channel_high - channel_low, point_value * 20.0)

        candidate_side = "BUY" if close_price >= (channel_mid + breakout_price) else "SELL" if close_price <= (channel_mid - breakout_price) else None
        if candidate_side is None:
            continue
        if candidate_side != trend_direction and bool(config.get("require_structural_trend", True)):
            continue

        entry_price = close_price
        if candidate_side == "BUY":
            sl_price = entry_price - (channel_size * 0.5)
            tp_price = entry_price + (channel_size * max(rr_ratio, 0.7))
        else:
            sl_price = entry_price + (channel_size * 0.5)
            tp_price = entry_price - (channel_size * max(rr_ratio, 0.7))

        open_trade = {
            "side": candidate_side,
            "entry_price": entry_price,
            "entry_time": now_time,
            "sl_price": sl_price,
            "tp_price": tp_price,
        }

    total_trades = len(pnl_points)
    wins = [x for x in pnl_points if x > 0]
    losses = [x for x in pnl_points if x <= 0]
    gross_profit = float(sum(wins))
    gross_loss_abs = abs(float(sum(losses)))
    profit_factor = (gross_profit / gross_loss_abs) if gross_loss_abs > 0 else (gross_profit if gross_profit > 0 else 0.0)
    win_rate = (len(wins) / total_trades * 100.0) if total_trades > 0 else 0.0
    avg_win = (gross_profit / len(wins)) if wins else 0.0
    avg_loss = (abs(sum(losses)) / len(losses)) if losses else 0.0
    payoff = (avg_win / avg_loss) if avg_loss > 0 else 0.0
    max_drawdown = 0.0
    if equity_curve:
        peak = equity_curve[0]
        for value in equity_curve:
            peak = max(peak, value)
            max_drawdown = max(max_drawdown, peak - value)

    metrics = {
        "total_trades": float(total_trades),
        "total_pnl_points": round(float(sum(pnl_points)), 2),
        "win_rate": round(win_rate, 2),
        "payoff": round(payoff, 2),
        "profit_factor": round(profit_factor, 2),
        "max_drawdown_points": round(max_drawdown, 2),
        "avg_win_points": round(avg_win, 2),
        "avg_loss_points": round(avg_loss, 2),
    }
    metrics["score"] = _score_from_metrics(metrics)
    metrics["score_breakdown"] = score_breakdown(metrics)
    metrics["blocked_rate"] = round(max(0.0, 100.0 - ((total_trades / max(len(candles), 1)) * 100.0)), 2)
    return metrics, trades


def run_matrix_backtest(
    symbol: str,
    candles_df: pd.DataFrame,
    base_config: Dict[str, Any],
    point_value: float,
    spread_points: float,
    slippage_points: float,
    include_pairwise: bool = True,
) -> List[Dict[str, Any]]:
    results: List[Dict[str, Any]] = []
    for cfg in build_strategy_variations(base_config=base_config, include_pairwise=include_pairwise):
        metrics, trades = run_replay_backtest(
            symbol=symbol,
            candles_df=candles_df,
            config=cfg,
            point_value=point_value,
            spread_points=spread_points,
            slippage_points=slippage_points,
        )
        results.append(
            {
                "preset_id": str(cfg.get("preset_id", "CUSTOM")),
                "config_hash": config_hash(cfg),
                "config": cfg,
                "metrics": metrics,
                "trades": trades,
            }
        )
    results.sort(key=lambda item: float(item["metrics"].get("score", 0.0)), reverse=True)
    return results
