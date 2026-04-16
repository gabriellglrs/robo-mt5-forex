import logging

import MetaTrader5 as mt5
import numpy as np
import pandas as pd


class SignalDetector:
    """Motor de sinais alinhado a estrategia Fimathe."""

    def __init__(self, symbol, settings):
        self.symbol = symbol
        self.settings = settings
        self.logger = logging.getLogger("SignalDetector")
        symbol_info = mt5.symbol_info(symbol)
        self.point = symbol_info.point if symbol_info and symbol_info.point else 0.00001

    def _get_timeframe_code(self, tf_string):
        mapping = {
            "M1": mt5.TIMEFRAME_M1,
            "M5": mt5.TIMEFRAME_M5,
            "M15": mt5.TIMEFRAME_M15,
            "M30": mt5.TIMEFRAME_M30,
            "H1": mt5.TIMEFRAME_H1,
            "H4": mt5.TIMEFRAME_H4,
            "D1": mt5.TIMEFRAME_D1,
        }
        return mapping.get(str(tf_string).upper(), mt5.TIMEFRAME_M15)

    def _load_rates(self, timeframe, count):
        tf_code = self._get_timeframe_code(timeframe)
        rates = mt5.copy_rates_from_pos(self.symbol, tf_code, 0, int(count))
        if rates is None or len(rates) < 5:
            return None
        return pd.DataFrame(rates)

    def get_nearest_level_distance_points(self, price, levels):
        if not levels:
            return None
        nearest_distance = min(abs(price - level) for level in levels)
        if not self.point:
            return None
        return nearest_distance / float(self.point)

    def _detect_trend(self, trend_df):
        closes = trend_df["close"].astype(float).values
        x_axis = np.arange(len(closes), dtype=float)
        slope_price = np.polyfit(x_axis, closes, 1)[0]
        slope_points = slope_price / float(self.point)

        min_slope = float(self.settings.get("trend_min_slope_points", 0.20))
        if slope_points >= min_slope:
            return "BUY", slope_points
        if slope_points <= -min_slope:
            return "SELL", slope_points
        return None, slope_points

    def _build_ab_projection(self, trend_df, trend_direction):
        lookback = max(30, int(self.settings.get("ab_lookback_candles", 80)))
        window = trend_df.tail(lookback)

        point_a = float(window["high"].max())
        point_b = float(window["low"].min())
        channel_size = max(float(point_a - point_b), float(self.point) * 20.0)

        if trend_direction == "BUY":
            projection_50 = point_a + (channel_size * 0.50)
            projection_80 = point_a + (channel_size * 0.80)
            projection_85 = point_a + (channel_size * 0.85)
            projection_100 = point_a + (channel_size * 1.00)
        else:
            projection_50 = point_b - (channel_size * 0.50)
            projection_80 = point_b - (channel_size * 0.80)
            projection_85 = point_b - (channel_size * 0.85)
            projection_100 = point_b - (channel_size * 1.00)

        return {
            "point_a": point_a,
            "point_b": point_b,
            "channel_size": channel_size,
            "projection_50": projection_50,
            "projection_80": projection_80,
            "projection_85": projection_85,
            "projection_100": projection_100,
        }

    def _calc_grouping(self, entry_df):
        grouping_window = max(5, int(self.settings.get("grouping_window_candles", 12)))
        grouping_range_max = max(5.0, float(self.settings.get("grouping_range_max_points", 180)))
        grouping_body_max = max(1.0, float(self.settings.get("grouping_body_max_points", 60)))

        grouping_slice = entry_df.tail(grouping_window)
        grouping_range_points = (float(grouping_slice["high"].max()) - float(grouping_slice["low"].min())) / float(self.point)
        grouping_body_points = (
            (grouping_slice["close"].astype(float) - grouping_slice["open"].astype(float)).abs().mean() / float(self.point)
        )

        grouping_ok = bool(grouping_range_points <= grouping_range_max and grouping_body_points <= grouping_body_max)
        return {
            "grouping_ok": grouping_ok,
            "grouping_range_points": round(float(grouping_range_points), 2),
            "grouping_body_points": round(float(grouping_body_points), 2),
            "grouping_window_candles": grouping_window,
        }

    def _nearest_trade_region_points(self, current_price, projection_map):
        levels = [
            projection_map.get("point_a"),
            projection_map.get("point_b"),
            projection_map.get("projection_50"),
            projection_map.get("projection_80"),
            projection_map.get("projection_85"),
            projection_map.get("projection_100"),
        ]
        levels = [float(level) for level in levels if level is not None]
        if not levels:
            return None
        nearest_distance = min(abs(current_price - level) for level in levels)
        return nearest_distance / float(self.point)

    def _resolve_rule_meta(self, reason, signal=None):
        mapping = {
            "setup_pronto": (
                "FIM-008",
                "Confluencia valida",
                "Executar entrada com risco controlado.",
            ),
            "sem_dados_timeframe": (
                "FIM-001",
                "Coleta de dados",
                "Aguardar mais candles no timeframe maior e menor.",
            ),
            "mercado_lateral": (
                "FIM-002",
                "Classificacao de mercado",
                "Aguardar tendencia clara para liberar operacao.",
            ),
            "sem_regiao_ab": (
                "FIM-003",
                "Regiao A/B",
                "Aguardar consolidacao valida para marcar ponto-A e ponto-B.",
            ),
            "fora_da_regiao_negociavel": (
                "FIM-005",
                "Regiao negociavel",
                "Aguardar preco voltar para regiao A/B ou projecoes 50-100.",
            ),
            "aguardando_agrupamento": (
                "FIM-006",
                "Agrupamento",
                "Aguardar consolidacao no timeframe menor.",
            ),
            "aguardando_rompimento_canal": (
                "FIM-007",
                "Rompimento e reteste",
                "Aguardar rompimento do canal com buffer tecnico.",
            ),
            "aguardando_pullback": (
                "FIM-007",
                "Rompimento e reteste",
                "Aguardar pullback/reteste dentro da tolerancia.",
            ),
            "longe_do_nivel_sr": (
                "FIM-008",
                "Regra anti-achometro",
                "Aguardar toque/regiao S-R para completar confluencia.",
            ),
        }

        default_meta = ("FIM-014", "Transparencia operacional", "Monitorar proximo gatilho tecnico.")
        rule_id, rule_name, next_trigger = mapping.get(reason, default_meta)
        if signal:
            rule_id, rule_name, next_trigger = mapping["setup_pronto"]
        return {
            "rule_id": rule_id,
            "rule_name": rule_name,
            "next_trigger": next_trigger,
        }

    def evaluate_signal_details(self, current_price, levels, indicators=None):
        """Retorna diagnostico completo do setup Fimathe."""
        trend_tf = self.settings.get("trend_timeframe", "H1")
        entry_tf = self.settings.get("entry_timeframe", "M15")
        trend_candles = max(50, int(self.settings.get("trend_candles", 200)))
        entry_lookback = max(20, int(self.settings.get("entry_lookback_candles", 50)))

        breakout_points = int(self.settings.get("breakout_buffer_points", 10))
        pullback_tolerance = int(self.settings.get("pullback_tolerance_points", 20))
        require_breakout = bool(self.settings.get("require_channel_break", True))
        require_pullback = bool(self.settings.get("require_pullback_retest", True))

        tolerance_points = int(self.settings.get("sr_tolerance_points", 35))
        require_sr_touch = bool(self.settings.get("require_sr_touch", True))
        require_grouping = bool(self.settings.get("require_grouping", True))

        nearest_level_points = self.get_nearest_level_distance_points(current_price, levels)
        near_sr = nearest_level_points is not None and nearest_level_points <= float(tolerance_points)

        trend_df = self._load_rates(trend_tf, trend_candles + 20)
        entry_df = self._load_rates(entry_tf, entry_lookback + 20)

        if trend_df is None or entry_df is None:
            reason = "sem_dados_timeframe"
            return {
                "signal": None,
                "reason": reason,
                "mode": "FIMATHE",
                "timeframes_expected": [trend_tf, entry_tf],
                "timeframes_received": [],
                "tf_results": {},
                "near_sr": near_sr,
                "sr_tolerance_points": tolerance_points,
                "nearest_level_points": nearest_level_points,
                "trend_timeframe": trend_tf,
                "entry_timeframe": entry_tf,
                "rule_trace": {"FIM-001": "bloqueado"},
                **self._resolve_rule_meta(reason),
            }

        trend_direction, slope_points = self._detect_trend(trend_df.tail(trend_candles))
        if trend_direction is None:
            reason = "mercado_lateral"
            return {
                "signal": None,
                "reason": reason,
                "mode": "FIMATHE",
                "timeframes_expected": [trend_tf, entry_tf],
                "timeframes_received": [trend_tf, entry_tf],
                "tf_results": {
                    trend_tf: {
                        "trend_direction": "LATERAL",
                        "trend_slope_points": round(float(slope_points), 2),
                    }
                },
                "near_sr": near_sr,
                "sr_tolerance_points": tolerance_points,
                "nearest_level_points": nearest_level_points,
                "trend_timeframe": trend_tf,
                "entry_timeframe": entry_tf,
                "rule_trace": {
                    "FIM-001": "ok",
                    "FIM-002": "bloqueado_lateral",
                },
                **self._resolve_rule_meta(reason),
            }

        projection_map = self._build_ab_projection(trend_df, trend_direction)
        if projection_map.get("point_a") is None or projection_map.get("point_b") is None:
            reason = "sem_regiao_ab"
            return {
                "signal": None,
                "reason": reason,
                "mode": "FIMATHE",
                "timeframes_expected": [trend_tf, entry_tf],
                "timeframes_received": [trend_tf, entry_tf],
                "tf_results": {
                    trend_tf: {
                        "trend_direction": trend_direction,
                        "trend_slope_points": round(float(slope_points), 2),
                    }
                },
                "near_sr": near_sr,
                "sr_tolerance_points": tolerance_points,
                "nearest_level_points": nearest_level_points,
                "trend_timeframe": trend_tf,
                "entry_timeframe": entry_tf,
                "rule_trace": {
                    "FIM-001": "ok",
                    "FIM-002": "ok",
                    "FIM-003": "bloqueado",
                },
                **self._resolve_rule_meta(reason),
            }

        nearest_trade_region_points = self._nearest_trade_region_points(current_price, projection_map)
        near_trade_region = nearest_trade_region_points is not None and nearest_trade_region_points <= float(tolerance_points)

        entry_window = entry_df.tail(entry_lookback)
        channel_high = float(entry_window["high"].max())
        channel_low = float(entry_window["low"].min())
        channel_mid = (channel_high + channel_low) / 2.0

        last_candle = entry_window.iloc[-1]
        last_high = float(last_candle["high"])
        last_low = float(last_candle["low"])

        grouping_map = self._calc_grouping(entry_df)

        breakout_buffer_price = breakout_points * float(self.point)
        pullback_tolerance_price = pullback_tolerance * float(self.point)

        if trend_direction == "BUY":
            breakout_ok = (current_price >= (channel_mid + breakout_buffer_price)) if require_breakout else True
            pullback_ok = (last_low <= (channel_mid + pullback_tolerance_price)) if require_pullback else True
            candidate_signal = "BUY"
        else:
            breakout_ok = (current_price <= (channel_mid - breakout_buffer_price)) if require_breakout else True
            pullback_ok = (last_high >= (channel_mid - pullback_tolerance_price)) if require_pullback else True
            candidate_signal = "SELL"

        base_payload = {
            "signal": None,
            "mode": "FIMATHE",
            "timeframes_expected": [trend_tf, entry_tf],
            "timeframes_received": [trend_tf, entry_tf],
            "tf_results": {
                trend_tf: {
                    "trend_direction": trend_direction,
                    "trend_slope_points": round(float(slope_points), 2),
                    "point_a": round(float(projection_map["point_a"]), 5),
                    "point_b": round(float(projection_map["point_b"]), 5),
                    "projection_50": round(float(projection_map["projection_50"]), 5),
                    "projection_80": round(float(projection_map["projection_80"]), 5),
                    "projection_85": round(float(projection_map["projection_85"]), 5),
                    "projection_100": round(float(projection_map["projection_100"]), 5),
                },
                entry_tf: {
                    "channel_mid": round(float(channel_mid), 5),
                    "breakout_ok": breakout_ok,
                    "pullback_ok": pullback_ok,
                    "grouping_ok": grouping_map["grouping_ok"],
                    "grouping_range_points": grouping_map["grouping_range_points"],
                },
            },
            "near_sr": near_sr,
            "sr_tolerance_points": tolerance_points,
            "nearest_level_points": nearest_level_points,
            "near_trade_region": near_trade_region,
            "nearest_trade_region_points": nearest_trade_region_points,
            "trend_timeframe": trend_tf,
            "entry_timeframe": entry_tf,
            "trend_direction": trend_direction,
            "trend_slope_points": round(float(slope_points), 2),
            "channel_high": channel_high,
            "channel_low": channel_low,
            "channel_mid": channel_mid,
            "breakout_ok": breakout_ok,
            "pullback_ok": pullback_ok,
            "grouping_ok": grouping_map["grouping_ok"],
            "grouping_range_points": grouping_map["grouping_range_points"],
            "grouping_body_points": grouping_map["grouping_body_points"],
            "grouping_window_candles": grouping_map["grouping_window_candles"],
            "point_a": projection_map["point_a"],
            "point_b": projection_map["point_b"],
            "projection_50": projection_map["projection_50"],
            "projection_80": projection_map["projection_80"],
            "projection_85": projection_map["projection_85"],
            "projection_100": projection_map["projection_100"],
            "candidate_signal": candidate_signal,
            "rule_trace": {
                "FIM-001": "ok",
                "FIM-002": "ok",
                "FIM-003": "ok",
                "FIM-004": "ok",
                "FIM-005": "ok" if near_trade_region else "bloqueado",
                "FIM-006": "ok" if grouping_map["grouping_ok"] or (not require_grouping) else "bloqueado",
                "FIM-007": "ok" if (breakout_ok and pullback_ok) else "bloqueado",
                "FIM-008": "ok",
            },
        }

        if not near_trade_region:
            base_payload["reason"] = "fora_da_regiao_negociavel"
            base_payload.update(self._resolve_rule_meta(base_payload["reason"]))
            base_payload["rule_trace"]["FIM-008"] = "bloqueado"
            return base_payload

        if require_grouping and not grouping_map["grouping_ok"]:
            base_payload["reason"] = "aguardando_agrupamento"
            base_payload.update(self._resolve_rule_meta(base_payload["reason"]))
            base_payload["rule_trace"]["FIM-008"] = "bloqueado"
            return base_payload

        if not breakout_ok:
            base_payload["reason"] = "aguardando_rompimento_canal"
            base_payload.update(self._resolve_rule_meta(base_payload["reason"]))
            base_payload["rule_trace"]["FIM-008"] = "bloqueado"
            return base_payload

        if not pullback_ok:
            base_payload["reason"] = "aguardando_pullback"
            base_payload.update(self._resolve_rule_meta(base_payload["reason"]))
            base_payload["rule_trace"]["FIM-008"] = "bloqueado"
            return base_payload

        if require_sr_touch and not near_sr:
            base_payload["reason"] = "longe_do_nivel_sr"
            base_payload.update(self._resolve_rule_meta(base_payload["reason"]))
            base_payload["rule_trace"]["FIM-008"] = "bloqueado"
            return base_payload

        base_payload["signal"] = candidate_signal
        base_payload["reason"] = "setup_pronto"
        base_payload.update(self._resolve_rule_meta(base_payload["reason"], signal=candidate_signal))
        return base_payload

    def get_signal(self, current_price, levels, indicators=None):
        details = self.evaluate_signal_details(current_price, levels, indicators)
        final_signal = details.get("signal")
        if final_signal:
            self.logger.info(
                f"SINAL FIMATHE: {final_signal} em {current_price:.5f} | "
                f"trend={details.get('trend_direction')} slope={details.get('trend_slope_points')}"
            )
            return final_signal
        return None
