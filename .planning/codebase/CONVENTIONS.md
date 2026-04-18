# Codebase Conventions

O projeto segue padrões rigorosos para garantir manutenibilidade e confiabilidade operacional (Missão Crítica).

## Padrões de Código (Backend)
- **PEP 8**: Estilo de código Python padrão.
- **Tipagem**: Uso extensivo de `typing` para clareza e segurança.
- **Logging**: Sistema de log multinível (Debug para lógica de sinais, Info para execuções, Error para conexões).
- **Hardening**: Validações de entrada em todos os métodos de cálculo de lote e níveis.

## Padrões de Código (Frontend)
- **TypeScript**: Estrito para evitar erros de runtime no dashboard.
- **Atomic Components**: Componentes pequenos e reutilizáveis em `src/components`.
- **Zustand/Context**: (Avaliado conforme necessidade) para gestão de estado global de monitoramento.
- **Neon Design System**: Uso consistente de variáveis CSS para cores vibrantes (Cyberpunk) e transparências (Glassmorphism).

## Git & Workflow GSD
- **Commits Atômicos**: Uma tarefa/fix por commit.
- **Mensagens Claras**: Prefixo da fase ou tipo de alteração (ex: `feat(phase-21): add live charting`).
- **Manifesto de Fase**: Cada mudança deve estar refletida no `STATE.md` e documents de fase.

## Qualidade & QA
- **Verification-First**: Testes unitários para lógica de trading são obrigatórios antes do deploy.
- **Compliance Fimathe**: Auditoria regular contra os documentos `FIM-XXX` (Academy).
