import json
import logging
import os
import time
from datetime import datetime

import MetaTrader5 as mt5

from analysis.levels import LevelDetector
from analysis.signals import SignalDetector
from core.connection import MT5Connection
from core.database import DatabaseManager
from execution.fimathe_cycle import evaluate_fimathe_cycle_event
from execution.orders import OrderEngine
from execution.risk import RiskManager

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("RoboMT5-Main")

SETTINGS_FILE = "config/settings.json"
MAX_SYMBOLS = 30
STRATEGY_NAME = "fimathe"
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
FIMATHE_RUNTIME_FILE = os.path.join(PROJECT_ROOT, "logs", "fimathe_runtime.json")


def load_settings():
    try:
        if not os.path.exists(SETTINGS_FILE):
            return None
        with open(SETTINGS_FILE, "r", encoding="utf-8") as file_handle:
            return json.load(file_handle)
    except Exception as exc:
        logger.error(f"Erro ao carregar configuracoes: {exc}")
        return None


def parse_symbols(settings):
    analysis = settings.get("analysis", {})
    raw_symbols = analysis.get("symbols")

    if isinstance(raw_symbols, str):
        symbols = [item.strip().upper() for item in raw_symbols.split(",") if item.strip()]
    elif isinstance(raw_symbols, list):
        symbols = [str(item).strip().upper() for item in raw_symbols if str(item).strip()]
    else:
        symbols = []

    if not symbols:
        symbols = ["EURUSD"]

    # Remove duplicados mantendo ordem
    symbols = list(dict.fromkeys(symbols))

    if len(symbols) > MAX_SYMBOLS:
        logger.warning(f"Mais de {MAX_SYMBOLS} ativos informados. Usando apenas os primeiros {MAX_SYMBOLS}.")
        symbols = symbols[:MAX_SYMBOLS]

    return symbols


def build_symbol_engines(symbols, settings, db_manager):
    analysis_cfg = settings.get("analysis", {})
    signal_logic_cfg = settings.get("signal_logic", {})
    risk_cfg = settings.get("risk_management", {})

    engines = {}

    for symbol in symbols:
        symbol_info = mt5.symbol_info(symbol)
        if symbol_info is None:
            logger.warning(f"Ativo {symbol} nao encontrado no MT5. Ignorando.")
            continue

        if not symbol_info.visible:
            mt5.symbol_select(symbol, True)

        detector = LevelDetector(
            symbol,
            history_years=analysis_cfg.get("history_years", 2),
            wick_sensitivity=analysis_cfg.get("wick_sensitivity", 0.3),
        )
        signal_logic_settings = dict(signal_logic_cfg)
        trend_tf = signal_logic_settings.get("trend_timeframe")
        entry_tf = signal_logic_settings.get("entry_timeframe")
        legacy_timeframes = analysis_cfg.get("timeframes", ["M5", "M15"])
        if not trend_tf:
            trend_tf = legacy_timeframes[-1] if legacy_timeframes else "H1"
            signal_logic_settings["trend_timeframe"] = trend_tf
        if not entry_tf:
            entry_tf = legacy_timeframes[0] if legacy_timeframes else "M15"
            signal_logic_settings["entry_timeframe"] = entry_tf
        signal_detector = SignalDetector(symbol, signal_logic_settings)

        risk_manager = RiskManager(symbol, risk_cfg)
        order_engine = OrderEngine(
            magic_number=risk_cfg.get("magic_number", 202404),
            db_manager=db_manager,
        )

        levels = detector.get_levels(mode=STRATEGY_NAME)

        engines[symbol] = {
            "detector": detector,
            "signal_detector": signal_detector,
            "risk_manager": risk_manager,
            "order_engine": order_engine,
            "levels": levels,
        }

        logger.info(f"{symbol}: monitoramento iniciado com {len(levels)} niveis ativos.")

    return engines


