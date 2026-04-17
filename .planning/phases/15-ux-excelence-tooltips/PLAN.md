# Plano de Execução: Phase 15 - Excelência UX

Implementação de tooltips premium (balões) disparados pelo ícone (i) com informações completas de estratégia e impacto operacional.

## Planejamento de Componentes

### 1. Novo Componente: `RuleTooltip.tsx`
- **Tecnologia**: `framer-motion` para animações.
- **Design System**: 
  - Fundo: `bg-[#0a0a0b]/95` com `backdrop-blur-xl`.
  - Bordas: `border border-white/10`.
  - Sombra: `shadow-[0_20px_50px_rgba(0,0,0,0.5)]`.
  - Tipografia: Inter (utilizando classes Tailwind do projeto).
- **Conteúdo**:
  - Título da Regra.
  - Para que serve (Propósito).
  - Status Atual (Ativo/Inativo).
  - Impacto Operacional (Dinâmico).

### 2. Refatoração: `web-dashboard/src/app/settings/page.tsx`
- **Data Update**: Injetar os novos campos `purpose`, `onActive` e `onInactive` no array `FIMATHE_RULES`.
- **UI Update**:
  - Remover a div de overlay `absolute inset-0` no card de regra.
  - Adicionar o componente de Tooltip ao redor do ícone `HelpCircle`.
  - Ajustar o layout do card para melhor legibilidade sem a animação de hover antiga.

## Descrições Estratégicas (Amostra para implementação)

### FIM-009 (Filtro de Spread)
- **Propósito**: Proteção contra custos operacionais abusivos.
- **Ativo**: Bloqueia entradas se o spread da corretora for maior que o configurado, preservando sua margem de lucro.
- **Inativo**: O robô pode executar ordens mesmo com spread alto, o que pode resultar em trades que começam com prejuízo maior que o alvo.

### FIM-015 (Reversão Rigorosa)
- **Propósito**: Impedir operações perigosas contra a tendência predominante.
- **Ativo**: Exige que o preço caia 2 níveis inteiros e consolide (Triângulo M1) antes de permitir uma venda em tendência de alta.
- **Inativo**: O robô tentará "adivinhar" o topo/fundo, aumentando drasticamente o risco de ser estopado por continuidade de tendência.

## Etapas de Execução

1. [ ] Criar o componente `RuleTooltip.tsx`.
2. [ ] Atualizar as definições de `FIMATHE_RULES` no arquivo de página.
3. [ ] Integrar o tooltip no componente de ícone do card de regra.
4. [ ] Remover a animação de translação antiga.
5. [ ] Validar design e responsividade.
