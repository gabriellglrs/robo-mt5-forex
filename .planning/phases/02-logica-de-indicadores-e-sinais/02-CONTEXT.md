# Contexto da Phase 2: Lógica de Indicadores e Sinais

Nesta fase, implementamos o "Cérebro" do robô, transformando dados brutos de mercado em sinais de trading de alta probabilidade.

## Decisões de Design

### 1. Suíte de 5 Indicadores
Implementamos uma suíte completa para confluência:
- **Bollinger Bands**: Configurado para o preço de **Open**, garantindo estabilidade do sinal.
- **RSI (14)**: Filtro de exaustão de tendência.
- **Pin Bar (Fractal)**: Detector de rejeição de preço (pavios longos).
- **Stochastic (14,3,3)**: Confirmação de momento.
- **Volume**: Validação de interesse institucional.

### 2. Sistema de Pontuação (Scoring)
Em vez de uma lógica fixa, criamos um sistema de votação:
- Cada indicador ativo gera 1 ponto se confirmado.
- O usuário define o "Quórum" mínimo no `settings.json`.

### 3. Confluência Multi-Timeframe (MTF)
O robô monitora simultaneamente M5 e M15, exigindo que ambos concordem com a direção (BUY/SELL) antes de considerar os indicadores.

## Arquitetura de Sinais
1. Recebe níveis S/R da Phase 1.
2. Calcula Indicadores em tempo real.
3. Verifica quórum de confirmações.
4. Valida toque no nível semanal.
5. Emite gatilho de execução.
