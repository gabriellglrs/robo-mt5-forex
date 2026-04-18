import json
import logging
import os
import pandas as pd
import numpy as np
from datetime import datetime

# Import detector
from analysis.signals import SignalDetector

def run_audit():
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger("StrategyAudit")
    
    logger.info("=== INICIANDO AUDITORIA DE ESTRATEGIA FIMATHE ===")
    
    # 1. Mock Settings e MT5
    import MetaTrader5 as mt5
    from unittest.mock import MagicMock
    mt5.symbol_info = MagicMock(return_value=MagicMock(point=0.00001))
    
    settings = {
        "signal_logic": {
            "trend_min_slope_points": 0.20,
            "breakout_buffer_points": 10,
            "require_channel_break": True,
            "require_grouping": True,
            "grouping_window_candles": 5,
            "grouping_range_max_points": 150,
        },
        "analysis": {
            "ab_lookback_candles": 20,
            "trend_candles": 50
        }
    }
    
    symbol = "EURUSD"
    detector = SignalDetector(symbol, settings["signal_logic"])
    detector.point = 0.00001
    
    # 2. Mock Data: Tendência de Alta seguida de consolidação (Caixote)
    # Vamos simular 50 velas de alta
    base_price = 1.10000
    prices = [base_price + (i * 0.00010) for i in range(50)]
    
    # Consolidação (Agrupamento OK)
    # Preço oscila entre 1.10500 e 1.10550 por 10 velas
    box_low = 1.10500
    box_high = 1.10550
    for i in range(10):
        prices.append(box_low + (0.00005 if i % 2 == 0 else 0.0))
        
    df = pd.DataFrame({
        "close": prices,
        "high": [p + 0.00002 for p in prices],
        "low": [p - 0.00002 for p in prices],
        "open": prices,
        "tick_volume": [100] * len(prices)
    })
    
    # Injetamos o mock de load_rates no detector
    def mock_load_rates(tf, count):
        return df.tail(count)
    
    detector._load_rates = mock_load_rates
    
    logger.info("Testando detecção de Agrupamento e Lock de Box...")
    
    # Primeira iteração: deve detectar agrupamento e TRAVAR o box
    details_1 = detector.evaluate_signal_details(box_high, [])
    logger.info(f"Iteração 1: grouping_ok={details_1.get('grouping_ok')} | box_locked={details_1.get('box_locked')}")
    
    if not details_1.get("box_locked"):
        logger.error("FALHA: O box deveria ter sido travado após agrupamento validado.")
    else:
        logger.info("SUCESSO: Box travado com sucesso.")
        
    # Salva os níveis travados
    locked_a = details_1.get("point_a")
    locked_b = details_1.get("point_b")
    
    # Segunda iteração: Preço expande o canal (faz nova mínima) mas NÃO rompeu ainda
    # Se o bug persistir, o Ponto B vai mudar. Se o fix funcionar, Ponto B continua igual.
    new_low_price = box_low - 0.00005 # Expande um pouco mas abaixo do buffer de breakout
    # Atualiza o DF com a nova vela
    new_candle = {"close": new_low_price, "high": new_low_price + 0.00001, "low": new_low_price - 0.00001, "open": new_low_price}
    df = pd.concat([df, pd.DataFrame([new_candle])], ignore_index=True)
    
    details_2 = detector.evaluate_signal_details(new_low_price, [])
    
    logger.info(f"Iteração 2 (Expansão): Ponto B travado={locked_b} | Ponto B atual={details_2.get('point_b')}")
    
    if details_2.get("point_b") != locked_b:
        logger.error("FALHA: O Ponto B 'arrastou'! O mecanismo de Lock falhou.")
    else:
        logger.info("SUCESSO: O Ponto B permaneceu fixo apesar da nova mínima. Bug de 'arrasto' corrigido.")

    # Terceira iteração: Breakout real
    # Preço cai 30 pontos abaixo do Ponto B (que era 1.10500)
    breakout_price = locked_b - 0.00040
    details_3 = detector.evaluate_signal_details(breakout_price, [])
    
    logger.info(f"Iteração 3 (Breakout): Signal={details_3.get('signal')} | Reason={details_3.get('reason')}")
    
    if details_3.get("signal") == "SELL":
        logger.info("SUCESSO: Sinal de VENDA gerado corretamente pós breakout de box travado.")
    else:
        logger.error(f"FALHA: Sinal não gerado. Motivo: {details_3.get('reason')}")

    logger.info("=== AUDITORIA FINALIZADA ===")

if __name__ == "__main__":
    run_audit()
