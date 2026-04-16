---
status: testing
phase: 10-ux-e-configuracoes-completas
source: [10-SUMMARY.md]
started: "2026-04-16T16:34:00Z"
updated: "2026-04-16T16:34:00Z"
---

## Current Test
number: 1
name: Cold Start Smoke Test
expected: |
  1. O arquivo `config/settings.json` deve existir e ser lido sem erros.
  2. Ao executar `python src/main.py`, o robô deve iniciar e aguardar o comando de Start via UI (mostrando "Robo em PAUSE" no log).
  3. Ao executar `streamlit run src/dashboard/app.py`, o painel visual deve abrir e mostrar os dados iniciais.
awaiting: user response

## Tests

### 1. Cold Start Smoke Test
expected: Robô e Dashboard iniciam do zero sem erros de importação ou crash prematuro.
result: [pending]

### 2. Controle de Execução (Start/Stop)
expected: Ao clicar em "INICIAR ROBÔ" na UI, o log do robô deve mudar para "Robo operando normalmente". Ao clicar em "PARAR", deve retornar para "PAUSE".
result: [pending]

### 3. Ajuste Dinâmico de Risco
expected: Alterar o slider de risco na UI reflete a mudança no arquivo `settings.json` e no cálculo de lotes do robô no próximo ciclo.
result: [pending]

### 4. Visualização de Níveis Fimathe
expected: O gráfico Plotly exibe linhas horizontais tracejadas para o Canal de Referência e Projeções, baseadas no snapshot de runtime.
result: [pending]

### 5. Auditoria de Eventos
expected: A seção "Auditoria" exibe a timeline de eventos recentes com os níveis de log (INFO, RISK, ERROR) formatados corretamente.
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0

## Gaps

[none yet]