def build_analysis_flow_payload(symbol, current_price, details, open_count, max_pos):
    tf_results = details.get("tf_results", {})
    tf_summary = {tf: result for tf, result in tf_results.items()}

    nearest_level_points = details.get("nearest_level_points")
    if nearest_level_points is not None:
        nearest_level_points = round(float(nearest_level_points), 2)

    return {
        "event": "analysis_flow",
        "timestamp": datetime.now().isoformat(timespec="seconds"),
        "symbol": symbol,
        "price": round(float(current_price), 5),
        "setup_status": "PRONTO_PARA_ENTRADA" if details.get("signal") else "AGUARDANDO",
        "signal": details.get("signal"),
        "reason": details.get("reason"),
        "rule_id": details.get("rule_id"),
        "rule_name": details.get("rule_name"),
        "next_trigger": details.get("next_trigger"),
        "rule_trace": details.get("rule_trace", {}),
        "near_sr": bool(details.get("near_sr")),
        "sr_tolerance_points": details.get("sr_tolerance_points"),
        "nearest_level_points": nearest_level_points,
        "mode": details.get("mode"),
        "strategy": STRATEGY_NAME,
        "trend_timeframe": details.get("trend_timeframe"),
        "entry_timeframe": details.get("entry_timeframe"),
        "trend_direction": details.get("trend_direction"),
        "trend_slope_points": details.get("trend_slope_points"),
        "channel_high": details.get("channel_high"),
        "channel_low": details.get("channel_low"),
        "channel_mid": details.get("channel_mid"),
        "point_a": details.get("point_a"),
        "point_b": details.get("point_b"),
        "projection_50": details.get("projection_50"),
        "projection_80": details.get("projection_80"),
        "projection_85": details.get("projection_85"),
        "projection_100": details.get("projection_100"),
        "near_trade_region": details.get("near_trade_region"),
        "nearest_trade_region_points": details.get("nearest_trade_region_points"),
        "grouping_ok": details.get("grouping_ok"),
        "grouping_range_points": details.get("grouping_range_points"),
        "breakout_ok": details.get("breakout_ok"),
        "pullback_ok": details.get("pullback_ok"),
        "timeframes_expected": details.get("timeframes_expected"),
        "timeframes_received": details.get("timeframes_received"),
        "tf_results": tf_summary,
        "open_positions": int(open_count),
        "max_open_positions": int(max_pos),
        "display_text": f"[{symbol}] {details.get('rule_name') or 'Aguardando'}: {details.get('next_trigger') or 'Monitorando setup.'}",
    }


def _safe_float(value):
    try:
        return float(value)
    except Exception:
        return None


def _safe_round(value, digits=5):
    value = _safe_float(value)
    if value is None:
        return None
    return round(value, digits)


def _extract_cycle_context(order_engine, ticket, trade_context_cache):
    cached = trade_context_cache.get(ticket)
    if isinstance(cached, dict):
        return cached

    context = {}
    trade_context = order_engine.get_trade_context(ticket)
    if isinstance(trade_context, dict):
        indicators = trade_context.get("indicators")
        if isinstance(indicators, dict):
            context = {
                "point_a": indicators.get("point_a"),
                "point_b": indicators.get("point_b"),
                "projection_50": indicators.get("projection_50"),
                "projection_80": indicators.get("projection_80"),
                "projection_85": indicators.get("projection_85"),
                "projection_100": indicators.get("projection_100"),
            }

    trade_context_cache[ticket] = context
    return context


def append_runtime_event(runtime_snapshot, symbol, message, level="INFO"):
    events = runtime_snapshot.setdefault("recent_events", [])
    events.append(
        {
            "timestamp": datetime.now().isoformat(timespec="seconds"),
            "symbol": symbol,
            "level": level,
            "message": message,
        }
    )
    if len(events) > 80:
        del events[:-80]


