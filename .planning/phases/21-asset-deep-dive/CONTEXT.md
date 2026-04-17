# Contexto da Fase 21: Asset Deep Dive & Live Charting (Terminal de Batalha)

## 📌 Decisões Arquiteturais Definidas
Abaixo estão as definições extraídas da nossa discussão técnica. Downstream agents (Pesquisador, Planejador) devem seguir estas escolhas e NÃO reabri-las para discussão com o usuário.

**Escopo Visual (Cockpit)**
1. **Gráfico Interativo**: Usaremos a biblioteca `lightweight-charts` (by TradingView) nativa do React/Next.js. O gráfico não será apenas de linhas, será de Velas (OHLC/Candlestick).
2. **Price Lines (Sobreposição)**: 
   - Ponto A: Linha tracejada Azul.
   - Ponto B / Proteção Inicial: Linha tracejada Vermelha.
   - Alvos (50%, 100%): Linhas sólidas Verde Neon.
   - SL/TP: Linha de acompanhamento do preço atual.
3. **Matriz Ampliada**: Expandir os "Leds" de sinal do Card Atual para mostrar as 16 regras (`rule_id`) decodificadas e com status ON/OFF/BLOCK ao lado do gráfico.
4. **Timeframes**: Um Toggle ou Botões estilo HUD (`[M1]` / `[M15]`) ficará disponível na tela do gráfico para permitir variação do "zoom". O frontend pedirá explicitamente à API as velas do TF escolhido.

**Escopo de Engenharia (Backend)**
1. **Fornecimento de OHLC (Velas)**: Não salvaremos o histórico de cotação no nosso MySQL (evitar inchaço). A API (FastAPI) ganhará uma rota `GET /api/chart/{symbol}?tf={timeframe}` que fará a consulta instantânea na hora (via `copy_rates_from_pos` da lib `MetaTrader5` python).
2. **Alimentação Real-Time**: O fluxo que já alimenta a dashboard hoje (o snapshot JSON) também servirá para desenhar a "vela do momento" e movimentar o mercado e o preço no Live Chart.
3. **Rota**: A URL na web será `/monitor/[symbol]`. O botão de entrada ficará no Dashboard atual (ex: `Acessar Terminal do Ativo`).

## 🚫 Alternativas Rejeitadas
1. **Banco de Dados OHLC**: Decidimos não salvar os ticks/velas do MT5 no MySQL, optando por cache on-the-fly via requisição direta ao MT5, já que o robô já roda localmente com a dashboard.

## 🛣️ Próximos Passos Inesperados
* O MT5 tem que estar sendo executado no momento da consulta pelo Frontend. Isso é garantido pelo fato do nosso pipeline Fimathe ser acoplado à mesma máquina.
