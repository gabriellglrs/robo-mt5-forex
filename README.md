# ⚡ Robo MT5 Forex v2 - Enterprise Edition

Robô de trading automatizado de alta performance para **MetaTrader 5**, focado na estratégia Fimathe com confluência avançada de indicadores.

## 🚀 Arquitetura do Sistema
A solução é dividida em três camadas principais:
1.  **Banco de Dados (Docker)**: MySQL 8.0 para persistência de trades e logs.
2.  **Dashboard Web (Docker)**: Interface Next.js moderna para monitoramento em tempo real.
3.  **Backend API & Robô (Host Windows)**: Servidor FastAPI que controla o ciclo operacional e se comunica com o MetaTrader 5.

> [!IMPORTANT]
> A API e o Robô **devem** rodar diretamente no Windows para acessar a biblioteca do MT5.

## 🛠️ Tecnologias
- **Frontend**: Next.js 15, Tailwind CSS, Framer Motion.
- **Backend API**: FastAPI, JWT Authentication.
- **Robot Engine**: Python 3.14, MetaTrader 5 API.
- **Infra**: Docker, MySQL 8.0.

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
Este script irá:
- Instalar as dependências do Python.
- Subir os containers do MySQL e Dashboard.
- Iniciar a Backend API na porta 8000.

### 3. Configuração e Execução (Manual)
Caso prefira rodar manualmente:

1.  **Instale as dependências**:
    ```bash
    pip install -r requirements.txt
    ```
2.  **Suba a infraestrutura**:
    ```bash
    docker-compose up -d
    ```
3.  **Inicie a API de Controle**:
    ```bash
    python src/api/main.py
    ```
4.  **Acesse o Dashboard**:
    Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

---
*Desenvolvido para traders profissionais que buscam automação robusta e auditável.*
