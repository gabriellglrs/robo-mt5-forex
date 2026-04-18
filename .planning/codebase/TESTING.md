# Testing Strategy

O projeto adota uma abordagem de **Validation-First**, essencial para sistemas de trading onde erros custam capital real.

## Níveis de Teste

### 1. Testes Unitários de Lógica (`tests/unit`)
- **Fimathe State Engine**: Validação de todas as transições de estado (FIM-001..FIM-008).
- **Hardening**: Testes de estresse para cálculos de lote zero, saldo negativo e latência de rede.
- **Rules Compliance**: Verificação se as regras STI e Trailing seguem o manual purista.

### 2. Testes de Integração (`tests/verify_*.py`)
- **MT5 Connectivity**: Scripts de fumaça para garantir que a ponte Python-MT5 está funcional.
- **Order Execution**: Simulação de ordens em conta demo antes de qualquer alteração no motor principal.

### 3. Homologação Estratégica (`tests/homologacao`)
- **Manual Compliance**: Testes que verificam se o robô se comporta como um trader humano seguiria a estratégia.
- **UAT (User Acceptance Testing)**: Validações visuais no dashboard para garantir que os dados refletem o estado do robô.

## Comandos de Execução
- `pytest`: Executa toda a suite de testes.
- `python tests/run_engine_tests.py`: Suite customizada para o motor de execução.

## Próximos Passos de QA
- Implementação de Testes E2E no `web-dashboard` usando Playwright/Cypress.
- Automação do `strategy_audit.py` para geração de relatórios de aderência semanais.
