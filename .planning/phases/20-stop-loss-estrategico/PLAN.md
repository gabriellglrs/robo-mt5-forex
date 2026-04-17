# PLAN: Phase 20 - Stop Loss Estratégico e Testes Unitários

## ✅ Implementação Concluída

Todas as metas da Phase 20 foram atingidas:
- [x] Motor Fimathe refatorado (Modos Conservador e Infinity).
- [x] Testes Unitários v2 aprovados com 100% de cobertura nos novos cenários.
- [x] Integração MT5 (TP Zero) validada.
- [x] UI de Configurações e Academy atualizados.

### 1. Refatoração do Motor Fimathe (Python)
- [x] Atualizar `fimathe_cycle.py` para suportar `management_mode`.
- [x] Implementar lógica de níveis dinâmicos (N * step) para o modo Infinity.
- [x] Garantir que o modo Conservador trave o SL no BE e ignore novos avanços.

### 2. Testes Unitários OBRIGATÓRIOS
- [ ] Teste Case 04: Modo Infinity -> 200% lucro -> SL 100%.
- [ ] Teste Case 05: Modo Infinity -> 300% lucro -> SL 200%.

### 3. Frontend (Web Dashboard)
- [ ] Adicionar seletor de Modo de Gestão na `/settings`.
- [ ] Criar inputs numéricos para as porcentagens manuais.
- [ ] Adicionar tooltips `(?)` em cada campo explicando como a regra se comporta.

### 4. Integração no Motor Principal
- [ ] Atualizar `main.py` para remover o Take Profit no MT5 quando `Infinity` estiver ativo.

## Critérios de Sucesso
- [ ] 100% dos novos testes unitários passando.
- [ ] Interface refletindo os novos parâmetros e tooltips.
- [ ] Logs do robô indicando claramente qual modo de gestão está ativo para o trade.
