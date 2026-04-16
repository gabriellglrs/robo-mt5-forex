# Plano de Execução - Fase 13: Transparência Financeira

Este plano organiza as tarefas para implementar o monitoramento de lucro e saldo em tempo real.

## Frontmatter
wave: 1
depends_on: []
files_modified:
  - src/main.py
  - web-dashboard/src/types/index.ts
  - web-dashboard/src/app/monitor/page.tsx
autonomous: true

## Tasks

<task id="back-001">
  <title>Backend: Coleta de Dados Financeiros</title>
  <read_first>
    - src/main.py
  </read_first>
  <action>
    Modificar a função `build_runtime_symbol_snapshot` ou o loop principal em `src/main.py` para incluir:
    1. Chamada a `mt5.account_info()` para obter balance, equity e profit total.
    2. Chamada a `mt5.positions_get()` para calcular o lucro somado por símbolo.
    3. Injetar `account` (objeto global) e `current_pnl` (por símbolo) no dicionário `runtime_snapshot`.
  </action>
  <acceptance_criteria>
    - O arquivo `logs/fimathe_runtime.json` contém a chave `"account"` com sub-chaves `"balance"`, `"equity"` e `"profit"`.
    - Cada símbolo no snapshot possui a chave `"current_pnl"`.
  </acceptance_criteria>
</task>

<task id="front-001">
  <title>Frontend: Atualização de Tipagem</title>
  <read_first>
    - web-dashboard/src/types/index.ts
  </read_first>
  <action>
    Atualizar as interfaces:
    - `FimatheAsset`: adicionar `current_pnl?: number`.
    - `RuntimeSnapshot`: adicionar `account?: { balance: number; equity: number; profit: number; }`.
  </action>
  <acceptance_criteria>
    - `src/types/index.ts` compilando sem erros com os novos campos.
  </acceptance_criteria>
</task>

<task id="front-002">
  <title>Frontend: Componente de Resumo Financeiro</title>
  <read_first>
    - web-dashboard/src/app/monitor/page.tsx
  </read_first>
  <action>
    Implementar um cabeçalho financeiro no topo da página de monitoramento:
    - Exibir Saldo (Balance) e Lucro Flutuante (Floating PnL).
    - Usar estilo Neon (Verde se PnL > 0, Vermelho se < 0).
  </action>
  <acceptance_criteria>
    - O dashboard exibe "Saldo: $X,XXX.XX" e "Lucro Aberto: $XX.XX" no topo.
  </acceptance_criteria>
</task>

<task id="front-003">
  <title>Frontend: PnL no Card de Ativo</title>
  <read_first>
    - web-dashboard/src/app/monitor/page.tsx
  </read_first>
  <action>
    Atualizar o componente `AssetFimatheCard`:
    - Adicionar um Badge ou texto de Profit logo abaixo/ao lado do status de posições abertas.
    - Aplicar cores dinâmicas baseadas no valor de `current_pnl`.
  </action>
  <acceptance_criteria>
    - Quando há ordens abertas, o card mostra o lucro exato em tempo real.
  </acceptance_criteria>
</task>

## Verification Plan

### Automated
1. Rodar `docker-compose build web-dashboard` para validar tipagem e build.
2. Inspecionar o log do robô para garantir que a coleta do MT5 não gera exceções.

### Manual
1. Abrir uma ordem no MetaTrader 5 Demo.
2. Observar se o valor do lucro aparece no card respectivo no Dashboard em até 5 segundos.
3. Verificar se o Saldo Total reflete o balance da conta MT5.
