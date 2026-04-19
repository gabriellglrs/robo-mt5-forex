from __future__ import annotations

from copy import deepcopy


class SettingsValidationError(Exception):
    def __init__(self, errors: list[str]):
        super().__init__("invalid_settings")
        self.errors = errors


def _to_int(value, path: str, errors: list[str]) -> int | None:
    try:
        return int(value)
    except (TypeError, ValueError):
        errors.append(f"{path}: valor invalido '{value}' (esperado inteiro).")
        return None


def _to_float(value, path: str, errors: list[str]) -> float | None:
    try:
        return float(value)
    except (TypeError, ValueError):
        errors.append(f"{path}: valor invalido '{value}' (esperado numero).")
        return None


def _validate_range(
    value: int | float | None,
    path: str,
    minimum: int | float,
    maximum: int | float,
    errors: list[str],
) -> None:
    if value is None:
        return
    if value < minimum or value > maximum:
        errors.append(f"{path}: fora da faixa permitida [{minimum}, {maximum}].")


def validate_and_normalize_settings(settings: dict) -> dict:
    if not isinstance(settings, dict):
        raise SettingsValidationError(["settings: payload precisa ser um objeto JSON."])

    normalized = deepcopy(settings)
    errors: list[str] = []

    analysis = normalized.setdefault("analysis", {})
    signal_logic = normalized.setdefault("signal_logic", {})
    risk_management = normalized.setdefault("risk_management", {})
    notifications = normalized.setdefault("notifications", {})

    if not isinstance(analysis, dict):
        errors.append("analysis: precisa ser um objeto.")
        analysis = {}
        normalized["analysis"] = analysis
    if not isinstance(signal_logic, dict):
        errors.append("signal_logic: precisa ser um objeto.")
        signal_logic = {}
        normalized["signal_logic"] = signal_logic
    if not isinstance(risk_management, dict):
        errors.append("risk_management: precisa ser um objeto.")
        risk_management = {}
        normalized["risk_management"] = risk_management
    if not isinstance(notifications, dict):
        errors.append("notifications: precisa ser um objeto.")
        notifications = {}
        normalized["notifications"] = notifications

    # FIMATHE - janelas principais
    ab_lookback = _to_int(analysis.get("ab_lookback_candles", 80), "analysis.ab_lookback_candles", errors)
    trend_candles = _to_int(analysis.get("trend_candles", 200), "analysis.trend_candles", errors)
    _validate_range(ab_lookback, "analysis.ab_lookback_candles", 7, 300, errors)
    _validate_range(trend_candles, "analysis.trend_candles", 5, 300, errors)
    if ab_lookback is not None:
        analysis["ab_lookback_candles"] = ab_lookback
    if trend_candles is not None:
        analysis["trend_candles"] = trend_candles

    # Parâmetros de suporte e spread
    sr_tolerance = _to_int(signal_logic.get("sr_tolerance_points", 35), "signal_logic.sr_tolerance_points", errors)
    max_spread = _to_int(signal_logic.get("max_spread_points", 30), "signal_logic.max_spread_points", errors)
    breakout_buffer = _to_int(signal_logic.get("breakout_buffer_points", 10), "signal_logic.breakout_buffer_points", errors)
    pullback_tolerance = _to_int(signal_logic.get("pullback_tolerance_points", 20), "signal_logic.pullback_tolerance_points", errors)
    slope_min = _to_float(signal_logic.get("trend_min_slope_points", 0.20), "signal_logic.trend_min_slope_points", errors)
    _validate_range(sr_tolerance, "signal_logic.sr_tolerance_points", 1, 2000, errors)
    _validate_range(max_spread, "signal_logic.max_spread_points", 0, 2000, errors)
    _validate_range(breakout_buffer, "signal_logic.breakout_buffer_points", 0, 2000, errors)
    _validate_range(pullback_tolerance, "signal_logic.pullback_tolerance_points", 1, 2000, errors)
    _validate_range(slope_min, "signal_logic.trend_min_slope_points", 0.01, 5000.0, errors)
    if sr_tolerance is not None:
        signal_logic["sr_tolerance_points"] = sr_tolerance
    if max_spread is not None:
        signal_logic["max_spread_points"] = max_spread
    if breakout_buffer is not None:
        signal_logic["breakout_buffer_points"] = breakout_buffer
    if pullback_tolerance is not None:
        signal_logic["pullback_tolerance_points"] = pullback_tolerance
    if slope_min is not None:
        signal_logic["trend_min_slope_points"] = slope_min

    # Gestão de risco básica
    max_positions = _to_int(risk_management.get("max_open_positions", 1), "risk_management.max_open_positions", errors)
    cooldown = _to_int(risk_management.get("symbol_cooldown_seconds", 300), "risk_management.symbol_cooldown_seconds", errors)
    risk_percent = _to_float(risk_management.get("risk_percent", 1), "risk_management.risk_percent", errors)
    _validate_range(max_positions, "risk_management.max_open_positions", 1, 50, errors)
    _validate_range(cooldown, "risk_management.symbol_cooldown_seconds", 0, 86400, errors)
    _validate_range(risk_percent, "risk_management.risk_percent", 0.01, 3.0, errors)
    if max_positions is not None:
        risk_management["max_open_positions"] = max_positions
    if cooldown is not None:
        risk_management["symbol_cooldown_seconds"] = cooldown
    if risk_percent is not None:
        risk_management["risk_percent"] = risk_percent

    # Notificacoes operacionais MVP
    notifications["enabled"] = bool(notifications.get("enabled", True))
    min_priority = str(notifications.get("min_priority", "P2")).upper()
    if min_priority not in {"P1", "P2", "P3"}:
        errors.append("notifications.min_priority: valores validos P1, P2 ou P3.")
    else:
        notifications["min_priority"] = min_priority

    categories = notifications.get("categories", {})
    if not isinstance(categories, dict):
        errors.append("notifications.categories: precisa ser um objeto.")
        categories = {}
    notifications["categories"] = {
        "execution": bool(categories.get("execution", True)),
        "risk": bool(categories.get("risk", True)),
        "health": bool(categories.get("health", True)),
        "setup": bool(categories.get("setup", False)),
    }

    telegram = notifications.get("telegram", {})
    if not isinstance(telegram, dict):
        errors.append("notifications.telegram: precisa ser um objeto.")
        telegram = {}
    timeout_seconds = _to_float(telegram.get("timeout_seconds", 2.5), "notifications.telegram.timeout_seconds", errors)
    retries = _to_int(telegram.get("retries", 2), "notifications.telegram.retries", errors)
    _validate_range(timeout_seconds, "notifications.telegram.timeout_seconds", 0.5, 30.0, errors)
    _validate_range(retries, "notifications.telegram.retries", 0, 5, errors)
    notifications["telegram"] = {
        "bot_token": str(telegram.get("bot_token") or ""),
        "chat_id": str(telegram.get("chat_id") or ""),
        "timeout_seconds": timeout_seconds if timeout_seconds is not None else 2.5,
        "retries": retries if retries is not None else 2,
    }

    # Guardrails de combinacao: evita presets com risco alto de bloqueio total de sinais
    require_grouping = bool(signal_logic.get("require_grouping", True))
    require_pullback = bool(signal_logic.get("require_pullback_retest", True))
    require_sr_touch = bool(signal_logic.get("require_sr_touch", True))
    strict_reversal = bool(signal_logic.get("strict_reversal_logic", True))
    require_structural = bool(signal_logic.get("require_structural_trend", True))
    require_breakout = bool(signal_logic.get("require_channel_break", True))
    trend_tf = str(signal_logic.get("trend_timeframe", "H1")).upper()
    entry_tf = str(signal_logic.get("entry_timeframe", "M15")).upper()

    if (
        trend_tf == "M15"
        and entry_tf == "M1"
        and require_grouping
        and require_pullback
        and require_sr_touch
        and strict_reversal
        and require_structural
    ):
        errors.append(
            "combo invalido: Scalper M15/M1 com FIM-006/008/011/015/016 todos ativos tende a bloquear entradas. "
            "Desative ao menos 1 filtro de confluencia."
        )

    if (
        breakout_buffer is not None
        and pullback_tolerance is not None
        and pullback_tolerance < breakout_buffer
    ):
        errors.append(
            "combo invalido: signal_logic.pullback_tolerance_points menor que breakout_buffer_points restringe o reteste."
        )

    if require_sr_touch and sr_tolerance is not None and sr_tolerance < 10:
        errors.append("combo invalido: signal_logic.sr_tolerance_points < 10 com FIM-008 ativo torna o toque S/R excessivamente restritivo.")

    if (
        require_breakout
        and breakout_buffer is not None
        and sr_tolerance is not None
        and breakout_buffer > sr_tolerance
    ):
        errors.append(
            "combo invalido: breakout_buffer_points maior que sr_tolerance_points com FIM-007/FIM-008 ativos cria conflito de gatilho."
        )

    if strict_reversal and require_structural and slope_min is not None and slope_min > 1.5:
        errors.append(
            "combo invalido: trend_min_slope_points muito alto (>1.5) com FIM-015/FIM-016 ativos bloqueia reversoes e tendencia em conjunto."
        )

    raw_symbols = analysis.get("symbols", [])
    symbols = []
    if isinstance(raw_symbols, str):
        symbols = [item.strip().upper() for item in raw_symbols.split(",") if item.strip()]
    elif isinstance(raw_symbols, list):
        symbols = [str(item).strip().upper() for item in raw_symbols if str(item).strip()]
    has_crypto = any(sym.endswith("USD") and (sym.startswith("BTC") or sym.startswith("ETH")) for sym in symbols)
    if has_crypto and max_spread is not None and max_spread < 20:
        errors.append(
            "combo invalido: max_spread_points < 20 para BTC/ETH costuma bloquear operacoes por spread em cripto."
        )

    if errors:
        raise SettingsValidationError(errors)
    return normalized
