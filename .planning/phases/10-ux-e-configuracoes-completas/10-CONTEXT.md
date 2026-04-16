# Phase 10: UX e Configurações Completas - Context

**Gathered:** 2026-04-16
**Status:** Ready for planning

<domain>
## Phase Boundary
Esta fase consolida a interface visual do Streamlit, transformando-a de um dashboard básico em um "Trading Center" premium para a estratégia Fimathe. Inclui monitoramento em tempo real dos estados, ajuste dinâmico de parâmetros de risco e persistência de definições.

</domain>

<decisions>
## Implementation Decisions

### Visualização "Premium" (Agent's Discretion)
- **Cores**: Manter o tema Dark/Neon Green já iniciado no `.streamlit/config.toml`.
- **Gráficos**: Utilizar `plotly.graph_objects` para exibir velas (candlesticks) sobrepostas pelos níveis dinâmicos da estratégia (A, B, Zona Neutra, Projeções).
- **Status da Máquina de Estados**: Exibir o estado atual (`Trend`, `Canal`, `Projeção`, `Break-even`, etc.) em cards de destaque com indicadores de cor (ex: Verde para 'Compra ativa', Amarelo para 'Zona Neutra').

### Interatividade e Controle
- **Painel de Controle**: Adicionar controles laterais para:
  - Botão Global Start/Stop.
  - Slider para Risco de Operação (default 1%, max 3%).
  - Input para Capital de Referência (se diferente do balance real).
- **Ajustes a Quente**: Parâmetros de risco devem ser lidos pelo `risk.py` e `fimathe_cycle.py` de forma reativa a cada iteração (sem necessidade de reiniciar o script principal se possível).

### Auditoria e Logs
- **Timeline de Risco**: Exibir uma timeline de eventos proativos (ex: "STI posicionado", "BE acionado", "Lock 100%").
- **Explicação das Regras**: Adicionar balões `st.help` ou popovers explicando as regras FIM-xxx ativas em cada transição observada.

### Persistência de Definições
- **Formato**: Utilizar um arquivo `config/settings.json` para persistir as escolhas da UI entre reinicializações.
- **Histórico**: Continuar utilizando o SQLite (`db/trading_history.db`) para o histórico de trades e auditoria histórica.

</decisions>

<canonical_refs>
## Canonical References
- `src/main.py`: Ponto de entrada que orquestra a UI e o loop de trading.
- `src/execution/risk.py`: Motor de risco que consome as configurações da UI.
- `src/analysis/fimathe_state_engine.py`: Fonte de verdade para os estados a serem visualizados.
- `REQUIREMENTS.md`: Seção 'Interactive Dashboard' e 'Control Panel'.

</canonical_refs>

<deferred>
## Deferred Ideas
- Multi-moedas simultâneas (focaremos em um ativo por vez conforme escopo atual).
- Notificações via Telegram (fica para fase futura se não houver tempo).

</deferred>
