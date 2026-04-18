# Architecture (v2.0)

O **robo-mt5-v2** utiliza uma arquitetura de **Pipeline de Decisão e Gestão de Estados**, desacoplada da execução para garantir segurança e auditabilidade.

## 1. Camada de Conectividade (Core)
- **Gateway MT5**: Singleton que gerencia a conexão persistente com o terminal.
- **Database Wrapper**: Abstração SQLite para persistência de parâmetros hot-reload e logs.

## 2. Camada de Análise (Intelligence)
- **State Engine**: Morte crucial de estados (FIM-001..FIM-008) que decide se o mercado está em expansão, canal ou reversão.
- **Level/Indicator Manager**: Cálculos geométricos de canais Fimathe e filtros de volatilidade.

## 3. Camada de Execução (Operational)
- **Decision Loop**: Ciclo infinito (1s default) que orquestra a leitura de mercado, validação de sinais e ajuste de ordens.
- **Risk Layer**: Validação de STI (Stop Técnico), Trailing e Lote antes de qualquer envio de ordem.

## 4. Camada de Exposição (Presence)
- **REST API**: Ponte de dados para o dashboard.
- **Notification Service**: Orquestrador de alertas multicanal.