def build_runtime_symbol_snapshot(symbol, current_price, details, open_count, max_pos, point, breakout_buffer_points, trailing_summary, trading_type="manual", current_pnl=0.0):
    reason = details.get("reason")
    signal = details.get("signal")
    trend_direction = details.get("trend_direction")

    channel_mid = _safe_float(details.get("channel_mid"))
    channel_high = _safe_float(details.get("channel_high"))
    channel_low = _safe_float(details.get("channel_low"))
    breakout_distance_points = None

    status_phase = "monitoramento"
    if signal:
        status_phase = "entrada"
    elif reason in ["sem_dados_timeframe"]:
        status_phase = "dados"
    elif reason in ["mercado_lateral", "tendencia_sem_confluencia"]:
        status_phase = "tendencia"
    elif reason in ["aguardando_rompimento_canal", "aguardando_pullback"]:
        status_phase = "rompimento" if reason == "aguardando_rompimento_canal" else "pullback"
    elif reason in ["fora_da_regiao_negociavel", "longe_do_nivel_sr", "reversao_bloqueada"]:
        status_phase = "sr"
    
    # Texto e Gatilho Vêm Prioritariamente do Motor de Estados (Consistência 100%)
    status_text = details.get("rule_name") or "Monitorando setup Fimathe."
    next_trigger = details.get("next_trigger") or "Aguardar proximo gatilho tecnico."

    # Lógica de Proximidade (Sobrescreve texto se estiver "quase lá")
    if reason == "aguardando_rompimento_canal" and point and channel_mid is not None:
        breakout_line = channel_mid
        if trend_direction == "BUY":
            breakout_line = channel_mid + (breakout_buffer_points * point)
            breakout_distance_points = (breakout_line - current_price) / point
        elif trend_direction == "SELL":
            breakout_line = channel_mid - (breakout_buffer_points * point)
            breakout_distance_points = (current_price - breakout_line) / point

        if breakout_distance_points is not None:
            breakout_distance_points = round(float(breakout_distance_points), 2)
            near_breakout_threshold = max(5.0, float(breakout_buffer_points) * 0.35)
            if breakout_distance_points <= near_breakout_threshold:
                status_text = "Esta prestes a romper o canal. Preparar entrada."

    if open_count >= max_pos:
        status_phase = "limite"
        status_text = "Limite maximo de posicoes atingido."
        next_trigger = "Aguardar vaga de exposicao para liberar nova entrada."

    trailing_updates = int(trailing_summary.get("updated", 0))
    last_cycle_action = trailing_summary.get("last_cycle_action", {})
    rule_id = details.get("rule_id") or "FIM-014"
    next_trigger = details.get("next_trigger") or "Aguardar proximo gatilho tecnico."
    if trailing_updates > 0:
        status_phase = "gestao_risco"
        status_text = f"Vamos mover o stoploss para nao ter risco ({trailing_updates} ajuste(s) recente(s))."
        if isinstance(last_cycle_action, dict) and last_cycle_action.get("event"):
            rule_id = last_cycle_action.get("rule_id") or "FIM-010"
            next_trigger = last_cycle_action.get("next_trigger") or next_trigger
    elif open_count > 0:
        status_phase = "gestao_risco"
        status_text = "Posicao ativa. Gestao automatica de risco e trailing em acompanhamento."
        rule_id = "FIM-010"
        next_trigger = trailing_summary.get("next_trigger") or "Aguardar evento tecnico de stop (topo/50/100)."

    if open_count >= max_pos:
        rule_id = "FIM-012" # Relacionado a Limite de Risco/Exposicao
        next_trigger = "Aguardar fechamento de posicao para liberar nova entrada."

    return {
        "timestamp": datetime.now().isoformat(timespec="seconds"),
        "symbol": symbol,
        "price": _safe_round(current_price, 5),
        "trading_type": trading_type,
        "current_pnl": _safe_round(current_pnl, 2),
        "status_phase": status_phase,
        "status_text": status_text,
        "signal": signal,
        "candidate_signal": details.get("candidate_signal"),
        "reason": reason,
        "rule_id": rule_id,
        "rule_name": details.get("rule_name"),
        "next_trigger": next_trigger,
        "trend_direction": trend_direction,
        "trend_slope_points": _safe_round(details.get("trend_slope_points"), 2),
        "trend_timeframe": details.get("trend_timeframe"),
        "entry_timeframe": details.get("entry_timeframe"),
        "channel_high": _safe_round(channel_high, 5),
        "channel_low": _safe_round(channel_low, 5),
        "channel_mid": _safe_round(channel_mid, 5),
        "point_a": _safe_round(details.get("point_a"), 5),
        "point_b": _safe_round(details.get("point_b"), 5),
        "projection_50": _safe_round(details.get("projection_50"), 5),
        "projection_80": _safe_round(details.get("projection_80"), 5),
        "projection_85": _safe_round(details.get("projection_85"), 5),
        "projection_100": _safe_round(details.get("projection_100"), 5),
        "breakout_ok": bool(details.get("breakout_ok")),
        "pullback_ok": bool(details.get("pullback_ok")),
        "grouping_ok": bool(details.get("grouping_ok")),
        "grouping_range_points": _safe_round(details.get("grouping_range_points"), 2),
        "breakout_distance_points": breakout_distance_points,
        "near_sr": bool(details.get("near_sr")),
        "rule_trace": details.get("rule_trace", {}),
        "nearest_level_points": _safe_round(details.get("nearest_level_points"), 2),
        "near_trade_region": bool(details.get("near_trade_region")),
        "nearest_trade_region_points": _safe_round(details.get("nearest_trade_region_points"), 2),
        "sr_tolerance_points": _safe_round(details.get("sr_tolerance_points"), 2),
        "open_positions": int(open_count),
        "max_open_positions": int(max_pos),
        "current_pnl": _safe_round(current_pnl, 2),
        "trailing_updates": trailing_updates,
        "trailing_actions": trailing_summary.get("actions", []),
        "last_cycle_action": last_cycle_action,
    }


def run_startup_audit(db_manager, engines):
    """Verifica trades abertos no banco que não estão mais no MT5 (fechados offline)."""
    logger.info("=== INICIANDO AUDITORIA DE STARTUP ===")
    open_trades = db_manager.get_open_trades()
    if not open_trades:
        logger.info("Nenhum trade aberto no banco para auditar.")
        return

    for t in open_trades:
        ticket = t["ticket"]
        symbol = t["symbol"]
        
        # Verifica se o ticket ainda existe nas posições abertas do MT5
        positions = mt5.positions_get(ticket=int(ticket))
        if positions is None or len(positions) == 0:
            logger.warning(f"[Startup Audit] Trade #{ticket} ({symbol}) não encontrado no MT5. Sincronizando fechamento...")
            
            # Precisamos do engine do símbolo para sincronizar
            if symbol in engines:
                order_engine = engines[symbol]["order_engine"]
                details = order_engine.sync_position_closure(ticket)
                if details:
                    logger.info(f"[Startup Audit] Sucesso ao sincronizar trade #{ticket}. PnL: {details.get('pnl'):.2f}")
            else:
                logger.error(f"[Startup Audit] Engine para {symbol} não encontrado. Não foi possível sincronizar o ticket #{ticket}")
        else:
            logger.info(f"[Startup Audit] Trade #{ticket} ({symbol}) confirmado como ainda aberto.")
    
    logger.info("=== AUDITORIA DE STARTUP FINALIZADA ===")


