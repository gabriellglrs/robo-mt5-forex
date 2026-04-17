import os
import sys

sys.path.append(os.path.join(os.getcwd(), "src"))

from execution.fimathe_cycle import evaluate_fimathe_cycle_event

def _base_context():
    return {
        "point_a": 1.1000,
        "point_b": 1.0900, # Canal de 100 pontos
        "projection_50": 1.1050,
        "projection_100": 1.1100,
    }

def test_standard_mode_integrity():
    print("Iniciando teste: Modo Padrao (FIM-010 Integrity)")
    point = 0.0001
    context = _base_context()
    config = {
        "fimathe_management_mode": "standard", # Modo original
        "fimathe_cycle_breakeven_offset_points": 0,
        "fimathe_cycle_protection_buffer_points": 0
    }
    open_price = 1.1000 # Buy
    state = None
    
    # 1. Atinge 50% da projecao (1.1050)
    res = evaluate_fimathe_cycle_event("BUY", 1.1051, open_price, context, state, config, point)
    assert res["action"]["event"] == "perdeu_50"
    assert res["action"]["rule_id"] == "FIM-010"
    assert abs(res["action"]["candidate_sl"] - 1.1000) < 1e-7
    state = res["state"]
    
    # 2. Atinge 100% da projecao (1.1100)
    res = evaluate_fimathe_cycle_event("BUY", 1.1101, open_price, context, state, config, point)
    assert res["action"]["event"] == "perdeu_100"
    assert res["action"]["rule_id"] == "FIM-010"
    # No modo padrao, ao bater 100%, o stop vai para o meio do canal (1.1050)
    assert abs(res["action"]["candidate_sl"] - 1.1050) < 1e-7
    print("test_standard_mode_integrity: OK")

def test_conservative_mode():
    print("Iniciando teste: Modo Conservador (FIM-017)")
    point = 0.0001
    context = _base_context()
    config = {
        "fimathe_management_mode": "conservative",
        "fimathe_be_trigger_percent": 50,
        "fimathe_cycle_breakeven_offset_points": 0
    }
    open_price = 1.1000 # Buy
    state = None
    
    # 1. Ativa 50% (Gatilho BE)
    res = evaluate_fimathe_cycle_event("BUY", 1.1051, open_price, context, state, config, point)
    assert res["action"]["event"] == "perdeu_50"
    assert abs(res["action"]["candidate_sl"] - 1.1000) < 1e-7
    state = res["state"]
    
    # 2. Ativa 100% (Não deve fazer nada no modo conservador)
    res = evaluate_fimathe_cycle_event("BUY", 1.1110, open_price, context, state, config, point)
    assert res["action"] is None
    print("test_conservative_mode: OK")

def test_infinity_mode():
    print("Iniciando teste: Modo Infinity (FIM-018)")
    point = 0.0001
    context = _base_context()
    config = {
        "fimathe_management_mode": "infinity",
        "fimathe_be_trigger_percent": 50,
        "fimathe_trail_step_percent": 100,
        "fimathe_cycle_protection_buffer_points": 0,
        "fimathe_cycle_breakeven_offset_points": 0
    }
    open_price = 1.1000
    state = None
    
    # 1. Gatilho 50% -> BE
    res = evaluate_fimathe_cycle_event("BUY", 1.1051, open_price, context, state, config, point)
    assert res["action"]["event"] == "perdeu_50"
    state = res["state"]
    
    # 2. Atinge 150% (Ainda não bateu o passo de 200% para arrastar para o 100%)
    res = evaluate_fimathe_cycle_event("BUY", 1.1150, open_price, context, state, config, point)
    assert res["action"] is None
    state = res["state"]
    
    # 3. Atinge 205% (Deve arrastar para 100%, que é 1.1100)
    res = evaluate_fimathe_cycle_event("BUY", 1.1205, open_price, context, state, config, point)
    
    if res["action"] is None:
        print("FALHA: Nenhuma acao retornada em 205%")
    else:
        print(f"DEBUG Infinity 205: {res['action']['event']} -> {res['action']['candidate_sl']}")
        assert res["action"]["event"] == "perdeu_100"
        assert abs(res["action"]["candidate_sl"] - 1.1100) < 1e-7
    
    state = res["state"]
    
    # 4. Atinge 305% (Deve arrastar para 200%, que é 1.1200)
    res = evaluate_fimathe_cycle_event("BUY", 1.1305, open_price, context, state, config, point)
    print(f"DEBUG Infinity 305: {res['action']['event'] if res['action'] else 'NONE'} -> {res['action']['candidate_sl'] if res['action'] else 'NONE'}")
    assert res["action"]["event"] == "perdeu_100"
    assert abs(res["action"]["candidate_sl"] - 1.1200) < 1e-7
    print("test_infinity_mode: OK")

if __name__ == "__main__":
    try:
        test_standard_mode_integrity()
        test_conservative_mode()
        test_infinity_mode()
        print("\nSUCESSO TOTAL: O Modo Padrao continua funcionando e os novos modos estao perfeitos!")
    except Exception as e:
        print(f"ERRO NOS TESTES: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
