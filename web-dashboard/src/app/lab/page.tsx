"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Beaker, Play, RefreshCw } from "lucide-react";

type LabRun = {
  id: number;
  symbol: string;
  window_days: number;
  preset_id: string;
  status: string;
  created_at?: string;
  finished_at?: string;
  error_message?: string | null;
};

type RankingRow = {
  symbol: string;
  window_days: number;
  preset_id: string;
  sample_size: number;
  avg_score: number;
  best_score: number;
  avg_pnl_points: number;
  avg_win_rate: number;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function LabPage() {
  const router = useRouter();
  const [symbol, setSymbol] = useState("ETHUSD");
  const [windowDays, setWindowDays] = useState(7);
  const [preset, setPreset] = useState("FIM-010");
  const [spread, setSpread] = useState(0);
  const [slippage, setSlippage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [runs, setRuns] = useState<LabRun[]>([]);
  const [ranking, setRanking] = useState<RankingRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    setError(null);
    try {
      const [runsRes, rankingRes] = await Promise.all([
        fetch(`${API_BASE}/lab/runs?limit=40`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/lab/ranking?limit=40`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      if (runsRes.status === 401 || rankingRes.status === 401) {
        localStorage.removeItem("token");
        router.push("/login");
        return;
      }
      const runsJson = await runsRes.json();
      const rankingJson = await rankingRes.json();
      setRuns(Array.isArray(runsJson?.items) ? runsJson.items : []);
      setRanking(Array.isArray(rankingJson?.items) ? rankingJson.items : []);
    } catch (err: any) {
      setError(err?.message || "Falha ao carregar dados do Strategy Lab.");
    }
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 7000);
    return () => clearInterval(timer);
  }, []);

  const startRun = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/lab/runs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          symbol,
          window_days: Number(windowDays),
          preset_id: preset,
          spread_model: Number(spread),
          slippage_model: Number(slippage),
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.detail || "Falha ao executar backtest.");
      }
      await fetchData();
    } catch (err: any) {
      setError(err?.message || "Erro ao executar Strategy Lab.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Beaker className="w-4 h-4 text-primary" />
            <span className="text-primary text-[10px] font-black uppercase tracking-[0.2em]">Strategy Lab</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Backtest Multi-Config por Ativo</h1>
        </div>
        <button onClick={fetchData} className="px-3 py-2 rounded-xl border border-white/10 hover:border-primary/30 text-sm text-gray-200 flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      <section className="glass p-6 rounded-2xl border border-white/10 grid grid-cols-1 md:grid-cols-6 gap-3">
        <input className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} placeholder="Ativo (ex.: EURUSD)" />
        <select className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" value={windowDays} onChange={(e) => setWindowDays(Number(e.target.value))}>
          <option value={2}>2 dias</option>
          <option value={7}>7 dias</option>
          <option value={14}>14 dias</option>
        </select>
        <select className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" value={preset} onChange={(e) => setPreset(e.target.value)}>
          <option value="FIM-010">FIM-010</option>
          <option value="FIM-017">FIM-017</option>
          <option value="FIM-018">FIM-018</option>
        </select>
        <input className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" type="number" value={spread} onChange={(e) => setSpread(Number(e.target.value))} placeholder="Spread (pts)" />
        <input className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" type="number" value={slippage} onChange={(e) => setSlippage(Number(e.target.value))} placeholder="Slippage (pts)" />
        <button onClick={startRun} disabled={loading} className="rounded-xl px-3 py-2 text-sm font-bold bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 disabled:opacity-60 flex items-center justify-center gap-2">
          <Play className="w-4 h-4" />
          {loading ? "Executando..." : "Rodar"}
        </button>
      </section>

      {error && <div className="glass rounded-2xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-200">{error}</div>}

      <section className="glass p-6 rounded-2xl border border-white/10">
        <h2 className="text-sm font-black uppercase tracking-widest text-white mb-4">Runs recentes</h2>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-gray-400">
              <tr>
                <th className="text-left py-2">ID</th>
                <th className="text-left py-2">Ativo</th>
                <th className="text-left py-2">Janela</th>
                <th className="text-left py-2">Preset</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Erro</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.id} className="border-t border-white/5">
                  <td className="py-2 text-gray-200">{run.id}</td>
                  <td className="py-2 text-gray-200">{run.symbol}</td>
                  <td className="py-2 text-gray-300">{run.window_days}d</td>
                  <td className="py-2 text-gray-300">{run.preset_id}</td>
                  <td className="py-2">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${run.status === "done" ? "bg-green-500/15 text-green-300" : run.status === "failed" ? "bg-red-500/15 text-red-300" : "bg-yellow-500/15 text-yellow-300"}`}>
                      {run.status}
                    </span>
                  </td>
                  <td className="py-2 text-xs text-red-300">{run.error_message || "-"}</td>
                </tr>
              ))}
              {runs.length === 0 && (
                <tr>
                  <td className="py-4 text-gray-500" colSpan={6}>Nenhum run registrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="glass p-6 rounded-2xl border border-white/10">
        <h2 className="text-sm font-black uppercase tracking-widest text-white mb-4">Ranking agregado</h2>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-gray-400">
              <tr>
                <th className="text-left py-2">Ativo</th>
                <th className="text-left py-2">Janela</th>
                <th className="text-left py-2">Preset</th>
                <th className="text-left py-2">Score médio</th>
                <th className="text-left py-2">Melhor score</th>
                <th className="text-left py-2">PnL médio</th>
                <th className="text-left py-2">Win rate médio</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((row, idx) => (
                <tr key={`${row.symbol}-${row.window_days}-${row.preset_id}-${idx}`} className="border-t border-white/5">
                  <td className="py-2 text-gray-200">{row.symbol}</td>
                  <td className="py-2 text-gray-300">{row.window_days}d</td>
                  <td className="py-2 text-gray-300">{row.preset_id}</td>
                  <td className="py-2 text-primary font-semibold">{row.avg_score}</td>
                  <td className="py-2 text-gray-200">{row.best_score}</td>
                  <td className="py-2 text-gray-300">{row.avg_pnl_points}</td>
                  <td className="py-2 text-gray-300">{row.avg_win_rate}%</td>
                </tr>
              ))}
              {ranking.length === 0 && (
                <tr>
                  <td className="py-4 text-gray-500" colSpan={7}>Sem ranking ainda. Rode um backtest.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
