---
status: done
phase: 13-financial-transparency-profit-monitoring
source: []
started: 2026-04-16T19:35:00-03:00
updated: 2026-04-16T21:00:00-03:00
---

## Current Test

number: 3
name: Monitor: PnL Individual por Ativo e Estado Standby
expected: |
  Nos cards de ativos, observar o indicador de "Posições / PnL". Quando o botão desligar, o sistema inteiro de Dashboard e Monitor devem transicionar limpos para um estado 'Motor Em Standby', apagando todo resquício de dados legados do front-end.
awaiting: 

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running server/service. Clear ephemeral state. Start the application from scratch. Server boots without errors and the dashboard loads successfully. (Logs incluídos na UI com fluxo de eventos e visual tracking Fimathe)
result: passed

### 2. Monitor: Cabeçalho Financeiro Global
expected: No dashboard (http://localhost:3000/monitor) e na home (/), visualização do "Saldo da Conta", "Equidade Real" e "Lucro Flutuante" no topo da página. O lucro deve piscar caso seja uma posição aberta, em cor verde (+) ou vermelha (-).
result: passed

### 3. Monitor: PnL Individual e Lógica de Standby Global
expected: As variáveis acompanham a engrenagem (se running, mostram; se stopped, limpam a interface e mostram a barreira negra/vermelha 'Motor em Standby' para garantir absoluta clareza de estado).
result: passed

## Summary

total: 3
passed: 3
issues: 0
pending: 0
skipped: 0

## Gaps

- N/A. Todas correções de UAT, UI premium FX e a lógicas de Standby foram implementadas com total aceite.
