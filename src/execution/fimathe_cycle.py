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
        "projection_90": _to_float(raw.get("projection_90")),
        "projection_95": _to_float(raw.get("projection_95")),
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
    if str(top_level) == "95":
        return context.get("projection_95")
    if str(top_level) == "90":
        return context.get("projection_90")
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


def _calc_infinite_step_sl(side, context, open_price, run_percent, step_percent, buffer_points, point):
    """
    Calcula o SL para o modo Infinity baseado em níveis de expansão (ex: a cada 100%).
    """
    # Quantos passos cheios o preço já andou?
    steps_count = int(run_percent // step_percent)
    if steps_count < 1:
        return None  # Ainda não atingiu o primeiro passo de lucro além do BE

    # O Stop deve ser colocado no nível anterior ao que o preço está agora
    # Ex: se preço está no nível 2 (200%), SL vai para o nível 1 (100%)
    target_profit_percent = (steps_count - 1) * step_percent
    
    # Se steps_count for 1 (atingiu 100%), o target seria 0% (Break-even), 
    # mas o BE já é tratado separadamente pelo perdeu_50 (trigger manual).
    
    # Calculando o preço do nível alvo
    point_a = context.get("point_a", 0)
    point_b = context.get("point_b", 0)
    channel_size = abs(point_a - point_b)
    
    if side == "BUY":
        level_price = open_price + (channel_size * (target_profit_percent / 100.0))
        return level_price - (buffer_points * point)
    else:
        level_price = open_price - (channel_size * (target_profit_percent / 100.0))
        return level_price + (buffer_points * point)


def evaluate_fimathe_cycle_event(side, current_price, open_price, context, state, config, point):
    """
    Avalia eventos FIM-010/017/018:
    - Conservador: Trava no BE (FIM-017)
    - Infinity: Arraste nível a nível (FIM-018)
    """
    context = normalize_cycle_context(context)
    state = initialize_cycle_state(side, open_price, current_price, state=state)

    current_price = _to_float(current_price, state["previous_price"])
    open_price = _to_float(open_price, current_price)
    point = max(_to_float(point, 0.00001), 0.00000001)

    # Configurações de Modo
    mode = config.get("fimathe_management_mode", "standard").lower() # standard, conservative, infinity
    be_trigger_percent = _to_float(config.get("fimathe_be_trigger_percent", 50), 50.0)
    trail_step_percent = _to_float(config.get("fimathe_trail_step_percent", 100), 100.0)
    
    top_level = str(config.get("fimathe_cycle_top_level", "80"))
    top_retrace_points = max(1.0, _to_float(config.get("fimathe_cycle_top_retrace_points", 45), 45.0))
    min_profit_points = max(1.0, _to_float(config.get("fimathe_cycle_min_profit_points", 80), 80.0))
    protection_buffer_points = max(0.0, _to_float(config.get("fimathe_cycle_protection_buffer_points", 12), 12.0))
    breakeven_offset_points = max(0.0, _to_float(config.get("fimathe_cycle_breakeven_offset_points", 0), 0.0))

    previous_price = _to_float(state.get("previous_price"), current_price)

    state["high_watermark"] = max(_to_float(state.get("high_watermark"), current_price), current_price)
    state["low_watermark"] = min(_to_float(state.get("low_watermark"), current_price), current_price)

    projection_50 = context.get("projection_50")
    projection_100 = context.get("projection_100")
    top_reference = _top_reference(context, top_level)
    
    # Cálculo de Canal (Base para porcentagens)
    point_a = context.get("point_a", 0)
    point_b = context.get("point_b", 0)
    channel_size = abs(point_a - point_b) or 0.00001

    if side == "BUY":
        state["reached_50"] = bool(state.get("reached_50")) or (projection_50 is not None and state["high_watermark"] >= projection_50)
        state["reached_100"] = bool(state.get("reached_100")) or (projection_100 is not None and state["high_watermark"] >= projection_100)
        run_points = (state["high_watermark"] - open_price) / point
        run_percent = ((state["high_watermark"] - open_price) / channel_size) * 100.0 if channel_size > 0 else 0
        retrace_points = (state["high_watermark"] - current_price) / point
        reached_be_trigger = run_percent >= be_trigger_percent
        reached_top_ref = top_reference is not None and state["high_watermark"] >= top_reference
    else:
        state["reached_50"] = bool(state.get("reached_50")) or (projection_50 is not None and state["low_watermark"] <= projection_50)
        state["reached_100"] = bool(state.get("reached_100")) or (projection_100 is not None and state["low_watermark"] <= projection_100)
        run_points = (open_price - state["low_watermark"]) / point
        run_percent = ((open_price - state["low_watermark"]) / channel_size) * 100.0 if channel_size > 0 else 0
        retrace_points = (current_price - state["low_watermark"]) / point
        reached_be_trigger = run_percent >= be_trigger_percent
        reached_top_ref = top_reference is not None and state["low_watermark"] <= top_reference

    fallback_sl = _calc_breakeven_sl(side, open_price, breakeven_offset_points, point)
    action = None

    # LÓGICA DE GESTÃO POR MODO
    
    # 0) MODO CONSERVADOR (FIM-017) - Trava no BE e para tudo
    if mode == "conservative":
        if not state.get("moved_on_50") and reached_be_trigger:
            action = {
                "event": "perdeu_50",
                "rule_id": "FIM-017",
                "candidate_sl": fallback_sl,
                "note": f"Modo Conservador: Lucro atingiu {be_trigger_percent}%. Stop travado no Break-even.",
            }
            state["moved_on_50"] = True
            state["last_event"] = action["event"]
        # Não faz mais nada se for conservador

    # 1) MODO INFINITY (FIM-018) - Arraste perpétuo
    elif mode == "infinity":
        # Passo 1: Break-even inicial
        if not state.get("moved_on_50") and reached_be_trigger:
            action = {
                "event": "perdeu_50",
                "rule_id": "FIM-018",
                "candidate_sl": fallback_sl,
                "note": f"Infinity: Gatilho de {be_trigger_percent}% atingido. Iniciando protecao 0x0.",
            }
            state["moved_on_50"] = True
            state["last_event"] = action["event"]
        
        # Passo 2: Arraste por níveis (somente se já passou do primeiro passo de arraste)
        elif state.get("moved_on_50"):
            candidate_sl = _calc_infinite_step_sl(side, context, open_price, run_percent, trail_step_percent, protection_buffer_points, point)
            
            # Só move se o novo SL for melhor que o atual no estado (ou inicial)
            current_sl_in_state = state.get("last_sl_value", fallback_sl)
            is_better = False
            if candidate_sl is not None:
                if side == "BUY": is_better = candidate_sl > current_sl_in_state + (5 * point)
                else: is_better = candidate_sl < current_sl_in_state - (5 * point)
            
            if is_better:
                action = {
                    "event": "perdeu_100", # Reutilizamos o evento 100 para arraste de lucro
                    "rule_id": "FIM-018",
                    "candidate_sl": candidate_sl,
                    "note": f"Infinity: Preco avancou {int(run_percent)}%. Arrastando stop para o nivel anterior.",
                }
                state["moved_on_100"] = True
                state["last_sl_value"] = candidate_sl
                state["last_event"] = action["event"]

    # 2) MODO PADRÃO (Legado/Standard)
    else:
        # Atingiu 100% da projeção (Lock Profit)
        if not state.get("moved_on_100") and projection_100 is not None and (state.get("reached_100") or run_points >= 200): # 200 pts ou proj
            action = {
                "event": "perdeu_100",
                "rule_id": "FIM-010",
                "candidate_sl": _calc_event_100_sl(side, context, fallback_sl, protection_buffer_points, point),
                "note": "Atingiu alvo de 100%. Stop movido para travar 50% de lucro.",
            }
            state["moved_on_100"] = True
            state["moved_on_50"] = True
            state["last_event"] = action["event"]
        
        # Atingiu 50% da projeção (Break-even)
        elif not state.get("moved_on_50") and (projection_50 is not None and (state.get("reached_50") or run_points >= 100)):
            action = {
                "event": "perdeu_50",
                "rule_id": "FIM-010",
                "candidate_sl": _calc_event_50_sl(side, context, fallback_sl, protection_buffer_points, point),
                "note": "Atingiu 50% da projecao. Stop movido para Break-even.",
            }
            state["moved_on_50"] = True
            state["last_event"] = action["event"]

        # Perdeu Topo (Retratação)
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
