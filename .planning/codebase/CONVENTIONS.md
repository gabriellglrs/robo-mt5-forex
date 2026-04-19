# Conventions

## Linguagem e estilo
- Backend majoritariamente em Python com nomes e comentarios em portugues tecnico.
- Frontend em TypeScript/TSX com componentes React funcionais.
- Padrao de logs estruturados com contexto de modulo (`logger = logging.getLogger(...)`).
- Uso frequente de `dict` para payload operacional entre camadas.

## Convencoes no backend
- Arquitetura orientada a servicos por modulo (`analysis`, `execution`, `core`, `notifications`).
- Funcoes helper para normalizacao e coercao de tipos (ex.: `_to_float`, `_to_int`).
- Fallbacks defensivos para IO/API externa (MT5, Telegram, DB).
- Persistencia de timestamps em ISO e normalizacao de campos numericos.
- IDs de regra FIM sao parte do contrato de observabilidade (`rule_id`, `rule_trace`, `next_trigger`).

## Convencoes no frontend
- Uso de `process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"` como endpoint padrao.
- Bearer token enviado via header `Authorization` na maioria das chamadas.
- Paginas por dominio (`monitor`, `settings`, `notifications`, `stats`).
- Componentes compartilhados em `web-dashboard/src/components`.

## Configuracao e validacao
- Schema de settings centralizado em `src/core/settings_schema.py`.
- Guardrails de combinacao para evitar presets invalidos no Fimathe.
- Config salvo em JSON e snapshot auditado no banco.

## Testes e praticas
- Estrategia mista: pytest para unidade/regressao + scripts manuais para homologacao.
- Testes verificam regra/estado final e eventos esperados.
- `pytest.ini` define `pythonpath=src` para imports diretos dos modulos.

## Pontos de consistencia
- Convencao de nomes mistura ingles e portugues (ex.: `next_trigger`, `perdeu_topo`).
- Existem referencias legadas no codigo (comentarios TODO e blocos antigos).
- CORS aberto e credenciais hardcoded sinalizam fase de desenvolvimento local.

## Convencao de arquivos operacionais
- Estado atual do processo em `config/robot_runtime.json`.
- Snapshot tatico em `logs/fimathe_runtime.json`.
- Log textual de runtime em `logs/robot_runtime.log`.
