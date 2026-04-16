# Phase 1: Conexão e Análise de Dados Semanais - Context

**Gathered**: 2026-04-15
**Status**: Ready for planning

<domain>
## Phase Boundary
Deliver a robust connection between Python and the MT5 terminal on the same machine. Implement an algorithm to extract Support and Resistance levels from the wicks of the last 10 years of weekly candles.
</domain>

<decisions>
## Implementation Decisions

### Conexão (Connection)
- O robô e o terminal MT5 residirão na **mesma máquina**.
- Uso da biblioteca oficial `MetaTrader5` do Python para o ciclo de vida da conexão (init, shutdown).

### Lógica de S/R (Estratégia Dupla)
- **Modo Fractal**: Captura a ponta exata dos pavios (pivôs locais) de 10 anos.
- **Modo Statistical**: Usa KMeans para identificar zonas de maior densidade de preços.
- **Profundidade**: 10 anos (520 velas W1).
- **Filtro**: Relevância de proximidade ao preço atual.

### Performance
- O processamento dos níveis deve ser eficiente para lidar com 10 anos de dados sem causar latência no robô.
</decisions>

<canonical_refs>
## Canonical References
- `REQUIREMENTS.md` (Seção 1. Core Trading Strategy)
- `research/STACK.md` (Detalhes da integração Python-MT5)
</canonical_refs>

<specifics>
## Specific Ideas
- A clusterização desses 10 anos de dados deve ser otimizada.
- Os níveis devem ser representados visualmente para verificação (ex: impressão de coordenadas ou um gráfico simples em Plotly/Matplotlib).
</specifics>

---
*Phase: 01-conex-o-e-an-lise-de-dados-semanais*
