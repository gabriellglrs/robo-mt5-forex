# Phase 12-CONTEXT: Advanced Monitor UI/UX

## Decisões de Design e Implementação

### 1. Sistema de Cores Semânticas (Status do Motor)
O card superior de "Status do Motor" e o glow do card principal seguirão uma lógica de cores baseada na fase operacional atual:

| Fase (`status_phase`) | Significado | Cor (Visual) | Referência Tailwind |
| :--- | :--- | :--- | :--- |
| `sr` | Fora de zona / Aguardando | Cinza Metálico | `text-slate-400`, `bg-slate-400/10` |
| `rompimento` | Aguardando gatilho | Amarelo Alerta | `text-amber-400`, `bg-amber-400/10` |
| `entrada` | Setup detectado | Azul Vibrante | `text-sky-400`, `bg-sky-400/10` |
| `gestao_risco` | Posição Ativa | Violeta / Ouro | `text-violet-400`, `bg-violet-400/10` |
| `erro` | Falha de execução | Vermelho Alerta | `text-red-500`, `bg-red-500/10` |

### 2. Card de Tendência e Tooltips (Hover)
- **Título**: Alterado para "Tendência: {direção}" (ex: "Tendência: ALTA").
- **Timeframe**: Exibir o timeframe de análise (ex: `M15`) ao lado da direção.
- **Interação**: Ao passar o mouse sobre o valor de `pts` ou sobre o status, aparecerá um balão (Floating Card) com a descrição técnica detalhada.
- **Diferencial**: O balão será mais rico do que o implementado anteriormente, contendo possivelmente ícones ou mini-status das sub-regras.

### 3. Simulador de Estrutura Técnica (Visual Price Ruler)
Implementação de uma **Régua Horizontal de Preços** (`FimatheStructureGauge`):
- **O que é?**: Uma representação visual tipo "barra de progresso" que mapeia os níveis de preço Fimathe.
- **Layout**: `[ SL ] ---- [ PONTO B ] ---- ( PREÇO ) ---- [ PONTO A ] >>>> [ ALVO 80/100 ]`.
- **Dinâmica**: Um marcador visual (ex: um triângulo luminoso ou linha pulsante) se deslocará horizontalmente sobre a régua para mostrar exatamente onde o preço está em relação aos canais e projeções. Isso elimina a necessidade de comparar números decimais manualmente.

### 4. Auditoria de Regras Diagóstica
A seção inferior será expandida para mostrar o "Checklist Fimathe":
- **Regra Atual**: Exibir `rule_id` e `rule_name` de forma destacada.
- **Status das Regras**: Mostrar quais regras no `rule_trace` do backend estão BLOQUEADAS ou OK.
- **Interação**: Hover sobre cada regra mostrará o `next_trigger` (o que o robô está esperando para aquela regra específica).

---
*Este contexto servirá de guia para a geração do PLAN.md da Fase 12.*
