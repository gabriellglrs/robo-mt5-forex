import sys
from unittest.mock import MagicMock

# Global Mock para MetaTrader5 (necessário antes de importar src)
mock_mt5_sys = MagicMock()
sys.modules["MetaTrader5"] = mock_mt5_sys

import pytest
from src.execution.risk import RiskManager
from src.execution.fimathe_cycle import evaluate_fimathe_cycle_event, initialize_cycle_state

@pytest.fixture
def mock_mt5(monkeypatch):
    mock = MagicMock()
    # Simular EURUSD 5 casas decimais
    symbol_info = MagicMock()
    symbol_info.point = 0.00001
    symbol_info.trade_tick_value = 1.0
    symbol_info.trade_tick_size = 0.00001
    symbol_info.volume_min = 0.01
    symbol_info.volume_step = 0.01
    mock.symbol_info.return_value = symbol_info
    
    account_info = MagicMock()
    account_info.balance = 10000.0
    mock.account_info.return_value = account_info
    
    monkeypatch.setattr("src.execution.risk.mt5", mock)
    return mock

def test_compliance_pagina_10_risk_limit(mock_mt5):
    """Página 10: Garantir limite máximo de 3% de risco por operação."""
    settings = {
        "lot_mode": "risk_percent",
        "risk_percentage": 5.0, # Usuário tentando 5%
        "risk_max_per_trade_percent": 3.0 # Limite do Manual / Hard Limit
    }
    rm = RiskManager("EURUSD", settings)
    
    # 300 pontos de stop = 0.00300
    sl_dist = 0.00300
    lot = rm.calculate_lot(sl_dist)
    
    # Risco de 3% de 10k = 300$
    # Perda por lote (0.01) = 300 pontos * 1$ (tick_value) = 3$ (aproximadamente)
    # 1.0 lote = 100 * 3$ = 300$.
    # Então 3% de 10k com 300 pontos de SL deve ser ~1.0 lote.
    # Se fosse 5%, seria ~1.66 lote.
    
    assert lot <= 1.01 # Garante que o clamp funcionou no limite de 3%
    print(f"Lote calculado com trava de 3%: {lot}")

def test_compliance_pagina_6_7_stop_movement_buy(mock_mt5):
    """Página 6/7: Trail Stop BE em 50% e Lock em 100%."""
    config = {
        "fimathe_cycle_top_level": "80",
        "fimathe_cycle_top_retrace_points": 45,
        "fimathe_cycle_min_profit_points": 80,
    }
    
    # Setup de Níveis Fimathe
    context = {
        "point_a": 1.08500,
        "point_b": 1.08000,
        "projection_50": 1.08750, # 50% de projeção
        "projection_100": 1.09000, # 100% de projeção
    }
    
    point = 0.00001
    open_price = 1.08510 # Entrada logo após ponto_a
    state = initialize_cycle_state("BUY", open_price, open_price)
    
    # Cenário 1: Preço sobe até 40% da projeção (Nenhum gatilho)
    res = evaluate_fimathe_cycle_event("BUY", 1.08600, open_price, context, state, config, point)
    assert res["action"] is None
    
    # Cenário 2: Preço atinge 50% da projeção (Gatilho: perdeu_50 -> BE)
    res = evaluate_fimathe_cycle_event("BUY", 1.08760, open_price, context, res["state"], config, point)
    assert res["action"]["event"] == "perdeu_50"
    # SL deve ser ponto_a - buffer (Página 7)
    assert res["action"]["candidate_sl"] < 1.08510 
    
    # Cenário 3: Preço atinge 100% da projeção (Gatilho: perdeu_100 -> Lock Profit)
    res = evaluate_fimathe_cycle_event("BUY", 1.09010, open_price, context, res["state"], config, point)
    assert res["action"]["event"] == "perdeu_100"
    # SL deve ser ~projection_50 (Travando metade do lucro conforme Página 6/153)
    assert res["action"]["candidate_sl"] > 1.08700

def test_compliance_pagina_10_tp_exhaustion(mock_mt5):
    """Página 10: Alvo dinâmico entre 80-100% da expansão."""
    details = {
        "point_a": 1.08500,
        "point_b": 1.08000,
        "projection_80": 1.08900,
        "projection_85": 1.08925,
        "projection_100": 1.09000
    }
    
    # Teste 1: Alvo padrão (80%)
    rm_default = RiskManager("EURUSD", {"sl_tp_mode": "fimathe"})
    sl, tp = rm_default.calculate_prices("BUY", 1.08510, signal_details=details)
    assert tp == 1.08900
    
    # Teste 2: Alvo de Exaustão (85% conforme Página 10/295)
    rm_exhaustion = RiskManager("EURUSD", {"sl_tp_mode": "fimathe", "fimathe_target_level": "85"})
    sl, tp = rm_exhaustion.calculate_prices("BUY", 1.08510, signal_details=details)
    assert tp == 1.08925
