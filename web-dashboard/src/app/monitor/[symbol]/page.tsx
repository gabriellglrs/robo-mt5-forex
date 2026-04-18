'use client';

import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Activity,
  Terminal,
  ShieldAlert,
  Bot,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import LiveChart from '@/components/LiveChart';
import TacticalStats from '@/components/TacticalStats';
import RuleGrid from '@/components/RuleGrid';
import StructuralGauge from '@/components/StructuralGauge';
import NarrativeTerminal from '@/components/NarrativeTerminal';
import type { FimatheAsset, RuntimeSnapshot } from '@/types';

type RuntimeAssetExt = FimatheAsset & {
  sl?: number;
  tp?: number;
};

type ChartBar = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  [key: string]: unknown;
};

type FimatheOverlay = {
  pointA?: number;
  pointB?: number;
  channelMid?: number;
  channelHigh?: number;
  channelLow?: number;
  target50?: number;
  target100?: number;
  sl?: number;
  tp?: number;
  trendDirection?: string;
  currentPrice?: number;
};

function formatPrice(value?: number) {
  if (value === undefined || value === null || Number.isNaN(value)) return '--';
  return value.toFixed(5);
}

function phaseLabel(phase?: string) {
  if (phase === 'monitoramento') return 'Monitoramento';
  if (phase === 'rompimento') return 'Rompimento';
  if (phase === 'entrada') return 'Entrada';
  if (phase === 'gestao_risco') return 'Gestão de Risco';
  if (phase === 'erro') return 'Erro';
  return 'Aguardando';
}

function buildOperationalNarrative(asset?: RuntimeAssetExt) {
  if (!asset) {
    return {
      resumo: 'Aguardando telemetria operacional...',
      leitura: 'O robô está em standby. Aguardando o primeiro ciclo de processamento do ativo.',
      acao: 'Verifique se o robô está ativo e se o ativo está habilitado nas configurações.',
    };
  }

  const trace = asset.rule_trace || {};
  const allRules = Array.from({ length: 16 }, (_, i) => `FIM-${(i + 1).toString().padStart(3, '0')}`);
  const blocked = allRules.filter((id) => trace[id] === 'bloqueado');
  
  const setupState = blocked.length > 0 ? 'ESTADO BLOQUEADO' : 'ESTADO OPERACIONAL';

  const leitura = [
    `Fase: ${phaseLabel(asset.status_phase)}. Tendência: ${asset.trend_direction} (${asset.trend_timeframe}).`,
    `Estrutura: A=${formatPrice(asset.point_a)}, B=${formatPrice(asset.point_b)}, Alvo 100%=${formatPrice(asset.projection_100)}.`,
    asset.status_text || 'Monitorando fluxo técnico de mercado.',
  ].join(' ');

  const acao = asset.next_trigger || 'Aguardar próximo gatilho técnico confirmado pelo motor.';

  return {
    resumo: `${setupState}: ${asset.status_text || 'Analisando mercado.'}`,
    leitura,
    acao,
  };
}

