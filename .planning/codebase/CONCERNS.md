# Codebase Concerns

Pontos de atenção, riscos técnicos e dívidas técnicas identificadas no estado atual do projeto.

## Performance & Latency
- **MT5 Overhead**: A biblioteca MT5 oficial pode apresentar latência em buscas massivas de ticks. Solução: Cache agressivo de níveis e pooling de conexão.
- **Refresh Rate**: Sincronia entre o ciclo de 1s do backend e a renderização do dashboard.

## Estratégia & Operacional
- **Double Entries**: Risco de abrir múltiplas posições por símbolo se o MT5 demorar a reportar o `ticket`. Implementado mecanismo de bloqueio baseado em estado local.
- **Lateralidade**: Fimathe purista pode gerar sinais falsos em canais extremamente estreitos. Implementada sensibilidade dinâmica (Phase 21).
- **Stop Loss Reconciliação**: Garantir que o SL no MT5 sempre bata com a regra STI calculada no backend, mesmo após reinicialização.

## Segurança & Resiliência
- **API Security**: No momento, a API FastAPI opera sem autenticação robusta em rede local. Recomendado: Implementação de JWT/API Keys para exposição externa.
- **Error Propagation**: Erros no MT5 (Market Closed, No Money) precisam de tratamento visual claro no dashboard para não deixar o usuário "no escuro".

## Manutenibilidade
- **Documentação de Lógica**: A complexidade do `fimathe_state_engine.py` exige documentação visual (Mermaid) para evitar regressões em regras FIM-001..008.