def write_runtime_snapshot(runtime_snapshot):
    max_retries = 3
    for attempt in range(max_retries):
        try:
            os.makedirs(os.path.dirname(FIMATHE_RUNTIME_FILE), exist_ok=True)
            temp_path = f"{FIMATHE_RUNTIME_FILE}.tmp"
            with open(temp_path, "w", encoding="utf-8") as file_handle:
                json.dump(runtime_snapshot, file_handle, indent=2, ensure_ascii=False)
            os.replace(temp_path, FIMATHE_RUNTIME_FILE)
            return
        except (IOError, OSError) as exc:
            if attempt < max_retries - 1:
                time.sleep(0.1)
                continue
            logger.error(f"Falha persistente ao gravar snapshot Fimathe: {exc}")


def _is_better_sl(position_type, candidate_sl, reference_sl, min_step_price):
    if reference_sl is None:
        return True
    if position_type == mt5.POSITION_TYPE_BUY:
        return candidate_sl > (reference_sl + min_step_price)
    if position_type == mt5.POSITION_TYPE_SELL:
        return candidate_sl < (reference_sl - min_step_price)
    return False


def _is_better_tp(position_type, candidate_tp, reference_tp, min_step_price):
    if reference_tp is None:
        return True
    if position_type == mt5.POSITION_TYPE_BUY:
        return candidate_tp > (reference_tp + min_step_price)
    if position_type == mt5.POSITION_TYPE_SELL:
        return candidate_tp < (reference_tp - min_step_price)
    return False


def apply_trailing_management(
    symbol,
    tick,
    engine,
    trailing_cfg,
    last_update_per_ticket,
    trade_context_cache,
    cycle_state_by_ticket,
):
    """Arrasta SL/TP automaticamente para posições abertas no símbolo."""
    order_engine = engine["order_engine"]
    positions = order_engine.get_open_positions(symbol)
    summary = {
        "open_positions": len(positions) if positions else 0,
        "updated": 0,
        "actions": [],
        "next_trigger": None,
        "last_cycle_action": {},
    }
    if not positions:
        return summary

    symbol_info = mt5.symbol_info(symbol)
    if symbol_info is None or not symbol_info.point:
        return summary

    point = float(symbol_info.point)
    digits = int(symbol_info.digits) if symbol_info.digits is not None else 5
    min_step_price = float(trailing_cfg["update_min_step_points"]) * point
    now_ts = time.time()

    for pos in positions:
        if pos.type not in (mt5.POSITION_TYPE_BUY, mt5.POSITION_TYPE_SELL):
            continue

        ticket = int(pos.ticket)
        last_update_ts = last_update_per_ticket.get(ticket, 0.0)
        if (now_ts - last_update_ts) < float(trailing_cfg["update_cooldown_seconds"]):
            continue

        current_price = tick.bid if pos.type == mt5.POSITION_TYPE_BUY else tick.ask
        open_price = float(pos.price_open)
        current_sl = float(pos.sl) if pos.sl and float(pos.sl) > 0 else None
        current_tp = float(pos.tp) if pos.tp and float(pos.tp) > 0 else None

        if pos.type == mt5.POSITION_TYPE_BUY:
            profit_points = (current_price - open_price) / point
        else:
            profit_points = (open_price - current_price) / point

        new_sl = current_sl
        new_tp = current_tp
        has_change = False
        side = "BUY" if pos.type == mt5.POSITION_TYPE_BUY else "SELL"
        cycle_action = None
        cycle_next_trigger = None

        if trailing_cfg.get("fimathe_cycle_enabled", True):
            cycle_context = _extract_cycle_context(order_engine, ticket, trade_context_cache)
            cycle_eval = evaluate_fimathe_cycle_event(
                side=side,
                current_price=current_price,
                open_price=open_price,
                context=cycle_context,
                state=cycle_state_by_ticket.get(ticket),
                config=trailing_cfg,
                point=point,
            )
            cycle_state_by_ticket[ticket] = cycle_eval.get("state", {})
            cycle_next_trigger = cycle_eval.get("next_trigger")
            cycle_action = cycle_eval.get("action")
            if cycle_action:
                candidate_sl = _safe_float(cycle_action.get("candidate_sl"))
                if candidate_sl is not None and _is_better_sl(pos.type, candidate_sl, new_sl, min_step_price):
                    new_sl = candidate_sl
                    has_change = True

        # 1) Break-even
        if trailing_cfg["breakeven_enabled"] and profit_points >= trailing_cfg["breakeven_trigger_points"]:
            if pos.type == mt5.POSITION_TYPE_BUY:
                be_sl = open_price + (trailing_cfg["breakeven_offset_points"] * point)
            else:
                be_sl = open_price - (trailing_cfg["breakeven_offset_points"] * point)

            if _is_better_sl(pos.type, be_sl, new_sl, min_step_price):
                new_sl = be_sl
                has_change = True

        # 2) Trailing de SL
        if trailing_cfg["enabled"] and profit_points >= trailing_cfg["activation_points"]:
            if pos.type == mt5.POSITION_TYPE_BUY:
                candidate_sl = current_price - (trailing_cfg["sl_distance_points"] * point)
            else:
                candidate_sl = current_price + (trailing_cfg["sl_distance_points"] * point)

            if _is_better_sl(pos.type, candidate_sl, new_sl, min_step_price):
                new_sl = candidate_sl
                has_change = True

        # 3) Trailing de TP
        is_infinite = trailing_cfg.get("fimathe_management_mode") == "infinity"
        if is_infinite:
            if current_tp is not None and current_tp > 0:
                new_tp = 0.0
                has_change = True
        elif trailing_cfg["tp_enabled"] and profit_points >= trailing_cfg["activation_points"]:
            if pos.type == mt5.POSITION_TYPE_BUY:
                candidate_tp = current_price + (trailing_cfg["tp_distance_points"] * point)
            else:
                candidate_tp = current_price - (trailing_cfg["tp_distance_points"] * point)

            if _is_better_tp(pos.type, candidate_tp, new_tp, min_step_price):
                new_tp = candidate_tp
                has_change = True

        if not has_change:
            if cycle_next_trigger and not summary.get("next_trigger"):
                summary["next_trigger"] = cycle_next_trigger
            continue

        # Valida se SL/TP continuam coerentes com a direção
        if pos.type == mt5.POSITION_TYPE_BUY:
            if new_sl is not None and new_sl >= current_price:
                continue
            if new_tp is not None and new_tp <= current_price:
                continue
        else:
            if new_sl is not None and new_sl <= current_price:
                continue
            if new_tp is not None and new_tp >= current_price:
                continue

        # Mantém valores existentes quando não houver candidato novo
        final_sl = round(new_sl if new_sl is not None else (current_sl or 0.0), digits)
        final_tp = round(new_tp if new_tp is not None else (current_tp or 0.0), digits)

        result = order_engine.modify_position_sl_tp(ticket=ticket, symbol=symbol, sl=final_sl, tp=final_tp)
        if result and getattr(result, "retcode", None) == mt5.TRADE_RETCODE_DONE:
            last_update_per_ticket[ticket] = now_ts
            summary["updated"] += 1
            action_record = {
                "ticket": ticket,
                "side": side,
                "sl_before": _safe_round(current_sl, digits),
                "sl_after": final_sl,
                "tp_before": _safe_round(current_tp, digits),
                "tp_after": final_tp,
            }
            if cycle_action:
                action_record.update(
                    {
                        "event": cycle_action.get("event"),
                        "rule_id": cycle_action.get("rule_id", "FIM-010"),
                        "note": cycle_action.get("note"),
                        "next_trigger": cycle_next_trigger,
                    }
                )
                summary["last_cycle_action"] = action_record
            summary["actions"].append(action_record)
            if cycle_next_trigger:
                summary["next_trigger"] = cycle_next_trigger

    return summary


