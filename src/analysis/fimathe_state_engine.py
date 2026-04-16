import logging

logger = logging.getLogger("FimatheStateEngine")

def resolve_rule_meta(reason, signal=None):
    """Mapeia o motivo de bloqueio ou sinal para metadados da regra Fimathe."""
    mapping = {
        "setup_pronto": (
            "FIM-008",
            "Confluencia valida",
            "Executar entrada com risco controlado.",
        ),
        "sem_dados_timeframe": (
            "FIM-001",
            "Coleta de dados",
            "Aguardar mais candles no timeframe maior e menor.",
        ),
        "mercado_lateral": (
            "FIM-002",
            "Classificacao de mercado",
            "Aguardar tendencia clara para liberar operacao.",
        ),
        "sem_regiao_ab": (
            "FIM-003",
            "Regiao A/B",
            "Aguardar consolidacao valida para marcar ponto-A e ponto-B.",
        ),
        "fora_da_regiao_negociavel": (
            "FIM-005",
            "Regiao negociavel",
            "Aguardar preco voltar para regiao A/B ou projecoes 50-100.",
        ),
        "aguardando_agrupamento": (
            "FIM-006",
            "Agrupamento",
            "Aguardar consolidacao no timeframe menor.",
        ),
        "aguardando_rompimento_canal": (
            "FIM-007",
            "Rompimento Canal",
            "Aguardar rompimento do canal com buffer tecnico.",
        ),
        "aguardando_pullback": (
            "FIM-011",
            "Reteste (Pullback)",
            "Aguardar pullback/reteste dentro da tolerancia.",
        ),
        "longe_do_nivel_sr": (
            "FIM-008",
            "Regra anti-achometro",
            "Aguardar toque/regiao S-R para completar confluencia.",
        ),
        "spread_alto": (
            "FIM-009",
            "Filtro de execucao",
            "Spread atual acima do limite configurado.",
        ),
    }

    default_meta = ("FIM-014", "Transparencia operacional", "Monitorar proximo gatilho tecnico.")
    rule_id, rule_name, next_trigger = mapping.get(reason, default_meta)
    
    # Se houver sinal, sobrescrevemos para setup_pronto
    if signal:
        rule_id, rule_name, next_trigger = mapping["setup_pronto"]
        
    return {
        "rule_id": rule_id,
        "rule_name": rule_name,
        "next_trigger": next_trigger,
    }

def evaluate_state_machine(technicals, settings):
    """
    Maquina de estados Fimathe.
    Recebe insumos tecnicos e retorna decisao de estado/sinal.
    """
    # Initialize rule trace with default visibility based on settings
    require_grouping = settings.get("require_grouping", True)
    require_sr_touch = settings.get("require_sr_touch", True)
    require_breakout = settings.get("require_channel_break", True)
    require_pullback = settings.get("require_pullback_retest", True)
    max_spread = float(settings.get("max_spread_points", 0))

    def get_rule_status(is_ok, is_required):
        if not is_required:
            return "desativado"
        return "ok" if is_ok else "bloqueado"

    rule_trace = {
        "FIM-001": "pendente",
        "FIM-002": "pendente",
        "FIM-003": "pendente",
        "FIM-004": "ok", # Referencia temporal
        "FIM-005": "pendente",
        "FIM-006": "desativado" if not require_grouping else "pendente",
        "FIM-007": "desativado" if not require_breakout else "pendente",
        "FIM-011": "desativado" if not require_pullback else "pendente",
        "FIM-008": "desativado" if not require_sr_touch else "pendente",
        "FIM-009": "desativado" if max_spread <= 0 else "pendente",
    }

    # 1. Check data availability
    data_ok = technicals.get("data_ok", False)
    rule_trace["FIM-001"] = "ok" if data_ok else "bloqueado"
    if not data_ok:
        reason = "sem_dados_timeframe"
        return {
            "signal": None,
            "reason": reason,
            "rule_trace": rule_trace,
            **resolve_rule_meta(reason)
        }

    # 2. Check trend
    trend_direction = technicals.get("trend_direction")
    rule_trace["FIM-002"] = "ok" if trend_direction else "bloqueado_lateral"
    if trend_direction is None:
        reason = "mercado_lateral"
        return {
            "signal": None,
            "reason": reason,
            "rule_trace": rule_trace,
            **resolve_rule_meta(reason)
        }

    # 3. Check A/B Region
    ab_ok = technicals.get("ab_ok", False)
    rule_trace["FIM-003"] = "ok" if ab_ok else "bloqueado"
    if not ab_ok:
        reason = "sem_regiao_ab"
        return {
            "signal": None,
            "reason": reason,
            "rule_trace": rule_trace,
            **resolve_rule_meta(reason)
        }

    # 4. Negotiable Region Check (A/B or Projections)
    near_trade_region = technicals.get("near_trade_region", False)
    rule_trace["FIM-005"] = "ok" if near_trade_region else "bloqueado"
    
    if not near_trade_region:
        reason = "fora_da_regiao_negociavel"
        return {
            "signal": None,
            "reason": reason,
            "rule_trace": rule_trace,
            **resolve_rule_meta(reason)
        }

    # 5. Grouping Check
    grouping_ok = technicals.get("grouping_ok", False)
    rule_trace["FIM-006"] = get_rule_status(grouping_ok, require_grouping)
    
    if require_grouping and not grouping_ok:
        reason = "aguardando_agrupamento"
        return {
            "signal": None,
            "reason": reason,
            "rule_trace": rule_trace,
            **resolve_rule_meta(reason)
        }

    # 6. Spread Check (FIM-009)
    current_spread = float(technicals.get("current_spread", 0))
    spread_ok = (max_spread <= 0 or current_spread <= max_spread)
    rule_trace["FIM-009"] = get_rule_status(spread_ok, max_spread > 0)
    
    if max_spread > 0 and not spread_ok:
        reason = "spread_alto"
        return {
            "signal": None,
            "reason": reason,
            "rule_trace": rule_trace,
            **resolve_rule_meta(reason)
        }

    # 7. Breakout Check (FIM-007)
    breakout_ok = technicals.get("breakout_ok", True)
    rule_trace["FIM-007"] = get_rule_status(breakout_ok, require_breakout)
    if require_breakout and not breakout_ok:
        reason = "aguardando_rompimento_canal"
        return {
            "signal": None,
            "reason": reason,
            "rule_trace": rule_trace,
            **resolve_rule_meta(reason)
        }

    # 7b. Pullback Check (FIM-011)
    pullback_ok = technicals.get("pullback_ok", True)
    rule_trace["FIM-011"] = get_rule_status(pullback_ok, require_pullback)
    if require_pullback and not pullback_ok:
        reason = "aguardando_pullback"
        return {
            "signal": None,
            "reason": reason,
            "rule_trace": rule_trace,
            **resolve_rule_meta(reason)
        }

    # 7. S/R Proximity Check (FIM-008)
    near_sr = technicals.get("near_sr", False)
    rule_trace["FIM-008"] = get_rule_status(near_sr, require_sr_touch)
    
    if require_sr_touch and not near_sr:
        reason = "longe_do_nivel_sr"
        return {
            "signal": None,
            "reason": reason,
            "rule_trace": rule_trace,
            **resolve_rule_meta(reason)
        }

    # 8. Setup Ready
    signal = technicals.get("candidate_signal")
    reason = "setup_pronto"
    
    return {
        "signal": signal,
        "reason": reason,
        "rule_trace": rule_trace,
        **resolve_rule_meta(reason, signal=signal)
    }
