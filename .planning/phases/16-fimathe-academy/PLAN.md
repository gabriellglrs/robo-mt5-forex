# Plano de Execução: Phase 16 - Fimathe Academy

Criação de uma central de educação estratégica (/academy) para consolidar o conhecimento sobre as regras Fimathe e auxiliar na configuração do robô.

## Planejamento de Componentes

### 1. Página de Destino: `/academy`
- **Layout**: 
  - Sidebar esquerda fixa com os IDs das regras (FIM-001..016) para navegação rápida (`ScrollSpy` style).
  - Conteúdo central rico com design tipográfico premium.
  - Uso de cores semânticas: Azul/Ciano para Teoria, Amarelo para Configuração, Vermelho para Avisos de Risco.

### 2. Navegação Lateral (Sidebar Component)
- Inclusão do item "Academy" com o ícone `GraduationCap` da `lucide-react`.

### 3. Conectividade de Ajuda (Settings Tooltips)
- Pequeno refinamento no componente `RuleTooltip.tsx` para incluir um link externo para a Academy.

## Esboço de Conteúdo (Academy)

Cada regra terá quatro seções:
1. **O que é?**: Explicação teórica baseada no manual Fimathe.
2. **Lógica Técnica**: Como o robô processa os dados (ex: "Calculamos a inclinação da média nos últimos 200 candles").
3. **Por que é Vital?**: O que o usuário perde ao não utilizar ou desconfigurar a regra.
4. **Dica de Mestre**: Parâmetros recomendados para diferentes tipos de mercado (Lateral vs Tendência).

## Etapas de Execução

1. [ ] Atualizar `Sidebar.tsx` com o novo link.
2. [ ] Criar a estrutura básica da página `src/app/academy/page.tsx`.
3. [ ] Implementar o layout de navegação interna da Academy.
4. [ ] Inserir o conteúdo completo para as 16 regras (dividido em blocos de 4 para revisão).
5. [ ] Atualizar `RuleTooltip.tsx` para linkar com a Academy.
6. [ ] Validação final de links e UI.
