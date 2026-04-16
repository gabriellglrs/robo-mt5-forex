from src.analysis.fimathe_state_engine import evaluate_state_machine, resolve_rule_meta

def test_resolve_rule_meta():
    res = resolve_rule_meta("setup_pronto")
    assert res["rule_id"] == "FIM-008"
    
    res = resolve_rule_meta("mercado_lateral")
    assert res["rule_id"] == "FIM-002"
    
    res = resolve_rule_meta("unknown_reason")
    assert res["rule_id"] == "FIM-014"
    
    # Check signal override
    res = resolve_rule_meta("longe_do_nivel_sr", signal="BUY")
    assert res["rule_id"] == "FIM-008"

def test_state_machine_no_data():
    techs = {"data_ok": False}
    res = evaluate_state_machine(techs, {})
    assert res["signal"] is None
    assert res["reason"] == "sem_dados_timeframe"
    assert res["rule_id"] == "FIM-001"
    assert res["rule_trace"]["FIM-001"] == "bloqueado"

def test_state_machine_lateral():
    techs = {"data_ok": True, "trend_direction": None}
    res = evaluate_state_machine(techs, {})
    assert res["signal"] is None
    assert res["reason"] == "mercado_lateral"
    assert res["rule_id"] == "FIM-002"
    assert res["rule_trace"]["FIM-002"] == "bloqueado_lateral"

def test_state_machine_no_ab():
    techs = {"data_ok": True, "trend_direction": "BUY", "ab_ok": False}
    res = evaluate_state_machine(techs, {})
    assert res["signal"] is None
    assert res["reason"] == "sem_regiao_ab"
    assert res["rule_id"] == "FIM-003"

def test_state_machine_out_of_region():
    techs = {
        "data_ok": True,
        "trend_direction": "BUY",
        "ab_ok": True,
        "near_trade_region": False
    }
    res = evaluate_state_machine(techs, {})
    assert res["signal"] is None
    assert res["reason"] == "fora_da_regiao_negociavel"
    assert res["rule_id"] == "FIM-005"
    assert res["rule_trace"]["FIM-005"] == "bloqueado"

def test_state_machine_no_grouping():
    techs = {
        "data_ok": True,
        "trend_direction": "BUY",
        "ab_ok": True,
        "near_trade_region": True,
        "grouping_ok": False
    }
    # With requirement
    res = evaluate_state_machine(techs, {"require_grouping": True})
    assert res["reason"] == "aguardando_agrupamento"
    assert res["rule_id"] == "FIM-006"
    assert res["rule_trace"]["FIM-006"] == "bloqueado"
    
    # Without requirement
    # Note: it will likely fail on the next block (breakout) if not provided
    # Let's provide breakout_ok=True, pullback_ok=True, near_sr=True to isolate
    techs.update({"breakout_ok": True, "pullback_ok": True, "near_sr": True, "candidate_signal": "BUY"})
    res = evaluate_state_machine(techs, {"require_grouping": False})
    assert res["reason"] == "setup_pronto"
    assert res["signal"] == "BUY"
    assert res["rule_trace"]["FIM-006"] == "ok"

def test_state_machine_no_breakout():
    techs = {
        "data_ok": True,
        "trend_direction": "BUY",
        "ab_ok": True,
        "near_trade_region": True,
        "grouping_ok": True,
        "breakout_ok": False
    }
    res = evaluate_state_machine(techs, {})
    assert res["reason"] == "aguardando_rompimento_canal"
    assert res["rule_id"] == "FIM-007"
    assert res["rule_trace"]["FIM-007"] == "bloqueado"

def test_state_machine_no_pullback():
    techs = {
        "data_ok": True,
        "trend_direction": "BUY",
        "ab_ok": True,
        "near_trade_region": True,
        "grouping_ok": True,
        "breakout_ok": True,
        "pullback_ok": False
    }
    res = evaluate_state_machine(techs, {})
    assert res["reason"] == "aguardando_pullback"
    assert res["rule_id"] == "FIM-007"

def test_state_machine_far_from_sr():
    techs = {
        "data_ok": True,
        "trend_direction": "BUY",
        "ab_ok": True,
        "near_trade_region": True,
        "grouping_ok": True,
        "breakout_ok": True,
        "pullback_ok": True,
        "near_sr": False
    }
    # With requirement
    res = evaluate_state_machine(techs, {"require_sr_touch": True})
    assert res["reason"] == "longe_do_nivel_sr"
    assert res["rule_id"] == "FIM-008"
    assert res["rule_trace"]["FIM-008"] == "bloqueado"
    
    # Without requirement
    techs["candidate_signal"] = "BUY"
    res = evaluate_state_machine(techs, {"require_sr_touch": False})
    assert res["reason"] == "setup_pronto"
    assert res["signal"] == "BUY"

def test_state_machine_full_buy():
    techs = {
        "data_ok": True,
        "trend_direction": "BUY",
        "ab_ok": True,
        "near_trade_region": True,
        "grouping_ok": True,
        "breakout_ok": True,
        "pullback_ok": True,
        "near_sr": True,
        "candidate_signal": "BUY"
    }
    res = evaluate_state_machine(techs, {})
    assert res["signal"] == "BUY"
    assert res["reason"] == "setup_pronto"
    assert res["rule_id"] == "FIM-008"
    for rule in ["FIM-001", "FIM-002", "FIM-003", "FIM-004", "FIM-005", "FIM-006", "FIM-007", "FIM-008"]:
        assert res["rule_trace"][rule] == "ok"

def test_state_machine_full_sell():
    techs = {
        "data_ok": True,
        "trend_direction": "SELL",
        "ab_ok": True,
        "near_trade_region": True,
        "grouping_ok": True,
        "breakout_ok": True,
        "pullback_ok": True,
        "near_sr": True,
        "candidate_signal": "SELL"
    }
    res = evaluate_state_machine(techs, {})
    assert res["signal"] == "SELL"
    assert res["reason"] == "setup_pronto"
    assert res["rule_id"] == "FIM-008"
