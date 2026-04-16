# ⚡ Robo MT5 Forex v2 - Enterprise Edition

Robô de trading automatizado de alta performance para **MetaTrader 5**, focado na estratégia Fimathe com confluência avançada de indicadores e monitoramento em tempo real.

## 🚀 Arquitetura do Sistema
A solução é dividida em três camadas principais:
1.  **Banco de Dados (Docker)**: MySQL 8.0 para persistência de trades e logs.
2.  **Dashboard Web (Docker)**: Interface Next.js moderna para monitoramento e configuração dinâmica.
3.  **Backend API & Robô (Host Windows)**: Servidor FastAPI que controla o ciclo operacional e se comunica com o MetaTrader 5.

## ✨ Diferenciais v2 (Fimathe Edition)

### 🛡️ Gestor de Regras Fimathe (FIM-001 a FIM-011)
Sistema de auditoria visual onde cada passo da estratégia é validado e explicado:
- **Cards Dinâmicos**: Toggles para filtros de agrupamento, rompimento e spread.
- **Tooltip Técnico**: Passe o mouse para ver a lógica algorítmica exata de cada regra.
- **Rastreio Real-time**: O monitor de execução mostra o status exato (`ok`, `bloqueado`, `desativado`) de cada regra.

### 🔄 Sincronização Dinâmica (Hot-Reload)
O robô agora é 100% reativo às mudanças na interface web:
- **Ativos Monitorados**: Adicione ou remova ativos no painel e o robô atualizará as janelas do MT5 instantaneamente.
- **Parâmetros de Risco**: Mudanças no Stop Loss, Take Profit e Trailing Stop são aplicadas no próximo ciclo sem interrupção.

### 📊 Monitor de Execução Premium
Interface "Black & Neon" com visualização clara de:
- **Estrutura Técnica**: Pontos A/B e Projeções Fimathe (50/100).
- **Status do Motor**: Explicação em linguagem natural do que o robô está aguardando (ex: "Aguardando Pullback").
- **Métricas de Performance**: Taxa de acerto, PnL total e histórico detalhado.

## 📦 Como Instalar e Rodar

### 1. Pré-requisitos
- Docker Desktop instalado.
- Python 3.10+ (recomendado 3.14).
- MetaTrader 5 instalado e logado na sua conta.

### 2. Configuração e Execução (Automática)
A maneira mais fácil de iniciar o sistema completo é usando o script de automação:
```powershell
.\run_system.bat
```
Este script irá instalar as dependências, subir os containers e iniciar o monitoramento.

---
*Desenvolvido para traders profissionais que buscam automação robusta, auditável e state-of-the-art.*
