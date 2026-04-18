# ⚡ Robo MT5 Forex v2 - Elite Transparency Edition

[![Strategy](https://img.shields.io/badge/Strategy-Fimathe_Official-00FF88?style=for-the-badge)](https://fimathe.com.br)
[![Platform](https://img.shields.io/badge/Platform-MetaTrader_5-blue?style=for-the-badge)](https://www.metatrader5.com)
[![Stack](https://img.shields.io/badge/Stack-Python_|_Next.js_|_Docker-white?style=for-the-badge)](#arquitetura-do-sistema)

Robô de trading de nível institucional para **MetaTrader 5**, focado na execução determinística da estratégia **Fimathe**. Projetado para traders que exigem 100% de transparência e auditoria em cada decisão algorítmica.

---

## 🚀 Arquitetura de Ponta
O sistema opera em uma estrutura híbrida para máxima performance e baixa latência:

1.  **Core Engine (Host Windows)**: Motor Python 3.14+ conectado via API nativa ao MetaTrader 5 para execução milimétrica e gestão de risco.
2.  **Dashboard de Auditoria (Docker)**: Interface Next.js 14 premium (Black & Neon) para controle total sem precisar abrir o terminal MT5.
3.  **Database Layer (Docker)**: PostgreSQL para persistência de eventos, logs de auditoria e métricas financeiras.

---

## ✨ Recursos de Elite (Fimathe Hardening)

### 🛡️ Motor de Auditoria 16-Regras (FIM-001 a FIM-016)
O sistema não apenas opera; ele **justifica** cada movimento. Através do rastro de regras (`rule_trace`), você monitora 16 critérios simultâneos:
- **Matriz 4x4 no Monitor**: Visualização instantânea de bloqueios (Vermelho), validações (Verde) e espera técnica (Amarelo).
- **Detecção de Reversão Rigorosa**: Lógica de 2 níveis + Triângulo M1 integrada.
- **Filtros Adaptativos**: Spread dinâmico, agrupamento de candles e confluência de tendência estrutural (HH/LL).

### 🎓 Fimathe Academy Integrada
Centro de documentação teórica direto no dashboard. Cada uma das 16 regras possui um manual técnico detalhado com:
- Teoria aplicada ao robô.
- Dicas de especialistas para melhor performance.
- Exemplos visuais de gatilhos.

### 🔄 Resiliência Operational (Stateless)
- **Recuperação Pós-Queda**: O robô identifica trades abertos anteriormente e assume a gestão de Stop/Take automaticamente por ticket.
- **Sincronia Hot-Reload**: Mudanças nas configurações ou nos ativos monitorados são aplicadas em tempo real (Sem reiniciar o sistema).
- **Modo Standby**: Interface inteligente que protege dados residuais quando o robô está offline.

### 📊 Cockpit de Monitoramento
- **Métricas Financeiras**: PnL flutuante por ativo, Equidade global e Balanço em tempo real.
- **Ação Corretiva**: Descrições em linguagem natural do que o robô está esperando no mercado.
- **Escalabilidade**: Preparado para monitoramento simultâneo de até 20 pares de moedas.

---

## 📦 Guia de Instalação Rápida

### 1. Preparação do Terreno
- Instale o [Docker Desktop](https://www.docker.com/products/docker-desktop/).
- Instale o [Python 3.10+](https://www.python.org/downloads/).
- Tenha o **MetaTrader 5** logado e com o `Algo Trading` habilitado.

### 2. Ignition (One-Click Setup)
Clone o repositório e rode o script de inicialização automática:
```powershell
.\run_system.bat
```
*Este script automatiza o build do Docker, instalação de dependências e sincronização da API.*

---

## 🛠️ Stack Tecnológica
- **Frontend**: Next.js 14, Tailwind CSS, Framer Motion, Lucide icons.
- **Backend**: Python, MetaTrader5 API, FastAPI (v2 sync).
- **Infra**: Docker Compose, PostgreSQL.

---
> [!IMPORTANT]
> **AVISO LEGAL**: Trading no mercado de Forex envolve risco significativo. Este robô é uma ferramenta de auxílio operacional e não garante lucros. Teste sempre em conta DEMO antes de ir para conta REAL.

*Desenvolvido pelo Engenheiro de Software: gabriel lucas.*
