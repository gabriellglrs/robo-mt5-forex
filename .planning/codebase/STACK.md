# Tech Stack

O projeto **robo-mt5-v2** é um ecossistema de trading automatizado de alta performance focado na estratégia Fimathe.

## Backend (Core & Engine)
- **Linguagem**: Python 3.10+
- **Terminal Trading**: MetaTrader 5 (via `MetaTrader5` library)
- **API Framework**: FastAPI (Uvicorn)
- **Database**: SQLite (armazenamento de configurações e histórico de sinais)
- **Análise Técnica**: Logica purista Fimathe (sem indicadores lagados, baseada em níveis de preço e expansão)

## Frontend (Dashboard & Monitoramento)
- **Framework**: Next.js 15 (App Router)
- **Linguagem**: TypeScript
- **Styling**: Tailwind CSS (Tema Dark/Neon Cyberpunk)
- **Visualização**: TradingView Lightweight Charts (Monitoramento em tempo real)
- **Icons**: Lucide React
- **Componentes**: Radix UI / Custom Neon Components

## Infraestrutura & DevOps
- **Containerização**: Docker / Docker Compose (Dashboard)
- **Build Tool**: NPM / Vite (Frontend)
- **Process Management**: Scripts Batch (`run_system.bat`) para orquestração local (Backend + MT5)
- **Workflow**: GSD (Get Shit Done) - Spec Driven Development
