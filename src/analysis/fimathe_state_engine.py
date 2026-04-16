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
            "Rompimento e reteste",
            "Aguardar rompimento do canal com buffer tecnico.",
        ),
        "aguardando_pullback": (
            "FIM-007",
            "Rompimento e reteste",
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
    # 1. Check data availability
    if not technicals.get("data_ok", False):
        reason = "sem_dados_timeframe"
        return {
            "signal": None,
            "reason": reason,
            "rule_trace": {"FIM-001": "bloqueado"},
            **resolve_rule_meta(reason)
        }

    # 2. Check trend
    trend_direction = technicals.get("trend_direction")
    if trend_direction is None:
        reason = "mercado_lateral"
        return {
            "signal": None,
            "reason": reason,
            "rule_trace": {
                "FIM-001": "ok",
                "FIM-002": "bloqueado_lateral",
            },
            **resolve_rule_meta(reason)
        }

    # 3. Check A/B Region
    if not technicals.get("ab_ok", False):
        reason = "sem_regiao_ab"
        return {
            "signal": None,
            "reason": reason,
            "rule_trace": {
                "FIM-001": "ok",
                "FIM-002": "ok",
                "FIM-003": "bloqueado",
            },
            **resolve_rule_meta(reason)
        }
 
    # 4. Negotiable Region Check (A/B or Projections)
    near_trade_region = technicals.get("near_trade_region", False)
    rule_trace = {
        "FIM-001": "ok",
        "FIM-002": "ok",
        "FIM-003": "ok",
        "FIM-004": "ok",
        "FIM-005": "ok" if near_trade_region else "bloqueado",
    }

    if not near_trade_region:
        reason = "fora_da_regiao_negociavel"
        rule_trace["FIM-008"] = "bloqueado"
        return {
            "signal": None,
            "reason": reason,
            "rule_trace": rule_trace,
            **resolve_rule_meta(reason)
        }

    # 5. Grouping Check
    require_grouping = settings.get("require_grouping", True)
    grouping_ok = technicals.get("grouping_ok", False)
    
    rule_trace["FIM-006"] = "ok" if (grouping_ok or not require_grouping) else "bloqueado"
    if require_grouping and not grouping_ok:
        reason = "aguardando_agrupamento"
        rule_trace["FIM-008"] = "bloqueado"
        return {
            "signal": None,
            "reason": reason,
            "rule_trace": rule_trace,
            **resolve_rule_meta(reason)
        }

    # 6. Spread Check (FIM-009)
    max_spread = float(settings.get("max_spread_points", 0))
    current_spread = float(technicals.get("current_spread", 0))
    if max_spread > 0 and current_spread > max_spread:
        reason = "spread_alto"
        rule_trace["FIM-009"] = "bloqueado"
        return {
            "signal": None,
            "reason": reason,
            "rule_trace": rule_trace,
            **resolve_rule_meta(reason)
        }
    rule_trace["FIM-009"] = "ok"

    # 7. Breakout and Pullback Check (FIM-007)
    breakout_ok = technicals.get("breakout_ok", True)
    pullback_ok = technicals.get("pullback_ok", True)
    
    rule_trace["FIM-007"] = "ok" if (breakout_ok and pullback_ok) else "bloqueado"
    
    if not breakout_ok:
        reason = "aguardando_rompimento_canal"
        rule_trace["FIM-008"] = "bloqueado"
        return {
            "signal": None,
            "reason": reason,
            "rule_trace": rule_trace,
            **resolve_rule_meta(reason)
        }

    if not pullback_ok:
        reason = "aguardando_pullback"
        rule_trace["FIM-008"] = "bloqueado"
        return {
            "signal": None,
            "reason": reason,
            "rule_trace": rule_trace,
            **resolve_rule_meta(reason)
        }

    # 7. S/R Proximity Check (FIM-008)
    require_sr_touch = settings.get("require_sr_touch", True)
    near_sr = technicals.get("near_sr", False)
    
    if require_sr_touch and not near_sr:
        reason = "longe_do_nivel_sr"
        rule_trace["FIM-008"] = "bloqueado"
        return {
            "signal": None,
            "reason": reason,
            "rule_trace": rule_trace,
            **resolve_rule_meta(reason)
        }

    # 8. Setup Ready
    signal = technicals.get("candidate_signal")
    reason = "setup_pronto"
    rule_trace["FIM-008"] = "ok"
    
    return {
        "signal": signal,
        "reason": reason,
        "rule_trace": rule_trace,
        **resolve_rule_meta(reason, signal=signal)
    }
