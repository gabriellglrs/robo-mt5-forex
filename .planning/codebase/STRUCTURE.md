# Codebase Structure

O projeto segue uma estrutura modular focada em separação de responsabilidades (Conexão, Análise e Execução).

## Estrutura de Diretórios

- `config/`: Arquivos de configuração (JSON).
- `src/`: Código fonte principal.
    - `core/`: Gestão de infraestrutura (Conexão MT5).
    - `analysis/`: Inteligência do robô (Níveis, Indicadores, Sinais).
    - `execution/`: (Em breve) Motor de ordens e risco.
- `tests/`: Scripts de verificação e simulação.
- `.planning/`: Documentação de design e progresso.

# Stack Tecnológica

- **Linguagem**: Python 3.14+
- **Terminal**: MetaTrader 5 (Build 5777+)
- **Bibliotecas Chave**:
    - `MetaTrader5`: Integração oficial.
    - `pandas`: Manipulação de séries temporais.
    - `scikit-learn`: Agrupamento estatístico (KMeans).
    - `numpy`: Cálculos matemáticos vetoriais.
