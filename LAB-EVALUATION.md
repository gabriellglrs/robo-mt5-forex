# Guia de Avaliação: Strategy Lab Cockpit

Este guia foi desenvolvido para ajudá-lo a interpretar os resultados do **Strategy Lab** e identificar configurações de alta probabilidade para execução em conta real.

## 1. O Triângulo de Ouro da Performance
Uma configuração "Premium" deve equilibrar três pilares:

*   **Win Rate vs Payoff**: Um Win Rate alto (> 60%) é excelente, mas se o Payoff for baixo (< 1.2), uma única sequência de perdas pode apagar semanas de lucro.
*   **Profit Factor**: Acima de **1.5** é considerado bom. Acima de **2.0** é considerado excepcional.
*   **Max Drawdown**: Deve ser proporcional ao seu capital. No laboratório, o drawdown é medido em pontos. Compare-o com o lucro total acumulado.

## 2. Analisando a Distribuição de Trades
No novo painel de detalhes, observe a contagem de **0x0 (Break-even)**:
*   **Muitos 0x0**: Indica uma estratégia defensiva que protege o capital, mas pode estar "saindo cedo demais" de tendências fortes.
*   **Poucos 0x0**: Indica uma estratégia "Tudo ou Nada". Verifique se o Drawdown suporta essa volatilidade.

## 3. Evitando o Overfitting (Ajuste Excessivo)
O Strategy Lab gera variações automáticas (Pairwise). Cuidado ao escolher o #1 do ranking se os resultados dos vizinhos (#2, #3) forem muito piores.
> [!TIP]
> **Robustez Estatística**: Prefira um preset que performe bem em múltiplos ativos e janelas de tempo diferentes, em vez de um que é "perfeito" apenas em 2 dias de histórico em um único ativo.

## 4. Validação de Nyquist
Sempre considere o **Slippage** e **Spread** configurados. Se o seu lucro depende de frações de pontos que seriam engolidas por um slippage real, a estratégia é estatisticamente frágil.

---
*Este guia é parte integrante do Robo MT5 Fimathe v2 - Strategy Lab Module.*