export default function AssetMonitorPage() {
  const params = useParams();
  const symbol = typeof params?.symbol === 'string' ? params.symbol.toUpperCase() : '';
  const [tf, setTf] = useState('M15');
  const [chartData, setChartData] = useState<ChartBar[]>([]);
  const [fimatheData, setFimatheData] = useState<FimatheOverlay>({});
  const [snapshot, setSnapshot] = useState<RuntimeSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
    let active = true;
    const fetchHistory = async () => {
      if (!symbol) return;
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${apiUrl}/api/chart/${symbol}?tf=${tf}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error('MT5 Desconectado');
        const data = await res.json();
        if (active) setChartData(Array.isArray(data) ? data : []);
      } catch (err) {
        if (active) setError('Falha ao sincronizar com MT5.');
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchHistory();
    return () => { active = false; };
  }, [symbol, tf, apiUrl]);

  useEffect(() => {
    if (!symbol) return;
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${apiUrl}/runtime`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!response.ok) return;
        const data = await response.json();
        setSnapshot(data);

        const assetRuntime = (data.symbols?.[symbol] as RuntimeAssetExt | undefined);
        if (assetRuntime) {
          // --- REAL-TIME CHART UPDATE ---
          // Update the last candle with current price from robot
          if (assetRuntime.price) {
            const currentPrice = assetRuntime.price;
            setChartData((prev) => {
              if (prev.length === 0) return prev;
              const last = prev[prev.length - 1];
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...last,
                close: currentPrice,
                high: Math.max(last.high, currentPrice),
                low: Math.min(last.low, currentPrice),
              };
              return updated;
            });
          }

          setFimatheData({
            pointA: assetRuntime.point_a,
            pointB: assetRuntime.point_b,
            channelMid: assetRuntime.channel_mid,
            channelHigh: assetRuntime.channel_high,
            channelLow: assetRuntime.channel_low,
            target50: assetRuntime.projection_50,
            target100: assetRuntime.projection_100,
            sl: assetRuntime.sl,
            tp: assetRuntime.tp,
            trendDirection: assetRuntime.trend_direction,
            currentPrice: assetRuntime.price,
          });
        }
      } catch (err) {
        console.error('Fetch Runtime Error:', err);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 2500);
    return () => clearInterval(interval);
  }, [symbol, apiUrl]);

  const assetRuntime = (snapshot?.symbols?.[symbol] as RuntimeAssetExt | undefined);
  const isRunning = snapshot?.status === 'running';

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1600px] mx-auto p-4 lg:p-6 pb-20">
      {/* Premium Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 glass p-4 px-6 rounded-[24px] border border-white/5"
      >
        <div className="flex items-center gap-4">
          <Link href="/monitor">
            <button className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors group">
              <ArrowLeft className="w-4 h-4 text-gray-400 group-hover:text-white" />
            </button>
          </Link>
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-white tracking-tight">{symbol}</h1>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                Módulo Vigilância
              </div>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Sistema em Tempo Real Fimathe
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
          {['M1', 'M5', 'M15', 'H1'].map((timeframe) => (
            <button
              key={timeframe}
              onClick={() => setTf(timeframe)}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black tracking-widest transition-all ${
                tf === timeframe ? 'bg-white/10 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {timeframe}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Tactical Stats */}
      <TacticalStats 
        price={assetRuntime?.price}
        pnl={assetRuntime?.current_pnl}
        phase={phaseLabel(assetRuntime?.status_phase)}
        isRunning={isRunning}
      />

      {/* Main Command Center Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Left Column: Chart Area (3/4 on XL) */}
        <div className="xl:col-span-3 flex flex-col gap-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-[32px] border border-white/5 p-2 h-[600px] relative overflow-hidden group"
          >
            <div className="absolute top-6 left-6 z-10 flex flex-col gap-1 pointer-events-none">
                <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    <span className="text-xs font-black text-white/50 uppercase tracking-widest">Monitoramento Ativo</span>
                </div>
            </div>

            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-20">
                <RefreshCw className="w-10 h-10 text-primary animate-spin" />
              </div>
            ) : error ? (
              <div className="absolute inset-0 flex items-center justify-center flex-col gap-4 p-8 text-center bg-black/40 z-20">
                <ShieldAlert className="w-12 h-12 text-red-500" />
                <p className="text-red-400 font-black tracking-tight">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 rounded-full border border-red-500/30 text-xs font-bold text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  Tentar Reconectar
                </button>
              </div>
            ) : null}
            
            <div className="w-full h-full rounded-[24px] overflow-hidden">
                <LiveChart data={chartData} fimathe={fimatheData} />
            </div>
          </motion.div>

          {/* Bottom Diagnostics Feed - THE BRAIN */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass p-6 rounded-[32px] border border-white/5 relative overflow-hidden bg-black/40 backdrop-blur-xl h-[300px]"
          >
            {/* Premium Scanning Effect Area */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent animate-scanline opacity-30 z-0" />
            
            <NarrativeTerminal 
              assetRuntime={assetRuntime} 
              recentEvents={snapshot?.recent_events} 
            />
          </motion.div>
        </div>

        {/* Right Column: Tactical Widgets (1/4 on XL) */}
        <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-6"
        >
            {/* Rule Analyzers */}
            <div className="glass p-6 rounded-[32px] border border-white/5">
                <RuleGrid trace={assetRuntime?.rule_trace} />
            </div>

            {/* Fimathe Level Gauge */}
            <div className="glass p-6 rounded-[32px] border border-white/5 bg-gradient-to-b from-transparent to-primary/5">
                <StructuralGauge 
                    currentPrice={assetRuntime?.price}
                    pointA={assetRuntime?.point_a}
                    pointB={assetRuntime?.point_b}
                    target50={assetRuntime?.projection_50}
                    target100={assetRuntime?.projection_100}
                    trendDirection={assetRuntime?.trend_direction}
                    trendTimeframe={assetRuntime?.trend_timeframe}
                />
            </div>

            {/* Control Shortcut Placeholder */}
            <div className="glass p-5 rounded-[28px] border border-white/5 bg-white/5 flex items-center justify-between group cursor-pointer hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center group-hover:bg-red-500/40 transition-colors">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                    </div>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Desligar Ativo</span>
                </div>
                <div className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[8px] font-black text-gray-400">
                    STOP
                </div>
            </div>
        </motion.div>

      </div>
    </div>
  );
}
