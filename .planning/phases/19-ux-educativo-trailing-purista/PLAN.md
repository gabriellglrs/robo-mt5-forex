# PLAN: Phase 19 - UX Educativo (Tooltips Globais)

Adicionar documentação técnica contextualizada (Fimathe) em todos os campos de configuração do robô.

## Tarefas de Execução

### 1. Preparação (Frontend)
- [ ] Criar objeto `SETTINGS_HELP` no `SettingsPage.tsx`.
- [ ] Implementar as descrições didáticas revisadas.

### 2. Implementação das Interfaces
- [ ] **Aba Estratégia**: Inserir tooltips em Lookback, Slope, Perfil, Timeframes, Buffers, S/R, Triângulo e TP Mode.
- [ ] **Aba Gestão de Risco**: Inserir tooltips em Risco %, Ciclo Fimathe, Break-even, Max Posições e Cooldown.
- [ ] **Aba Conexão**: Inserir tooltips em Server, Login e Spread Máximo.

## Verificação UAT
- [x] Ícones visíveis em todos os campos?
- [x] Textos corretos e sem erros de português?
- [x] Comportamento hover/click suave?
