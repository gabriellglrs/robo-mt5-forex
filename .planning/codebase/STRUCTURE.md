# Project Structure

```text
robo-mt5-v2/
├── .planning/             # Contexto GSD (Roadmap, State, Codebase)
├── config/                # Arquivos JSON de runtime e configurações locais (robot_runtime.json)
├── docs/                  # Documentação estratégica (CERTIFICADO-HOMOLOGACAO)
├── src/
│   ├── analysis/          # Motores de Lógica (Fimathe State Engine, Indicators, Levels, Signals)
│   ├── api/               # Backend FastAPI (main.py, rotas)
│   ├── core/              # Infraestrutura (Connection, Database, Settings Schema)
│   ├── execution/         # Operacional (Orders, Risk, Fimathe Cycle)
│   ├── notifications/     # Alertas e Provedores (Telegram, Email)
│   ├── ui/                # UI legado ou gerador de estilos (dashboard.py)
│   └── main.py            # Entrypoint orquestrador do motor do robô
├── tests/                 # Suítes de testes exaustivas
│   ├── homologacao/       # Testes de compliance manual/estratégico
│   └── unit/              # Testes de Cycle, Engine e Hardening
├── web-dashboard/         # Aplicação Next.js 15 (Frontend moderno)
│   ├── public/            # Assets estáticos
│   ├── src/app/           # Rotas (Academy, Monitor, Stats, Settings)
│   └── src/components/    # Biblioteca de UI Neon/Cyberpunk (LiveChart, StructuralGauge)
├── run_system.bat         # Orquestrador de inicialização local
└── docker-compose.yml     # Orquestração do Frontend distribuído
```
