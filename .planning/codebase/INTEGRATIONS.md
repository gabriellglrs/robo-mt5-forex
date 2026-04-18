# Integrations

O sistema integra múltiplos serviços e gateways para garantir operação em tempo real e entrega de dados.

## MetaTrader 5 (MT5)
- **Tipo**: Integração Nativa via Python.
- **Função**: Execução de ordens, monitoramento de conta (Balance, Equity) e streaming de ticks/rates.
- **Conectividade**: Local (Windows) com terminal MT5 aberto.

## Web Dashboard <-> Backend API
- **Protocolo**: REST (JSON) em rede local/containerizada.
- **Sincronização**: Hot-Reload de parâmetros operacionais via API FastAPI.
- **Visualização**: Streaming de `runtime_snapshot` para monitoramento de ciclos.

## TradingView Charts
- **Tipo**: Client-side Integration.
- **Função**: Renderização técnica de velas M1 e projeções de níveis A/B/Alvos diretamente no navegador.

## Provedores de Notificação (Pipeline)
- **Providers**: Telegram / Email (via `src/notifications/providers.py`).
- **Função**: Alertas operacionais, gatilhos de segurança e relatórios de performance.
