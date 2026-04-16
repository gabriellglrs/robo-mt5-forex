"use client";

import React, { useEffect, useState } from 'react';
import { 
  Activity, 
  ChevronRight, 
  Map, 
  Target, 
  Layers,
  Info,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { RuntimeSnapshot, FimatheAsset } from '@/types';

function AssetFimatheCard({ asset }: { asset: FimatheAsset }) {
  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'monitoramento': return 'text-primary';
      case 'entrada': return 'text-secondary';
      case 'gestao_risco': return 'text-accent';
      case 'erro': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  const getGlowColor = (phase: string) => {
    switch (phase) {
      case 'monitoramento': return 'shadow-[0_0_15px_rgba(0,255,170,0.2)]';
      case 'entrada': return 'shadow-[0_0_15px_rgba(0,163,255,0.2)]';
      case 'gestao_risco': return 'shadow-[0_0_15px_rgba(139,92,246,0.2)]';
      default: return '';
    }
  };

  return (
    <div className={`glass p-8 rounded-[40px] border border-white/5 flex flex-col gap-8 hover:border-white/10 transition-all duration-500 ${getGlowColor(asset.status_phase)} relative overflow-hidden`}>
      <div className={`absolute top-0 right-0 w-32 h-32 blur-[80px] -mr-16 -mt-16 opacity-5 ${asset.trend_direction === 'BUY' ? 'bg-primary' : 'bg-red-500'}`} />
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-bold text-lg text-white">
            {asset.symbol.substring(0, 3)}
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">{asset.symbol}</h3>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${getPhaseColor(asset.status_phase).replace('text-', 'bg-')}`} />
              <span className={`text-[10px] font-bold uppercase tracking-widest ${getPhaseColor(asset.status_phase)}`}>
                {asset.status_phase}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-500 font-mono">Price</p>
          <p className="text-xl font-mono font-bold text-white leading-none">
            {asset.price !== undefined && asset.price !== null ? asset.price.toFixed(5) : '0.00000'}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-black/40 rounded-2xl p-4 border border-white/5">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter mb-2 flex items-center gap-1">
            <Info className="w-3 h-3" /> Status do Motor
          </p>
          <p className="text-xs text-white leading-relaxed">{asset.status_text}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
            <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">Tendência</p>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold ${asset.trend_direction === 'BUY' ? 'text-primary' : 'text-red-500'}`}>
                {asset.trend_direction || 'LATERAL'}
              </span>
              <span className="text-[10px] font-mono text-gray-400">
                {asset.trend_slope_points !== undefined && asset.trend_slope_points !== null ? asset.trend_slope_points.toFixed(2) : '0.00'} pts
              </span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
            <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">Posições</p>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">{asset.open_positions} / {asset.max_open_positions}</span>
              {asset.open_positions > 0 ? <Activity className="w-3 h-3 text-primary animate-pulse" /> : <Layers className="w-3 h-3 text-gray-600" />}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter mb-2">Estrutura Técnica</p>
          <div className="space-y-1.5">
             <div className="flex justify-between items-center text-[10px]">
                <span className="text-gray-500">Ponto A / B</span>
                <span className="text-white font-mono">
                    {asset.point_a !== undefined && asset.point_a !== null ? asset.point_a.toFixed(5) : '0.00000'} / {asset.point_b !== undefined && asset.point_b !== null ? asset.point_b.toFixed(5) : '0.00000'}
                </span>
             </div>
             <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden flex">
                <div 
                  className="bg-primary/40 h-full border-r border-white/20" 
                  style={{ width: '50%' }}
                />
                <div 
                  className="bg-secondary/40 h-full" 
                  style={{ width: '30%' }}
                />
             </div>
             <div className="flex justify-between items-center text-[10px]">
                <span className="text-gray-500">Projeção 80 / 100</span>
                <span className="text-white font-mono">
                    {asset.projection_80 !== undefined && asset.projection_80 !== null ? asset.projection_80.toFixed(5) : '0.00000'} / {asset.projection_100 !== undefined && asset.projection_100 !== null ? asset.projection_100.toFixed(5) : '0.00000'}
                </span>
             </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
           <div className={`flex-1 p-2 rounded-xl flex items-center justify-center gap-1.5 border ${asset.breakout_ok ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-white/5 border-white/10 text-gray-600'}`}>
              {asset.breakout_ok ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
              <span className="text-[10px] font-bold uppercase">Rompimento</span>
           </div>
           <div className={`flex-1 p-2 rounded-xl flex items-center justify-center gap-1.5 border ${asset.grouping_ok ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-white/5 border-white/10 text-gray-600'}`}>
              {asset.grouping_ok ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
              <span className="text-[10px] font-bold uppercase">Agrupamento</span>
           </div>
        </div>
      </div>
    </div>
  );
}

export default function MonitorPage() {
  const [snapshot, setSnapshot] = useState<RuntimeSnapshot | null>(null);

  useEffect(() => {
    const fetchSnapshot = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/runtime`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.status === 401) return;
        
        const data = await res.json();
        setSnapshot(data);
      } catch (e) { console.error(e); }
    };
    fetchSnapshot();
    const interval = setInterval(fetchSnapshot, 3000);
    return () => clearInterval(interval);
  }, []);

  const assets = snapshot?.symbols ? Object.values(snapshot.symbols) : [];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-primary animate-pulse" />
            <span className="text-primary text-[10px] font-black uppercase tracking-[0.2em]">Telemetria em Tempo Real</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter">MONITOR DE <span className="text-primary">EXECUÇÃO</span></h1>
          <p className="text-gray-500 text-sm mt-1 max-w-md">Acompanhamento multi-ativo das fases da estratégia Fimathe, monitorando gatilhos e agrupamentos em nanosegundos.</p>
        </div>
        
        <div className="glass px-5 py-2.5 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="p-2 rounded-xl bg-primary/10">
            <RefreshCcw className="w-4 h-4 text-primary animate-spin" style={{ animationDuration: '4s' }} />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Sincronizado</span>
            <span className="text-[11px] font-mono text-white font-bold leading-tight">{snapshot?.updated_at ? new Date(snapshot.updated_at).toLocaleTimeString() : '--:--:--'}</span>
          </div>
        </div>
      </div>

      {assets.length === 0 ? (
        <div className="h-[40vh] flex flex-col items-center justify-center glass rounded-[40px] border-dashed border-white/10">
          <Activity className="w-12 h-12 text-gray-700 mb-4" />
          <p className="text-gray-500 font-medium">Nenhum ativo sendo monitorado no momento.</p>
          <p className="text-gray-600 text-xs mt-2">Inicie o robô para começar o fluxo Fimathe.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {assets.map((asset) => (
            <AssetFimatheCard key={asset.symbol} asset={asset} />
          ))}
        </div>
      )}

      {snapshot?.recent_events && snapshot.recent_events.length > 0 && (
         <div className="glass p-10 rounded-[48px] border border-white/5 overflow-hidden">
            <div className="mb-8">
              <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
                 <div className="p-2 rounded-lg bg-primary/10">
                   <Zap className="w-5 h-5 text-primary" />
                 </div>
                 Fluxo de Eventos Recentes
              </h3>
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-2 ml-14">Atividade sistêmica em tempo real</p>
            </div>
            <div className="space-y-3">
               {snapshot.recent_events.slice(-5).reverse().map((event, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                     <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-gray-500">{new Date(event.timestamp).toLocaleTimeString()}</span>
                        <span className="px-2 py-0.5 rounded-md bg-white/10 text-[9px] font-bold text-white uppercase">{event.symbol}</span>
                        <span className="text-xs text-gray-300">{event.message}</span>
                     </div>
                     <span className={`text-[10px] font-bold uppercase tracking-widest ${event.level === 'ERROR' ? 'text-red-500' : 'text-primary'}`}>
                        {event.level}
                     </span>
                  </div>
               ))}
            </div>
         </div>
      )}
    </div>
  );
}

import { RefreshCcw, Zap } from 'lucide-react';
