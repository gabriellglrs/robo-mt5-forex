import hashlib
import json
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
from concurrent.futures import ProcessPoolExecutor
import os

import numpy as np
import pandas as pd
from src.analysis.signals import SignalDetector


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
    rule_id: Optional[str] = None
    reason: Optional[str] = None


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
    # Adicionamos +120 barras de padding para garantir o warmup da tendência
    return max(120 + 120, min(10000, bars + 120))


def config_hash(config: Dict[str, Any]) -> str:
    stable_json = json.dumps(config, sort_keys=True, ensure_ascii=True)
    return hashlib.sha256(stable_json.encode("utf-8")).hexdigest()[:16]


def resample_to_timeframe(df: pd.DataFrame, target_tf: str) -> Optional[pd.DataFrame]:
    """Converte o dataframe base (ex: M15) para o timeframe alvo (ex: H1)."""
    if df.empty:
        return None
    
    tf_map = {
        "M1": "1min", "M5": "5min", "M15": "15min", "M30": "30min",
        "H1": "60min", "H4": "240min", "D1": "1440min"
    }
    
    freq = tf_map.get(target_tf)
    if not freq:
        return df # Fallback se não reconhecer
        
    # Precisamos de um index de tempo para o resample
    working_df = df.copy()
    if not isinstance(working_df.index, pd.DatetimeIndex):
        if "time" in working_df.columns:
            working_df.index = pd.to_datetime(working_df["time"])
        else:
            return df
            
    resampled = working_df.resample(freq).agg({
        "open": "first",
        "high": "max",
        "low": "min",
        "close": "last",
        "tick_volume": "sum",
        "time": "first"
    }).dropna()
    
    return resampled


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

    LABEL_MAP = {
        "breakout_buffer_points": "Buffer",
        "pullback_tolerance_points": "Reteste",
        "risk_percent": "Risco",
        "require_grouping": "Agrupamento",
        "require_structural_trend": "Trend H1"
    }

    for idx, variant in enumerate(list(variants)):
        if idx >= 3:
            break
        for key, values in pairwise_knobs:
            for value in values[:2]:
                cloned = dict(variant)
                cloned[key] = value
                label = LABEL_MAP.get(key, key)
                val_str = "ON" if value is True else "OFF" if value is False else str(value)
                cloned["preset_id"] = f"{variant.get('preset_id', 'CUSTOM')} • {label} [{val_str}]"
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
    
    detector = SignalDetector(symbol, config)
    detector.set_static_point(point_value)
    
    trend_tf = normalize_timeframe(config.get("trend_timeframe", "H1"))
    entry_tf = normalize_timeframe(config.get("entry_timeframe", "M15"))
    
    # Pre-calcular niveis SR se houver (opcional)
    sr_levels = [] # Pode ser expandido futuramente

    WARMUP_BARS = 100
    current_step = 0

    # Auditoria de Bloqueio (Caso resulte em 0 trades)
    blocker_stats: Dict[str, int] = {}

    for idx in range(max(lookback, trend_candles), len(candles)):
        current_step += 1
        frame = candles.iloc[: idx + 1]
        
        # Gerar Dataframe de Tendência (H1 rasmpeled) e Entrada (M15 native)
        # O detector espera esses nomes na cache estática
        trend_df = resample_to_timeframe(frame, trend_tf)
        entry_df = resample_to_timeframe(frame, entry_tf)
        
        row = frame.iloc[-1]
        close_price = float(row["close"])
        high_price = float(row["high"])
        low_price = float(row["low"])
        now_time: datetime = row["time"].to_pydatetime()

        if open_trade is not None:
            side = open_trade["side"]
            sl_price = open_trade["sl_price"]
            tp_price = open_trade["tp_price"]
            entry_price = open_trade["entry_price"]
            
            # --- Gestão de Trade Adiantada (Fimathe Pro) ---
            target_pts = abs(tp_price - entry_price) / max(point_value, 1e-9)
            be_trigger = _safe_float(config.get("be_trigger_percent", 50.0), 50.0)
            drag_mode = int(config.get("drag_mode", 0)) # 0: None, 1: FIM-017, 2: FIM-018
            gordurinha = _safe_float(config.get("gordurinha_points", 0.0), 0.0)
            target_lock = _safe_float(config.get("target_lock_percent", 100.0), 100.0)

            # Cálculo de progresso do trade
            curr_dist = (high_price - entry_price if side == "BUY" else entry_price - low_price) / max(point_value, 1e-9)
            progress_pct = (curr_dist / target_pts) * 100.0 if target_pts > 0 else 0

            # 1. Break-even / Trava
            if progress_pct >= be_trigger:
                new_sl = entry_price + (gordurinha * point_value) if side == "BUY" else entry_price - (gordurinha * point_value)
                if (side == "BUY" and new_sl > sl_price) or (side == "SELL" and new_sl < sl_price):
                    open_trade["sl_price"] = new_sl
                    sl_price = new_sl # Update local for exit check below
                    open_trade["managed"] = True

            # 2. Arraste (Trailing) FIM-018
            if drag_mode == 2 and progress_pct >= be_trigger:
                # Arraste infinito mantendo a gordurinha do pico de preço
                if side == "BUY":
                    trail_sl = high_price - (gordurinha * point_value)
                    if trail_sl > sl_price:
                        open_trade["sl_price"] = trail_sl
                        sl_price = trail_sl
                else:
                    trail_sl = low_price + (gordurinha * point_value)
                    if trail_sl < sl_price:
                        open_trade["sl_price"] = trail_sl
                        sl_price = trail_sl

            # --- Check Exits ---
            exit_price = None
            result = None
            if side == "BUY":
                if low_price <= sl_price:
                    exit_price = sl_price
                elif high_price >= tp_price:
                    exit_price = tp_price
            else:
                if high_price >= sl_price:
                    exit_price = sl_price
                elif low_price <= tp_price:
                    exit_price = tp_price

            if exit_price is not None:
                raw_points = (exit_price - entry_price) / max(point_value, 1e-9)
                if side == "SELL":
                    raw_points = -raw_points
                cost_points = spread_points + slippage_points
                net_points = raw_points - cost_points
                # Re-check result based on final net_points
                result = "0x0" if abs(net_points) <= 1.0 else "WIN" if net_points > 1.0 else "LOSS"
                
                running_equity += net_points
                equity_curve.append(running_equity)
                pnl_points.append(net_points)
                trades.append(
                    LabTrade(
                        symbol=symbol,
                        side=side,
                        entry_time=open_trade["entry_time"],
                        exit_time=now_time,
                        entry_price=entry_price,
                        exit_price=exit_price,
                        sl_price=sl_price,
                        tp_price=tp_price,
                        pnl_points=net_points,
                        result=result,
                        config_hash=cfg_hash,
                        rule_id=open_trade.get("rule_id"),
                        reason=open_trade.get("reason"),
                    )
                )
                open_trade = None
            continue

        # --- Analise High-Fidelity via SignalDetector Oficial ---
        detector.set_static_data(trend_tf, trend_df)
        detector.set_static_data(entry_tf, entry_df)
        
        signal_details = detector.evaluate_signal_details(
            current_price=close_price,
            levels=sr_levels,
            current_spread=spread_points
        )
        
        # Bloqueio de Warmup: não operamos nos primeiros passos para deixar o motor "cozinhar" a caixa
        if current_step < WARMUP_BARS:
            continue
        
        candidate_side = signal_details.get("signal")
        if candidate_side is None:
            # Registrar o motivo do bloqueio para diagnóstico
            reason = signal_details.get("reason", "unknown")
            blocker_stats[reason] = blocker_stats.get(reason, 0) + 1
            continue
            
        rule_id = signal_details.get("rule_id")
        reason = signal_details.get("reason")

        entry_price = close_price
        channel_size = signal_details.get("channel_size") or (abs(signal_details.get("point_a", 0) - signal_details.get("point_b", 0)))
        if not channel_size or channel_size <= 0:
            channel_size = breakout_points * point_value * 5 # fallback
            
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
            "rule_id": rule_id,
            "reason": reason,
        }

    total_trades = len(pnl_points)
    wins = [x for x in pnl_points if x > 1.0]
    be = [x for x in pnl_points if abs(x) <= 1.0]
    losses = [x for x in pnl_points if x < -1.0]
    
    gross_profit = float(sum([x for x in pnl_points if x > 0]))
    gross_loss_abs = abs(float(sum([x for x in pnl_points if x < 0])))
    
    profit_factor = (gross_profit / gross_loss_abs) if gross_loss_abs > 0 else (gross_profit if gross_profit > 0 else 0.0)
    win_rate = (len(wins) / total_trades * 100.0) if total_trades > 0 else 0.0
    avg_win = (gross_profit / len(wins)) if wins else 0.0
    avg_loss = (gross_loss_abs / len(losses)) if losses else 0.0
    payoff = (avg_win / avg_loss) if avg_loss > 0 else 0.0
    max_drawdown = 0.0
    if equity_curve:
        peak = equity_curve[0]
        for value in equity_curve:
            peak = max(peak, value)
            max_drawdown = max(max_drawdown, peak - value)

    metrics = {
        "total_trades": float(total_trades),
        "wins_count": len(wins),
        "losses_count": len(losses),
        "be_count": len(be),
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
    
    # Diagnóstico de Bloqueio se 0 trades
    if total_trades == 0 and blocker_stats:
        main_blocker = max(blocker_stats, key=blocker_stats.get)
        reason_map = {
            "mercado_lateral": "Tendência Lateral (FIM-002)",
            "aguardando_agrupamento": "Aguardando Agrupamento (FIM-006)",
            "aguardando_rompimento_canal": "Aguardando Rompimento (FIM-007)",
            "aguardando_pullback": "Aguardando Pullback (FIM-011)",
            "fora_da_regiao_negociavel": "Fora da Região Negociável (FIM-005)",
            "longe_do_nivel_sr": "Longe do Nível S/R (FIM-008)",
            "sem_dados_timeframe": "Dados insuficientes no Timeframe",
            "perimetro_seguranca_bloqueado": "Proteção de Perímetro Ativa"
        }
        metrics["diagnostic"] = f"Bloqueio predominante: {reason_map.get(main_blocker, main_blocker)}"
    else:
        metrics["diagnostic"] = "Simulação concluída com métricas reais."

    return metrics, trades


def _run_backtest_worker(args: Tuple):
    """Auxiliar para o Pool de Processos."""
    return run_replay_backtest(*args)


def run_matrix_backtest(
    symbol: str,
    candles_df: pd.DataFrame,
    base_config: Dict[str, Any],
    point_value: float,
    spread_points: float,
    slippage_points: float,
    include_pairwise: bool = True,
) -> List[Dict[str, Any]]:
    variants = build_strategy_variations(base_config=base_config, include_pairwise=include_pairwise)
    
    # Preparar argumentos para execução em paralelo
    worker_args = [
        (symbol, candles_df, cfg, point_value, spread_points, slippage_points)
        for cfg in variants
    ]
    
    results: List[Dict[str, Any]] = []
    
    # Usar todos os cores disponíveis (máximo de 8 para evitar overhead de contexto)
    max_workers = min(os.cpu_count() or 4, 8)
    
    with ProcessPoolExecutor(max_workers=max_workers) as executor:
        batch_results = list(executor.map(_run_backtest_worker, worker_args))
        
    for cfg, (metrics, trades) in zip(variants, batch_results):
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
