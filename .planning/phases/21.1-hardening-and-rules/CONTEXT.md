# Contexto da Fase 21.1: Operational Hardening & Rule Transparency

## 📌 Objetivo
Resolver regressões técnicas identificadas nos logs (NameError) e completar a transparência visual do motor de estados no Monitor, conforme prometido na Fase 21.

## 📌 Decisões Arquiteturais
1. **Bug Fix Core**: A variável `timeframes` no `main.py` será substituída pela lista dinâmica `[details.get('entry_timeframe'), details.get('trend_timeframe')]`.
2. **Matriz de Regras (UI)**: Será um componente React que itera sobre o objeto `rule_trace` vindo do snapshot de runtime.
3. **Mapeamento de Regras**:
   - FIM-001: Ponto A objetivo
   - FIM-002: Ponto B objetivo
   - FIM-003: Alvos 50/100
   - ... (e assim por diante até FIM-016)
4. **Resiliência Financeira**: O monitor deve exibir `Balance`, `Equity` e `Profit` global, não apenas o PnL do ativo, para paridade com o Dashboard principal.

## 🚫 Alternativas Rejeitadas
- **Adicionar Indicadores (RSI/BB)**: Adiado para a Fase 22 para manter a 21.1 focada em Estabilidade e Transparência Fimathe.
