"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Beaker, RefreshCw, LayoutDashboard, 
  Trophy, History, Zap, Sparkles, Database 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Modulares (Extraídos na Wave 1)
import CockpitTab from "@/components/lab/CockpitTab";
import LeaderboardTab from "@/components/lab/LeaderboardTab";
import ExplorerTab from "@/components/lab/ExplorerTab";
import DataTab from "@/components/lab/DataTab";
import RunDetailModal from "@/components/lab/RunDetailModal";

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
  
  // State: Tabs
  const [activeTab, setActiveTab] = useState<"cockpit" | "leaderboard" | "explorer" | "data">("cockpit");

  // State: Form
  const [symbol, setSymbol] = useState("ETHUSD");
  const [windowDays, setWindowDays] = useState(7);
  const [preset, setPreset] = useState("FIM-010");
  const [spread, setSpread] = useState(0);
  const [slippage, setSlippage] = useState(0);
  
  // Advanced Fimathe State
  const [beTrigger, setBeTrigger] = useState(50);
  const [targetLock, setTargetLock] = useState(100);
  const [dragMode, setDragMode] = useState(1);
  const [gordurinha, setGordurinha] = useState(10);
  const [trendTimeframe, setTrendTimeframe] = useState("H1");
  const [entryTimeframe, setEntryTimeframe] = useState("M15");
  const [requireGrouping, setRequireGrouping] = useState(true);
  const [requireChannelBreak, setRequireChannelBreak] = useState(true);
  const [requirePullbackRetest, setRequirePullbackRetest] = useState(true);
  const [requireStructuralTrend, setRequireStructuralTrend] = useState(true);
  const [requireSrTouch, setRequireSrTouch] = useState(false);
  const [strictReversalLogic, setStrictReversalLogic] = useState(true);
  const [breakoutBufferPoints, setBreakoutBufferPoints] = useState(10);
  const [pullbackTolerancePoints, setPullbackTolerancePoints] = useState(20);
  const [srTolerancePoints, setSrTolerancePoints] = useState(35);
  const [abLookbackCandles, setAbLookbackCandles] = useState(80);
  const [trendCandles, setTrendCandles] = useState(120);

  const [loading, setLoading] = useState(false);

  // State: Data
  const [runs, setRuns] = useState<LabRun[]>([]);
  const [ranking, setRanking] = useState<RankingRow[]>([]);
  const [symbols, setSymbols] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // State: Modal Detail
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<any>(null);

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    try {
      const [runsRes, rankingRes, symbolsRes] = await Promise.all([
        fetch(`${API_BASE}/lab/runs?limit=24`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/lab/ranking?limit=50`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/api/mt5/symbols`, {
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
      const symbolsJson = await symbolsRes.json();
      
      setRuns(Array.isArray(runsJson?.items) ? runsJson.items : []);
      setRanking(Array.isArray(rankingJson?.items) ? rankingJson.items : []);
      setSymbols(Array.isArray(symbolsJson) ? symbolsJson : []);
    } catch (err: any) {
      console.error("Falha ao carregar dados do Strategy Lab.", err);
    }
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 7000);
    return () => clearInterval(timer);
  }, []);

  const startRun = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
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
          override_config: {
            be_trigger_percent: beTrigger,
            target_lock_percent: targetLock,
            drag_mode: dragMode,
            gordurinha_points: gordurinha,
            trend_timeframe: trendTimeframe,
            entry_timeframe: entryTimeframe,
            require_grouping: requireGrouping,
            require_channel_break: requireChannelBreak,
            require_pullback_retest: requirePullbackRetest,
            require_structural_trend: requireStructuralTrend,
            require_sr_touch: requireSrTouch,
            strict_reversal_logic: strictReversalLogic,
            breakout_buffer_points: breakoutBufferPoints,
            pullback_tolerance_points: pullbackTolerancePoints,
            sr_tolerance_points: srTolerancePoints,
            ab_lookback_candles: abLookbackCandles,
            trend_candles: trendCandles,
          }
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.detail || "Falha ao executar backtest.");
      }

      // UX Premium: Se o run terminou com sucesso, vamos abrir o melhor resultado imediatamente
      if (payload.run && Array.isArray(payload.run.results) && payload.run.results.length > 0) {
        const bestResult = payload.run.results[0];
        // Vincula trades se existirem no payload
        if (Array.isArray(payload.run.trades)) {
          bestResult.trades = payload.run.trades.filter((t: any) => t.result_id === bestResult.id);
        }
        setSelectedResult(bestResult);
        setDetailModalOpen(true);
      } else {
        setActiveTab("explorer"); // Fallback para historico se nao houver resultado imediato
      }
      
      fetchData();
    } catch (err: any) {
      setError(err?.message || "Erro ao executar Strategy Lab.");
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (runId: number) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/lab/runs/${runId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const detail = await res.json();
      if (detail && detail.results && detail.results.length > 0) {
        // Vincula os trades ao melhor resultado
        const bestResult = detail.results[0];
        bestResult.trades = (detail.trades || []).filter((t: any) => t.result_id === bestResult.id);
        
        setSelectedResult(bestResult);
        setDetailModalOpen(true);
      }
    } catch (err) {
      console.error("Erro ao carregar detalhes do run", err);
    }
  };

  const exportRun = async (runId: number) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE}/lab/runs/${runId}/export?format=csv`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Falha ao exportar CSV");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `strategy_lab_run_${runId}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erro no export", err);
    }
  };

  const deleteRun = async (runId: number) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    
    // Captura o simbolo antes de deletar para limpar o ranking se necessário
    const runToDelete = runs.find(r => r.id === runId);
    
    try {
      const res = await fetch(`${API_BASE}/lab/runs/${runId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        setRuns((prev) => prev.filter((r) => r.id !== runId));
        if (runToDelete) {
          setRanking((prev) => prev.filter((r) => r.symbol !== runToDelete.symbol));
        }
      }
    } catch (err) {
      console.error("Erro ao deletar run:", err);
    }
  };

  const deleteAllRuns = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/lab/runs`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setRuns([]);
        setRanking([]);
      }
    } catch (err) {
      console.error("Erro ao limpar historico:", err);
    }
  };

  const tabs = [
    { id: "cockpit", label: "Cockpit", icon: Zap },
    { id: "leaderboard", label: "Leaderboard", icon: Trophy },
    { id: "explorer", label: "Explorer", icon: History },
    { id: "data", label: "Dados", icon: Database },
  ];

  return (
    <div className="space-y-10 pb-20 max-w-[1600px] mx-auto">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
              <Beaker className="w-4 h-4 text-primary" />
            </div>
            <span className="text-primary text-[10px] font-black uppercase tracking-[0.3em]">Ambiente de Simulação</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter flex items-center gap-3">
            STRATEGY <span className="text-primary glow-text">LAB</span>
            <Sparkles className="w-6 h-6 text-primary/40" />
          </h1>
          <p className="text-gray-500 text-sm mt-2 max-w-lg leading-relaxed font-medium">
            O laboratório tático definitivo para estressar suas estratégias Fimathe com variações algorítmicas de mercado.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id 
              ? "bg-primary text-black shadow-[0_0_20px_rgba(0,255,170,0.3)]" 
              : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? "text-black" : "text-gray-500"}`} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass rounded-2xl border border-red-500/30 bg-red-950/20 px-6 py-4 text-sm text-red-200 flex items-center gap-3 overflow-hidden"
          >
            <Zap className="w-5 h-5 text-red-500" />
            <p className="font-medium italic">"{error}"</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Content */}
      <main className="min-h-[500px]">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === "cockpit" && (
            <CockpitTab 
              symbol={symbol} setSymbol={setSymbol}
              symbols={symbols}
              windowDays={windowDays} setWindowDays={setWindowDays}
              preset={preset} setPreset={setPreset}
              spread={spread} setSpread={setSpread}
              slippage={slippage} setSlippage={setSlippage}
              beTrigger={beTrigger} setBeTrigger={setBeTrigger}
              targetLock={targetLock} setTargetLock={setTargetLock}
              dragMode={dragMode} setDragMode={setDragMode}
              gordurinha={gordurinha} setGordurinha={setGordurinha}
              trendTimeframe={trendTimeframe} setTrendTimeframe={setTrendTimeframe}
              entryTimeframe={entryTimeframe} setEntryTimeframe={setEntryTimeframe}
              requireGrouping={requireGrouping} setRequireGrouping={setRequireGrouping}
              requireChannelBreak={requireChannelBreak} setRequireChannelBreak={setRequireChannelBreak}
              requirePullbackRetest={requirePullbackRetest} setRequirePullbackRetest={setRequirePullbackRetest}
              requireStructuralTrend={requireStructuralTrend} setRequireStructuralTrend={setRequireStructuralTrend}
              requireSrTouch={requireSrTouch} setRequireSrTouch={setRequireSrTouch}
              strictReversalLogic={strictReversalLogic} setStrictReversalLogic={setStrictReversalLogic}
              breakoutBufferPoints={breakoutBufferPoints} setBreakoutBufferPoints={setBreakoutBufferPoints}
              pullbackTolerancePoints={pullbackTolerancePoints} setPullbackTolerancePoints={setPullbackTolerancePoints}
              srTolerancePoints={srTolerancePoints} setSrTolerancePoints={setSrTolerancePoints}
              abLookbackCandles={abLookbackCandles} setAbLookbackCandles={setAbLookbackCandles}
              trendCandles={trendCandles} setTrendCandles={setTrendCandles}
              loading={loading}
              onStart={startRun}
            />
          )}
          
          {activeTab === "leaderboard" && (
            <LeaderboardTab ranking={ranking} />
          )}

          {activeTab === "explorer" && (
            <ExplorerTab 
              runs={runs} 
              onOpenDetail={openDetail} 
              onExport={exportRun} 
              onDelete={deleteRun} 
              onDeleteAll={deleteAllRuns}
            />
          )}

          {activeTab === "data" && <DataTab apiBase={API_BASE} />}
        </motion.div>
      </main>

      {/* Details Modal */}
      <AnimatePresence>
        {detailModalOpen && (
          <RunDetailModal 
            isOpen={detailModalOpen} 
            onClose={() => setDetailModalOpen(false)} 
            result={selectedResult} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