def main():
    logger.info("### Robo MT5 v2 - MODO OPERACAO MULTIATIVO ###")

    settings = load_settings()
    if not settings:
        logger.error("Configuracoes nao encontradas.")
        return

    symbols = parse_symbols(settings)

    conn = MT5Connection()
    if not conn.connect():
        return

    db_manager = DatabaseManager()
    db_manager.log_event("INFO", "Main", f"Robo iniciado com sucesso. Ativos: {', '.join(symbols)}")
    runtime_snapshot = {
        "status": "starting",
        "strategy": STRATEGY_NAME,
        "started_at": datetime.now().isoformat(timespec="seconds"),
        "updated_at": datetime.now().isoformat(timespec="seconds"),
        "symbols": {},
        "recent_events": [],
    }
    write_runtime_snapshot(runtime_snapshot)

    try:
        engines = build_symbol_engines(symbols, settings, db_manager)
        if not engines:
            logger.error("Nenhum ativo valido disponivel para monitorar.")
            return

        # Auditoria Proativa: Sincroniza trades que podem ter sido fechados enquanto o robô estava offline
        run_startup_audit(db_manager, engines)

        analysis_cfg = settings.get("analysis", {})
        signal_cfg = settings.get("signal_logic", {})
        risk_cfg = settings.get("risk_management", {})
        breakout_buffer_points = max(0, int(signal_cfg.get("breakout_buffer_points", 10)))
        trend_tf = signal_cfg.get("trend_timeframe")
        entry_tf = signal_cfg.get("entry_timeframe")
        if trend_tf and entry_tf:
            timeframes = list(dict.fromkeys([entry_tf, trend_tf]))
        else:
            timeframes = analysis_cfg.get("timeframes", ["M5", "M15"])
        symbol_cooldown_seconds = int(risk_cfg.get("symbol_cooldown_seconds", 300))
        if symbol_cooldown_seconds < 0:
            symbol_cooldown_seconds = 0
        trailing_cfg = {
            "enabled": bool(risk_cfg.get("trailing_enabled", True)),
            "activation_points": max(1, int(risk_cfg.get("trailing_activation_points", 150))),
            "sl_distance_points": max(1, int(risk_cfg.get("trailing_sl_distance_points", 120))),
            "tp_enabled": bool(risk_cfg.get("trailing_tp_enabled", True)),
            "tp_distance_points": max(1, int(risk_cfg.get("trailing_tp_distance_points", 250))),
            "breakeven_enabled": bool(risk_cfg.get("use_breakeven", False)),
            "breakeven_trigger_points": max(1, int(risk_cfg.get("breakeven_trigger_points", 120))),
            "breakeven_offset_points": max(0, int(risk_cfg.get("breakeven_offset_points", 5))),
            "update_min_step_points": max(1, int(risk_cfg.get("trailing_update_min_step_points", 20))),
            "update_cooldown_seconds": max(1, int(risk_cfg.get("trailing_update_cooldown_seconds", 3))),
            "fimathe_cycle_enabled": bool(risk_cfg.get("fimathe_cycle_enabled", True)),
            "fimathe_cycle_top_level": str(signal_cfg.get("target_level_mode", "80")),
            "fimathe_cycle_top_retrace_points": max(1, int(risk_cfg.get("fimathe_cycle_top_retrace_points", 45))),
            "fimathe_cycle_min_profit_points": max(1, int(risk_cfg.get("fimathe_cycle_min_profit_points", 80))),
            "fimathe_cycle_protection_buffer_points": max(1, int(risk_cfg.get("fimathe_cycle_protection_buffer_points", 12))),
            "fimathe_cycle_breakeven_offset_points": max(0, int(risk_cfg.get("fimathe_cycle_breakeven_offset_points", 5))),
        }
        analysis_flow_interval_seconds = int(settings.get("ui_settings", {}).get("analysis_flow_interval_seconds", 15))
        if analysis_flow_interval_seconds < 5:
            analysis_flow_interval_seconds = 5
        last_analysis_log_per_symbol = {symbol: 0.0 for symbol in engines.keys()}
        last_logged_reason_per_symbol = {symbol: None for symbol in engines.keys()}
        last_logged_signal_per_symbol = {symbol: None for symbol in engines.keys()}
        last_audit_log_ts_per_symbol = {symbol: 0.0 for symbol in engines.keys()}
        last_order_ts_per_symbol = {symbol: 0.0 for symbol in engines.keys()}
        last_trailing_update_per_ticket = {}
        active_tickets_per_symbol = {symbol: set() for symbol in engines.keys()}
        trade_context_cache = {}
        cycle_state_by_ticket = {}
        last_runtime_write_ts = 0.0
        runtime_snapshot["status"] = "running"
        runtime_snapshot["symbols"] = {}
        runtime_snapshot["recent_events"] = []

        loop_counter = 0
        while True:
            # Recarrega configurações para captar mudanças da UI
            new_settings = load_settings()
            if new_settings:
                settings = new_settings
                
                # Verificação dinâmica de símbolos (Ativos Monitorados)
                current_config_symbols = parse_symbols(settings)
                active_symbols = list(engines.keys())
                
                if set(current_config_symbols) != set(active_symbols):
                    logger.info("Mudança detectada na lista de ativos. Recarregando motores...")
                    # Para simplificar, reconstruímos os motores necessários
                    # TODO: Otimizar para adicionar/remover apenas o delta
                    new_engines = build_symbol_engines(current_config_symbols, settings, db_manager)
                    if new_engines:
                        engines = new_engines
                        # Resetar logs de intervalo para os novos ativos
                        for s in engines.keys():
                            if s not in last_analysis_log_per_symbol:
                                last_analysis_log_per_symbol[s] = 0.0
                                last_order_ts_per_symbol[s] = 0.0

            is_running = settings.get("running_state", False)

            if loop_counter % 60 == 0:
                status_msg = "Robo operando normalmente." if is_running else "Robo em PAUSE (Aguardando Start na UI)."
                db_manager.log_event("INFO", "Heartbeat", status_msg)
                loop_counter = 0

            if not is_running:
                runtime_snapshot["status"] = "paused"
                runtime_snapshot["updated_at"] = datetime.now().isoformat(timespec="seconds")
                write_runtime_snapshot(runtime_snapshot)
                time.sleep(2)
                loop_counter += 1
                continue
            
            runtime_snapshot["status"] = "running"

            # Coleta de dados financeiros globais e por símbolo
            acc_info = mt5.account_info()
            if acc_info:
                runtime_snapshot["account"] = {
                    "balance": acc_info.balance,
                    "equity": acc_info.equity,
                    "profit": acc_info.profit,
                }
            
            pnl_by_symbol = {}
            all_positions = mt5.positions_get()
            if all_positions:
                for pos in all_positions:
                    pnl_by_symbol[pos.symbol] = pnl_by_symbol.get(pos.symbol, 0.0) + pos.profit

            for symbol, engine in engines.items():
                try:
                    tick = mt5.symbol_info_tick(symbol)
                    if tick is None:
                        continue

                    trailing_summary = apply_trailing_management(
                        symbol=symbol,
                        tick=tick,
                        engine=engine,
                        trailing_cfg=trailing_cfg,
                        last_update_per_ticket=last_trailing_update_per_ticket,
                        trade_context_cache=trade_context_cache,
                        cycle_state_by_ticket=cycle_state_by_ticket,
                    )

                    # Atualiza configurações dinâmicas no signal_detector e risk_manager
                    signal_cfg_current = settings.get("signal_logic", {})
                    engine["signal_detector"].settings = signal_cfg_current
                    
                    risk_cfg_current = settings.get("risk_management", {})
                    # Inject strategy flags for risk manager
                    risk_cfg_current["fimathe_target_level"] = settings.get("signal_logic", {}).get("target_level_mode", "80")
                    
                    engine["risk_manager"].config = risk_cfg_current
                    engine["risk_manager"].settings = risk_cfg_current

                    current_price = tick.bid
                    signal_point = getattr(engine["signal_detector"], "point", 0.00001) or 0.00001
                    current_spread = int((tick.ask - tick.bid) / float(signal_point)) if signal_point else 0
                    
                    details = engine["signal_detector"].evaluate_signal_details(
                        current_price, 
                        engine["levels"],
                        current_spread=current_spread
                    )
                    signal = details.get("signal")

                    order_engine = engine["order_engine"]
                    mt5_positions = order_engine.get_open_positions(symbol)
                    db_trades = db_manager.get_open_trades(symbol)
                    
                    # Consolidacao por tickets unicos para evitar 'Race Conditions' e duplicidade
                    active_tickets = {p.ticket for p in mt5_positions} | {t["ticket"] for t in db_trades}
                    open_count = len(active_tickets)
                    
                    current_tickets = {pos.ticket for pos in mt5_positions}
                    
                    # Auditoria de Fechamento (Se um ticket sumiu, ele foi fechado)
                    last_tickets = active_tickets_per_symbol.get(symbol, set())
                    closed_tickets = last_tickets - current_tickets
                    for closed_ticket in closed_tickets:
                        logger.info(f"[{symbol}] Detecao de fechamento para o ticket #{closed_ticket}. Sincronizando historico...")
                        close_details = order_engine.sync_position_closure(closed_ticket)
                        if close_details:
                            pnl_val = close_details.get("pnl", 0.0)
                            pnl_str = f"+${pnl_val:.2f}" if pnl_val >= 0 else f"-${abs(pnl_val):.2f}"
                            append_runtime_event(
                                runtime_snapshot,
                                symbol,
                                f"Trade #{closed_ticket} encerrado. Resultado final: {pnl_str}",
                                "TRADE_CLOSE"
                            )
                    active_tickets_per_symbol[symbol] = current_tickets

                    max_pos = risk_cfg.get("max_open_positions", 1)
                    if open_count > 0:
                        details["rule_id"] = details.get("rule_id") or "FIM-010"
                        details["rule_name"] = details.get("rule_name") or "Gestao de stop por ciclo"
                        if trailing_summary.get("next_trigger"):
                            details["next_trigger"] = trailing_summary.get("next_trigger")
                    if open_count >= max_pos:
                        details["rule_id"] = "FIM-012"
                        details["rule_name"] = "Limites de exposicao"
                        details["next_trigger"] = "Aguardar vaga de exposicao para liberar nova entrada."
                    signal_point = getattr(engine["signal_detector"], "point", 0.00001) or 0.00001

                    symbol_snapshot = build_runtime_symbol_snapshot(
                        symbol=symbol,
                        current_price=current_price,
                        details=details,
                        open_count=open_count,
                        max_pos=max_pos,
                        point=float(signal_point),
                        breakout_buffer_points=breakout_buffer_points,
                        trailing_summary=trailing_summary,
                        trading_type=signal_cfg.get("trading_type", "manual"),
                        current_pnl=pnl_by_symbol.get(symbol, 0.0),
                    )
                    previous_reason = runtime_snapshot["symbols"].get(symbol, {}).get("reason")
                    runtime_snapshot["symbols"][symbol] = symbol_snapshot
                    if previous_reason != symbol_snapshot.get("reason"):
                        append_runtime_event(
                            runtime_snapshot,
                            symbol,
                            symbol_snapshot.get("status_text", "Atualizacao de fluxo."),
                            "FLOW",
                        )

                    for action in trailing_summary.get("actions", []):
                        ticket = action.get("ticket")
                        action_note = action.get("note") or "stop/take ajustado para proteger risco."
                        action_rule = action.get("rule_id") or "FIM-010"
                        append_runtime_event(
                            runtime_snapshot,
                            symbol,
                            f"Ticket {ticket}: {action_note} ({action_rule})",
                            "RISK",
                        )

                    now_ts = time.time()
                    
                    # LOGICA DELTA: So grava no banco de dados se o estado mudar ou a cada 10 min (heartbeat)
                    current_reason = details.get("reason")
                    current_signal = details.get("signal")
                    last_reason = last_logged_reason_per_symbol.get(symbol)
                    last_signal = last_logged_signal_per_symbol.get(symbol)
                    
                    # Mudanca de fase ou mudanca de sinal (ex: de None para BUY, ou de BUY para None)
                    is_state_change = (current_reason != last_reason) or (current_signal != last_signal)
                    is_heartbeat = (now_ts - last_audit_log_ts_per_symbol.get(symbol, 0.0)) >= 600 # 10 minutos
                    
                    if is_state_change or is_heartbeat:
                        payload = build_analysis_flow_payload(
                            symbol=symbol,
                            current_price=current_price,
                            details=details,
                            open_count=open_count,
                            max_pos=max_pos,
                        )
                        log_msg = f"{payload.get('display_text', symbol)} | {json.dumps(payload, ensure_ascii=False)}"
                        db_manager.log_event("INFO", "AnalysisFlow", log_msg)
                        last_logged_reason_per_symbol[symbol] = current_reason
                        last_logged_signal_per_symbol[symbol] = current_signal
                        last_audit_log_ts_per_symbol[symbol] = now_ts

                    if not signal:
                        continue
                    if open_count >= max_pos:
                        continue

                    now_ts = time.time()
                    cooldown_remaining = symbol_cooldown_seconds - (now_ts - last_order_ts_per_symbol.get(symbol, 0.0))
                    if cooldown_remaining > 0:
                        continue

                    logger.warning(f"[{symbol}] SINAL CONFIRMADO: {signal}")
                    sl, tp = engine["risk_manager"].calculate_prices(
                        signal,
                        current_price,
                        engine["levels"],
                        signal_details=details,
                    )
                    # Usa lot do risk_manager (que deve ser atualizado se o settings mudou)
                    # Nota: simplificando para esta fase de UX, o risk_manager usa o config estático do init.
                    # TODO: Implementar RiskManager.update_config(risk_cfg)
                    risk_cfg_current = settings.get("risk_management", {})
                    engine["risk_manager"].config = risk_cfg_current # Atualização bruta para a fase de UX
                    
                    lot = engine["risk_manager"].calculate_lot(abs(current_price - sl))

                    order_type = mt5.ORDER_TYPE_BUY if signal == "BUY" else mt5.ORDER_TYPE_SELL

                    deviation = int(signal_cfg_current.get("max_slippage_points", 20))

                    result = order_engine.send_market_order(
                        symbol=symbol,
                        order_type=order_type,
                        volume=lot,
                        sl=sl,
                        tp=tp,
                        deviation=deviation,
                        timeframe=",".join(timeframes),
                        strategy=STRATEGY_NAME,
                        indicators=details,
                    )
                    if result and getattr(result, "retcode", None) == mt5.TRADE_RETCODE_DONE:
                        last_order_ts_per_symbol[symbol] = time.time()
                        append_runtime_event(
                            runtime_snapshot,
                            symbol,
                            f"Ordem {signal} executada com sucesso (ticket {getattr(result, 'order', '-')}).",
                            "ENTRY",
                        )
                except Exception as symbol_exc:
                    logger.error(f"[{symbol}] Erro no ciclo de monitoramento: {symbol_exc}")
                    db_manager.log_event("ERROR", "Main", f"{symbol}: {symbol_exc}")
                    runtime_snapshot["symbols"][symbol] = {
                        "timestamp": datetime.now().isoformat(timespec="seconds"),
                        "symbol": symbol,
                        "status_phase": "erro",
                        "status_text": f"Erro de monitoramento: {symbol_exc}",
                        "reason": "erro_monitoramento",
                        "open_positions": 0,
                        "max_open_positions": int(risk_cfg.get("max_open_positions", 1)),
                    }
                    append_runtime_event(runtime_snapshot, symbol, f"Erro de monitoramento: {symbol_exc}", "ERROR")

            loop_counter += 1
            runtime_snapshot["updated_at"] = datetime.now().isoformat(timespec="seconds")
            now_write_ts = time.time()
            if (now_write_ts - last_runtime_write_ts) >= 1.0:
                write_runtime_snapshot(runtime_snapshot)
                last_runtime_write_ts = now_write_ts
            time.sleep(1)

    except KeyboardInterrupt:
        logger.info("Encerrando robo...")
        db_manager.log_event("WARNING", "Main", "Robo encerrado manualmente.")
        runtime_snapshot["status"] = "stopped"
        runtime_snapshot["updated_at"] = datetime.now().isoformat(timespec="seconds")
        append_runtime_event(runtime_snapshot, "SYSTEM", "Robo encerrado manualmente.", "WARNING")
        write_runtime_snapshot(runtime_snapshot)
    except Exception as exc:
        logger.error(f"Erro critico: {exc}")
        db_manager.log_event("CRITICAL", "Main", f"Erro critico: {exc}")
        runtime_snapshot["status"] = "error"
        runtime_snapshot["updated_at"] = datetime.now().isoformat(timespec="seconds")
        append_runtime_event(runtime_snapshot, "SYSTEM", f"Erro critico: {exc}", "CRITICAL")
        write_runtime_snapshot(runtime_snapshot)
    finally:
        if runtime_snapshot.get("status") == "running":
            runtime_snapshot["status"] = "stopped"
            runtime_snapshot["updated_at"] = datetime.now().isoformat(timespec="seconds")
            append_runtime_event(runtime_snapshot, "SYSTEM", "Robo finalizado.", "INFO")
            write_runtime_snapshot(runtime_snapshot)
        conn.disconnect()


if __name__ == "__main__":
    main()
