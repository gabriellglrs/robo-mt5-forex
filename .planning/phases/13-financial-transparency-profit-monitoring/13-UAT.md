---
status: testing
phase: 13-financial-transparency-profit-monitoring
source: []
started: 2026-04-16T19:35:00-03:00
updated: 2026-04-16T19:35:00-03:00
---

## Current Test

number: 2
name: Monitor: Cabeçalho Financeiro Global
expected: |
  No dashboard (http://localhost:3000/monitor), visualização do "Saldo da Conta", "Equidade Real" e "Lucro Flutuante" no topo da página. O lucro deve piscar caso seja uma posição aberta, em cor verde (+) ou vermelha (-).
awaiting: user response

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running server/service. Clear ephemeral state. Start the application from scratch. Server boots without errors and the dashboard loads successfully.
result: issue
reported: "so valtou adicionar na tela de dashboard Fluxo Recente Últimas Execuções... mostrar em tempo real e o quando fechar mostrar o historico"
severity: major

### 2. Monitor: Cabeçalho Financeiro Global
expected: No dashboard (http://localhost:3000/monitor), visualização do "Saldo da Conta", "Equidade Real" e "Lucro Flutuante" no topo da página. O lucro deve piscar caso seja uma posição aberta, em cor verde (+) ou vermelha (-).
result: pending

### 3. Monitor: PnL Individual por Ativo
expected: Nos cards de ativos (ex: EURUSD), observar o indicador de "Posições / PnL" caso haja posições abertas. O valor deve exibir o lucro/prejuízo em tempo real formatado em formato monetário ($).
result: pending

## Summary

total: 3
passed: 0
issues: 1
pending: 2
skipped: 0

## Gaps

- truth: "Kill any running server/service. Clear ephemeral state. Start the application from scratch. Server boots without errors and the dashboard loads successfully."
  status: failed
  reason: 'User reported: "so valtou adicionar na tela de dashboard Fluxo Recente Últimas Execuções... mostrar em tempo real e o quando fechar mostrar o historico"'
  severity: major
  test: 1
  artifacts: []
  missing: []

