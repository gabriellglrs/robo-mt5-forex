# Testing Strategy

O projeto adota uma abordagem de **Verificação Funcional e Simulação**.

- **Testes de Conexão**: Verificação de handshake com o terminal MT5.
- **Testes de Lógica (`verify_levels.py`)**: Validação visual dos preços de pavios contra o gráfico real.
- **Testes de Sinais (`verify_signals.py`)**: Simulação de cenários de confluência (Mockups) para garantir que o "Cérebro" do robô decide corretamente antes de colocar dinheiro real.

# Conventions

- **Logging**: Todo módulo deve usar `logging.getLogger(__name__)`.
- **Configuração**: Nenhuma "magic string" ou parâmetro deve estar hardcoded; tudo reside no `settings.json`.
- **Modularidade**: Indicadores e Sinais são classes independentes para facilitar a troca de estratégia.
