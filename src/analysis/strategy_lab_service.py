from __future__ import annotations

import json
import os
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import MetaTrader5 as mt5
import pandas as pd

from src.analysis.strategy_lab import (
    config_hash,
    estimate_bars_for_days,
    normalize_timeframe,
    run_matrix_backtest,
)
from src.core.database import DatabaseManager


class StrategyLabService:
    def __init__(self, db: Optional[DatabaseManager] = None):
        self.db = db or DatabaseManager()

    def _ensure_mt5(self) -> bool:
        if mt5.initialize():
            return True
        return bool(mt5.initialize())

    def _mt5_timeframe(self, timeframe: str) -> int:
        tf = normalize_timeframe(timeframe)
        tf_map = {
            "M1": mt5.TIMEFRAME_M1,
            "M5": mt5.TIMEFRAME_M5,
            "M15": mt5.TIMEFRAME_M15,
            "M30": mt5.TIMEFRAME_M30,
            "H1": mt5.TIMEFRAME_H1,
            "H4": mt5.TIMEFRAME_H4,
            "D1": mt5.TIMEFRAME_D1,
        }
        return tf_map.get(tf, mt5.TIMEFRAME_M15)

    def _fetch_candles(self, symbol: str, timeframe: str, window_days: int) -> pd.DataFrame:
        """Busca dados historicos do MT5 ou do Cache Local."""
        symbol_upper = symbol.upper()
        normalized_tf = normalize_timeframe(timeframe)
        cache = self.db.get_lab_local_data(symbol_upper, normalized_tf)
        
        # Se temos cache e ele tem menos de 6 horas, usamos
        if cache:
            last_sync = cache["last_sync"]
            if (datetime.now() - last_sync).total_seconds() < 6 * 3600:
                print(f"[StrategyLab] Usando cache local para {symbol_upper} (Sync: {last_sync})")
                df = pd.DataFrame(cache["candles"])
                # Filtrar apenas as ultimas window_days do cache (que tem 14 dias)
                cutoff = datetime.now() - timedelta(days=window_days)
                df['time'] = pd.to_datetime(df['time'], unit='s')
                df = df[df['time'] >= cutoff]
                return df

        # Fallback para MT5 (ou se cache expirou)
        if not self._ensure_mt5():
            raise RuntimeError("MT5 indisponivel para obter historico.")

        print(f"[StrategyLab] Buscando dados REAIS do MT5 para {symbol_upper}...")
        bars = estimate_bars_for_days(window_days, timeframe)
        mt5_tf = self._mt5_timeframe(timeframe)
        rates = mt5.copy_rates_from_pos(
            symbol_upper, mt5_tf, 0, bars
        )
        if rates is None or len(rates) == 0:
            mt5.symbol_select(symbol_upper, True)
            rates = mt5.copy_rates_from_pos(symbol_upper, mt5_tf, 0, bars)
        if rates is None or len(rates) == 0:
            raise RuntimeError(f"Falha ao obter candles para {symbol_upper}")

        df = pd.DataFrame(rates)
        df["time"] = pd.to_datetime(df["time"], unit="s")
        return df

    def sync_all_symbols(self, window_days: int = 14) -> Dict[str, Any]:
        """Sincroniza todos os ativos monitorados no Data Lake local."""
        from src.api.main import SETTINGS_FILE # Evita circular import
        if not self._ensure_mt5():
            return {"error": "MT5 indisponivel para sincronizacao."}
        
        if not os.path.exists(SETTINGS_FILE):
            return {"error": "Arquivo de configuracao nao encontrado."}
            
        with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
            settings = json.load(f)
            
        symbols = settings.get("analysis", {}).get("symbols", [])
        results = {}
        
        for symbol in symbols:
            try:
                # Sempre baixamos em M15 (padrao ouro para lab)
                bars = estimate_bars_for_days(window_days, "M15")
                rates = mt5.copy_rates_from_pos(symbol.upper(), mt5.TIMEFRAME_M15, 0, bars)
                
                if rates is not None and len(rates) > 0:
                    candles_list = []
                    for r in rates:
                        candles_list.append({
                            "time": int(r['time']),
                            "open": float(r['open']),
                            "high": float(r['high']),
                            "low": float(r['low']),
                            "close": float(r['close']),
                            "tick_volume": int(r['tick_volume'])
                        })
                    
                    self.db.save_lab_local_data(symbol, "M15", candles_list)
                    results[symbol] = "success"
                else:
                    results[symbol] = "failed"
            except Exception as e:
                results[symbol] = f"error: {str(e)}"
        
        return results

    def _point_value(self, symbol: str) -> float:
        info = mt5.symbol_info(symbol.upper())
        return float(getattr(info, "point", 0.0001) or 0.0001)

    def execute_run(
        self,
        symbol: str,
        window_days: int,
        preset_id: str,
        override_config: Optional[Dict[str, Any]] = None,
        spread_model: float = 0.0,
        slippage_model: float = 0.0,
        timeframe: str = "M15",
        include_pairwise: bool = True,
    ) -> Dict[str, Any]:
        symbol_upper = str(symbol).upper()
        override = dict(override_config or {})
        run_hash = config_hash(
            {
                "symbol": symbol_upper,
                "window_days": int(window_days),
                "preset_id": str(preset_id),
                "spread_model": float(spread_model),
                "slippage_model": float(slippage_model),
                "timeframe": str(timeframe).upper(),
                "override_config": override,
            }
        )
        run_id = self.db.create_lab_run(
            symbol=symbol_upper,
            window_days=int(window_days),
            preset_id=str(preset_id),
            spread_model=float(spread_model),
            slippage_model=float(slippage_model),
            config_snapshot=override,
            config_hash=run_hash,
        )
        if not run_id:
            raise RuntimeError("Falha ao criar run no banco.")

        self.db.update_lab_run_status(run_id=run_id, status="running")
        try:
            candles = self._fetch_candles(symbol=symbol_upper, timeframe=timeframe, window_days=int(window_days))
            base_config = dict(override)
            # Strategy Lab nao possui SR dinamico; manter FIM-008 OFF por padrao evita zero trades artificiais.
            base_config.setdefault("require_sr_touch", False)
            base_config["preset_id"] = str(preset_id)
            results = run_matrix_backtest(
                symbol=symbol_upper,
                candles_df=candles[["time", "open", "high", "low", "close", "tick_volume"]],
                base_config=base_config,
                point_value=self._point_value(symbol_upper),
                spread_points=float(spread_model),
                slippage_points=float(slippage_model),
                include_pairwise=bool(include_pairwise),
            )
            for item in results:
                metrics = dict(item["metrics"])
                score_breakdown = metrics.pop("score_breakdown", {})
                result_id = self.db.save_lab_result(
                    run_id=run_id,
                    symbol=symbol_upper,
                    window_days=int(window_days),
                    preset_id=str(item.get("preset_id")),
                    config_hash=str(item.get("config_hash")),
                    score=float(item["metrics"].get("score", 0.0)),
                    score_breakdown=score_breakdown,
                    metrics=metrics,
                )
                if not result_id:
                    continue
                for trade in item["trades"]:
                    self.db.save_lab_trade(
                        run_id=run_id,
                        result_id=result_id,
                        trade=trade,
                    )
            self.db.update_lab_run_status(run_id=run_id, status="done")
        except Exception as exc:
            self.db.update_lab_run_status(run_id=run_id, status="failed", error_message=str(exc))
            raise
        detail = self.db.get_lab_run_detail(run_id)
        detail["finished_at_runtime"] = datetime.now().isoformat(timespec="seconds")
        return detail

    def list_runs(self, limit: int = 100, symbol: Optional[str] = None, window_days: Optional[int] = None, preset_id: Optional[str] = None) -> List[Dict[str, Any]]:
        return self.db.get_lab_runs(limit=limit, symbol=symbol, window_days=window_days, preset_id=preset_id)

    def run_detail(self, run_id: int) -> Dict[str, Any]:
        return self.db.get_lab_run_detail(run_id)

    def ranking(self, symbol: Optional[str] = None, window_days: Optional[int] = None, preset_id: Optional[str] = None, limit: int = 100) -> List[Dict[str, Any]]:
        return self.db.get_lab_ranking(symbol=symbol, window_days=window_days, preset_id=preset_id, limit=limit)

    def delete_run(self, run_id: int) -> bool:
        return self.db.delete_lab_run(run_id)

    def delete_all(self) -> bool:
        return self.db.delete_all_lab_runs()
