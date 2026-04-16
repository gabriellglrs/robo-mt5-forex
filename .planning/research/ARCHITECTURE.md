# Arquitetura do Sistema: Robo MT5 v2

O sistema foi reconstruído para ser uma solução escalável, segura e orientada a dados.

## Componentes

### 1. MT5 Core (`src/core/`)
- Gerencia a conexão física com o terminal MetaTrader 5.
- Abstrai os erros de rede e reconexões automáticas.

### 2. Motor de Análise (`src/analysis/`)
- **Detector de Níveis**: Analisa o histórico OHLC para identificar S/R.
- **Detector de Sinais**: Implementa confluência de indicadores (RSI, Bollinger, etc).

### 3. Persistência (`database.py` + Docker)
- **MySQL 8.0**: Central de armazenamento para trades e logs.
- **Adminer**: Interface web para gerenciamento manual do banco.

### 4. Interface Web (`src/ui/`)
- **Dashboard**: Monitoramento de performance e equity.
- **Command Center**: Editor de configurações web que persiste no `settings.json`.

## Fluxo de Dados
1. `main.py` -> Inicia conexão MT5 e MySQL.
2. `main.py` -> Busca ticks e indicadores.
3. Se Sinal -> `order_engine.py` executa e salva no `MySQL`.
4. `dashboard.py` -> Lê `MySQL` e apresenta KPIs.
5. `dashboard.py` -> Grava `settings.json` <- `main.py` lê na inicialização.

---
*Design: Modular, Headless e Web-First.*
