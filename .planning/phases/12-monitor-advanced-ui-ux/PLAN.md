# PLAN: Phase 12 - Advanced Monitor UI/UX

Este plano visa implementar as melhorias visuais e de transparência no Monitor de Execução, transformando-o em um cockpit premium com feedback em tempo real das regras Fimathe.

## Insumos
- **Contexto**: [12-CONTEXT.md](file:///c:/DEV/robo-mt5-v2/.planning/phases/12-monitor-advanced-ui-ux/CONTEXT.md)
- **Roadmap**: [ROADMAP.md](file:///c:/DEV/robo-mt5-v2/.planning/ROADMAP.md)

## Checklist de Execução

### 1. Preparação e Tipagem
- [ ] Atualizar `web-dashboard/src/types/index.ts` para incluir novos campos:
    - `trend_timeframe`: string
    - `rule_id`: string
    - `rule_name`: string
    - `next_trigger`: string
    - `rule_trace`: Record<string, string>

### 2. Lógica de Estilização Semântica
- [ ] Modificar `web-dashboard/src/app/monitor/page.tsx`:
    - Criar função `getPhaseStyles(phase)` que retorna cores de texto, fundo e glow baseadas na fase (`sr`, `rompimento`, `entrada`, `gestao_risco`).
    - Aplicar esses estilos ao card principal e ao card de status do motor.

### 3. Componente de Régua Técnica (`FimatheStructureGauge`)
- [ ] Desenvolver componente que renderiza uma linha horizontal mapeando:
    - Nível de Proteção (Stop Loss) no extremo esquerdo.
    - Canais (B para A) no centro.
    - Alvos (P50, P80, P100) no extremo direito.
- [ ] Implementar o marcador dinâmico que posiciona o `price` atual na régua usando cálculo de porcentagem.

### 4. Tooltips e Transparência Operacional
- [ ] Implementar componente de Tooltip/Balloon para:
    - Campo `pts`: Explicação da inclinação da tendência.
    - Auditoria de Regras: Exibir o que o robô está esperando no momento.
- [ ] Reformatar o bloco de Trend para mostrar `Tendência: {Direction} ({Timeframe})`.

### 5. Seção de Checklist de Regras
- [ ] Adicionar seção expansível ou grid inferior mostrando as regras FIM-001 a FIM-011.
- [ ] Mostrar status visual (OK/Bloqueado/Pendente) para cada regra baseada no `rule_trace`.

## Verificação

- [ ] Validar renderização via interface web.
- [ ] Simular troca de estados (ex: mudar `status_phase` via mock) para verificar mudança de cores.
- [ ] Verificar precisão do marcador de preço na régua horizontal.

---
*Assinado: Antigravity Orchestrator*
