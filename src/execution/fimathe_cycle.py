def _to_float(value, default=None):
    try:
        return float(value)
    except Exception:
        return default


def normalize_cycle_context(raw):
    raw = raw or {}
    return {
        "point_a": _to_float(raw.get("point_a")),
        "point_b": _to_float(raw.get("point_b")),
        "projection_50": _to_float(raw.get("projection_50")),
        "projection_80": _to_float(raw.get("projection_80")),
        "projection_85": _to_float(raw.get("projection_85")),
        "projection_100": _to_float(raw.get("projection_100")),
    }


def initialize_cycle_state(side, open_price, current_price, state=None):
    if isinstance(state, dict):
        base = dict(state)
    else:
        base = {}

    open_price = _to_float(open_price, _to_float(current_price, 0.0))
    current_price = _to_float(current_price, open_price)

    base.setdefault("side", side)
    base.setdefault("previous_price", current_price)
    base.setdefault("high_watermark", max(open_price, current_price))
    base.setdefault("low_watermark", min(open_price, current_price))
    base.setdefault("moved_on_top", False)
    base.setdefault("moved_on_50", False)
    base.setdefault("moved_on_100", False)
    base.setdefault("reached_50", False)
    base.setdefault("reached_100", False)
    base.setdefault("last_event", None)
    return base


def _crossed_back_from_level(side, previous_price, current_price, level):
    if level is None:
        return False
    if side == "BUY":
        return previous_price >= level and current_price < level
    return previous_price <= level and current_price > level


def _top_reference(context, top_level):
    if str(top_level) == "100":
        return context.get("projection_100")
    if str(top_level) == "85":
        return context.get("projection_85")
    return context.get("projection_80")


def _calc_breakeven_sl(side, open_price, offset_points, point):
    if side == "BUY":
        return open_price + (offset_points * point)
    return open_price - (offset_points * point)


def _calc_event_50_sl(side, context, fallback_sl, buffer_points, point):
    if side == "BUY":
        point_a = context.get("point_a")
        if point_a is not None:
            return point_a - (buffer_points * point)
        return fallback_sl

    point_b = context.get("point_b")
    if point_b is not None:
        return point_b + (buffer_points * point)
    return fallback_sl


def _calc_event_100_sl(side, context, fallback_sl, buffer_points, point):
    projection_50 = context.get("projection_50")
    if projection_50 is None:
        return fallback_sl
    if side == "BUY":
        return projection_50 - (buffer_points * point)
    return projection_50 + (buffer_points * point)


def _build_next_trigger(side, context, state):
    projection_50 = context.get("projection_50")
    projection_100 = context.get("projection_100")
    if not state.get("moved_on_top"):
        return "Perder topo da expansao para mover stop de protecao."
    if not state.get("moved_on_50") and projection_50 is not None:
        return "Perder o nivel de 50% para subir protecao do stop."
    if not state.get("moved_on_100") and projection_100 is not None:
        return "Perder o nivel de 100% para mover stop novamente."
    if side == "BUY":
        return "Gestao concluida: proteger stop sem devolver lucro."
    return "Gestao concluida: proteger stop sem devolver lucro."


def evaluate_fimathe_cycle_event(side, current_price, open_price, context, state, config, point):
    """
    Avalia eventos FIM-010 de forma deterministica:
    - perdeu_topo
    - perdeu_50
    - perdeu_100
    """
    context = normalize_cycle_context(context)
    state = initialize_cycle_state(side, open_price, current_price, state=state)

    current_price = _to_float(current_price, state["previous_price"])
    open_price = _to_float(open_price, current_price)
    point = max(_to_float(point, 0.00001), 0.00000001)

    top_level = str(config.get("fimathe_cycle_top_level", "80"))
    top_retrace_points = max(1.0, _to_float(config.get("fimathe_cycle_top_retrace_points", 45), 45.0))
    min_profit_points = max(1.0, _to_float(config.get("fimathe_cycle_min_profit_points", 80), 80.0))
    protection_buffer_points = max(1.0, _to_float(config.get("fimathe_cycle_protection_buffer_points", 12), 12.0))
    breakeven_offset_points = max(0.0, _to_float(config.get("fimathe_cycle_breakeven_offset_points", 5), 5.0))

    previous_price = _to_float(state.get("previous_price"), current_price)

    state["high_watermark"] = max(_to_float(state.get("high_watermark"), current_price), current_price)
    state["low_watermark"] = min(_to_float(state.get("low_watermark"), current_price), current_price)

    projection_50 = context.get("projection_50")
    projection_100 = context.get("projection_100")
    top_reference = _top_reference(context, top_level)

    if side == "BUY":
        state["reached_50"] = bool(state.get("reached_50")) or (projection_50 is not None and state["high_watermark"] >= projection_50)
        state["reached_100"] = bool(state.get("reached_100")) or (projection_100 is not None and state["high_watermark"] >= projection_100)
        retrace_points = (state["high_watermark"] - current_price) / point
        run_points = (state["high_watermark"] - open_price) / point
        reached_top_ref = top_reference is not None and state["high_watermark"] >= top_reference
    else:
        state["reached_50"] = bool(state.get("reached_50")) or (projection_50 is not None and state["low_watermark"] <= projection_50)
        state["reached_100"] = bool(state.get("reached_100")) or (projection_100 is not None and state["low_watermark"] <= projection_100)
        retrace_points = (current_price - state["low_watermark"]) / point
        run_points = (open_price - state["low_watermark"]) / point
        reached_top_ref = top_reference is not None and state["low_watermark"] <= top_reference

    fallback_sl = _calc_breakeven_sl(side, open_price, breakeven_offset_points, point)
    action = None

    # 1) Perdeu 100% (Proativo: atingiu o nível de 100% da projeção)
    # Maior nível de proteção primeiro
    if (
        not state.get("moved_on_100")
        and projection_100 is not None
        and state.get("reached_100")
    ):
        action = {
            "event": "perdeu_100",
            "rule_id": "FIM-010",
            "candidate_sl": _calc_event_100_sl(side, context, fallback_sl, protection_buffer_points, point),
            "note": "Atingiu 100% da projecao. Stop movido para travar lucro nos 50%.",
        }
        state["moved_on_100"] = True
        state["moved_on_50"] = True  # Marca 50 como movido tambem
        state["last_event"] = action["event"]

    # 2) Perdeu 50% (Proativo: atingiu o nível de 50% da projeção)
    elif (
        not state.get("moved_on_50")
        and projection_50 is not None
        and state.get("reached_50")
    ):
        action = {
            "event": "perdeu_50",
            "rule_id": "FIM-010",
            "candidate_sl": _calc_event_50_sl(side, context, fallback_sl, protection_buffer_points, point),
            "note": "Atingiu 50% da projecao. Stop movido para Break-even.",
        }
        state["moved_on_50"] = True
        state["last_event"] = action["event"]

    # 3) Perdeu Topo (Retratação do Topo)
    # Deixamos por ultimo pois BE/Lock sao mais importantes se as condicoes coincidirem
    elif not state.get("moved_on_top") and reached_top_ref and run_points >= min_profit_points and retrace_points >= top_retrace_points:
        action = {
            "event": "perdeu_topo",
            "rule_id": "FIM-010",
            "candidate_sl": fallback_sl,
            "note": "Perdeu topo da expansao. Stop movido para zona de protecao.",
        }
        state["moved_on_top"] = True
        state["last_event"] = action["event"]

    state["previous_price"] = current_price
    next_trigger = _build_next_trigger(side, context, state)
    return {"action": action, "state": state, "next_trigger": next_trigger}
