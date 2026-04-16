import MetaTrader5 as mt5
import logging

class MT5Connection:
    """Gerencia a conexão com o terminal MetaTrader 5."""
    
    def __init__(self):
        self.logger = logging.getLogger("MT5Connection")
        logging.basicConfig(level=logging.INFO)

    def connect(self):
        """Inicializa a conexão com o MT5."""
        if not mt5.initialize():
            self.logger.error(f"Falha ao iniciar o MT5: {mt5.last_error()}")
            return False
        
        terminal_info = mt5.terminal_info()
        if terminal_info is None:
            self.logger.error("Não foi possível obter informações do terminal.")
            mt5.shutdown()
            return False
            
        ver = mt5.version()
        self.logger.info(f"Conectado ao MT5 - Build: {terminal_info.build} (Versão: {ver[0]}, Data: {ver[2]})")
        return True

    def check_connection(self):
        """Verifica se a conexão ainda está ativa."""
        return mt5.terminal_info() is not None

    def disconnect(self):
        """Encerra a conexão de forma segura."""
        mt5.shutdown()
        self.logger.info("Desconectado do MT5 com sucesso.")

if __name__ == "__main__":
    # Teste rápido de conexão
    conn = MT5Connection()
    if conn.connect():
        print("Conexão bem-sucedida!")
        conn.disconnect()
    else:
        print("Erro na conexão.")
