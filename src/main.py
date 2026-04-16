import time
import json
import logging
import os
from core.connection import MT5Connection
from core.database import DatabaseManager
from analysis.levels import LevelDetector
from analysis.indicators import IndicatorManager
from analysis.signals import SignalDetector
from execution.risk import RiskManager
from execution.orders import OrderEngine
import MetaTrader5 as mt5

# Configuração de Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("RoboMT5-Main")

def load_settings():
    try:
        if not os.path.exists("config/settings.json"):
            return None
        with open("config/settings.json", "r") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Erro ao carregar configurações: {e}")
        return None

def main():
    logger.info("### Robo MT5 v2 - MODO OPERAÇÃO COM HISTÓRICO ###")
    
    import os
    settings = load_settings()
    if not settings: 
        logger.error("Configurações não encontradas.")
        return
        
    symbol = "EURUSD"
    conn = MT5Connection()
    
    if not conn.connect(): return
    
    # 0. Inicializa Banco de Dados
    db_manager = DatabaseManager()
    db_manager.log_event("INFO", "Main", "Robô iniciado com sucesso e banco de dados conectado.")
        
    try:
        # 1. Inicializa Motores de Análise
        detector = LevelDetector(symbol, history_years=settings['analysis'].get('history_years', 2))
        indicator_manager = IndicatorManager(symbol)
        signal_detector = SignalDetector(symbol, settings['signal_logic'])
        
        # 2. Inicializa Motores de Execução integrados ao DB
        risk_configs = settings['risk_management']
        risk_manager = RiskManager(symbol, risk_configs)
        order_engine = OrderEngine(
            magic_number=risk_configs['magic_number'],
            db_manager=db_manager
        )
        
        # 3. Detecta Níveis Base
        mode = settings['analysis'].get("strategy_mode", "fractal")
        levels = detector.get_levels(mode=mode)
        logger.info(f"Monitoramento iniciado para {symbol}. Níveis ativos: {len(levels)}")
        
        loop_counter = 0
        while True:
            # Sinal de vida a cada 60 segundos
            if loop_counter % 60 == 0:
                db_manager.log_event("INFO", "Heartbeat", "Robô operando normalmente.")
                loop_counter = 0

            tick = mt5.symbol_info_tick(symbol)
            if tick is None: 
                time.sleep(1)
                continue
                
            current_price = tick.bid
            
            # Busca Indicadores
            timeframes = settings['analysis'].get("timeframes", ["M5", "M15"])
            indicators = indicator_manager.get_all_indicators(timeframes)
            
            # Verifica sinal
            signal = signal_detector.get_signal(current_price, levels, indicators)
            
            if signal:
                open_count = order_engine.count_open_positions(symbol)
                max_pos = risk_configs.get("max_open_positions", 1)
                
                if open_count < max_pos:
                    logger.warning(f"!!! SINAL CONFIRMADO: {signal} !!!")
                    sl, tp = risk_manager.calculate_prices(signal, current_price, levels)
                    lot = risk_manager.calculate_lot(abs(current_price - sl))
                    
                    mt5_order_type = mt5.ORDER_TYPE_BUY if signal == "BUY" else mt5.ORDER_TYPE_SELL
                    
                    order_engine.send_market_order(
                        symbol=symbol,
                        order_type=mt5_order_type,
                        volume=lot,
                        sl=sl,
                        tp=tp,
                        timeframe=",".join(timeframes),
                        strategy=mode,
                        indicators=indicators
                    )
            
            loop_counter += 1
            time.sleep(1)
            
    except KeyboardInterrupt:
        logger.info("Encerrando robô...")
        db_manager.log_event("WARNING", "Main", "Robô encerrado manualmente.")
    except Exception as e:
        logger.error(f"Erro crítico: {e}")
        db_manager.log_event("CRITICAL", "Main", f"Erro crítico: {str(e)}")
    finally:
        conn.disconnect()

if __name__ == "__main__":
    main()
