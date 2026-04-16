# Plan: Phase 1 - Conexão e Análise de Dados Semanais

Implementar a base do sistema de trading, garantindo conexão estável com o MT5 e a extração inteligente de níveis S/R a partir dos pavios de 10 anos de velas semanais.

## User Review Required

> [!WARNING]
> **Configuração do MT5**: Para que o robô consiga ler 10 anos de histórico (520+ velas semanais), você precisará garantir que seu terminal MT5 tenha o histórico configurado (Ferramentas > Opções > Gráficos > Barras Máximas no Gráfico: coloque `Unlimited` ou no mínimo `100000`).

## Proposed Changes

### 1. Sistema Base e Conexão [NEW]
- Criar `src/core/connection.py`: Módulo responsável por inicializar e monitorar a conexão com o MT5.
- Criar `src/main.py`: Ponto de entrada que orquestra a inicialização e o loop principal.

### 2. Motor de Análise (Wick Engine) [NEW]
- Criar `src/analysis/levels.py`: Implementar a classe `LevelDetector`.
    - Método `fetch_weekly_data`: Baixa 520 velas W1.
    - Método `extract_wicks`: Calcula os níveis de pavio superior/inferior.
    - Método `cluster_levels`: Usa KMeans para agrupar os ~1000 pontos capturados em 15-30 zonas relevantes.

### 3. Configuração [NEW]
- Criar `config/settings.json`: Armazenar parâmetros como Símbolo, Profundidade de Histórico e Sensibilidade de Clusterização.

---

## Tasks

- [ ] **Tash 1.1**: Configurar ambiente Python (venv e instalação de `MetaTrader5`, `pandas`, `scikit-learn`).
- [ ] **Task 1.2**: Implementar `src/core/connection.py` com tratamento de erros de login.
- [ ] **Task 1.3**: Implementar extração de dados W1 em `src/analysis/levels.py`.
- [ ] **Task 1.4**: Implementar lógica de pavios e algoritmo de clusterização KMeans.
- [ ] **Task 1.5**: Criar script de teste `tests/verify_levels.py` para imprimir os níveis no console e validar contra o gráfico do MT5.

## Verification Plan

### Automated Tests
- Scripts de validação em `tests/` para verificar se os níveis retornados estão dentro do range de preço atual.

### Manual Verification
- O robô imprimirá os 10 níveis mais próximos. Você deve conferir se eles batem com os pavios das velas semanais no seu MT5.
