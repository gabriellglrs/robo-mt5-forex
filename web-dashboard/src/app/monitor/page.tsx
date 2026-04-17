"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Activity, 
  ChevronRight, 
  Map, 
  Target, 
  Layers,
  Info,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Eye,
  TrendingUp,
  TrendingDown,
  RefreshCcw,
  Zap
} from 'lucide-react';
import { RuntimeSnapshot, FimatheAsset } from '@/types';
import { motion } from 'framer-motion';

const RULE_METADATA: Record<string, { name: string; desc: string }> = {
  'FIM-001': { name: 'Coleta de Dados', desc: 'Conexão e Histórico de Candles' },
  'FIM-002': { name: 'Tendência Principal', desc: 'Direção do timeframe maior' },
  'FIM-003': { name: 'Canais A/B', desc: 'Cálculo de Referência e Zona Neutra' },
  'FIM-004': { name: 'Sincronia Temporal', desc: 'Alinhamento H1/M15/M1' },
  'FIM-005': { name: 'Região Negociável', desc: 'Preço em zona de gatilho' },
  'FIM-006': { name: 'Filtro de Agrupamento', desc: 'Consolidação no M1' },
  'FIM-007': { name: 'Rompimento Canal', desc: 'Fechamento fora da borda' },
  'FIM-008': { name: 'Regra Anti-Achômetro', desc: 'Suporte/Resistência Histórico' },
  'FIM-009': { name: 'Filtro de Spread', desc: 'Custo da corretora' },
  'FIM-010': { name: 'Ciclo de Proteção', desc: 'Trailing Stop nos 50%' },
  'FIM-011': { name: 'Reteste (Pullback)', desc: 'Confirmação após rompimento' },
  'FIM-012': { name: 'Limite de Risco', desc: 'Trava financeira de 3%' },
  'FIM-013': { name: 'Gestão de Alvos', desc: 'Projeção dinâmica de saída' },
  'FIM-014': { name: 'Auditoria de Estado', desc: 'Rastreabilidade total' },
  'FIM-015': { name: 'Reversão Rigorosa', desc: '2 níveis + triângulo' },
  'FIM-016': { name: 'Tendência Estrutural', desc: 'Topos/Fundos técnicos' },
};

const PROFILE_BADGES: Record<string, { label: string, color: string, bg: string }> = {
  scalper: { label: 'SCALPER', color: 'text-primary', bg: 'bg-primary/10' },
  day_trader: { label: 'DAY TRADER', color: 'text-green-400', bg: 'bg-green-400/10' },
  position_trader: { label: 'POSITION', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  swing_trader: { label: 'SWING', color: 'text-purple-400', bg: 'bg-purple-400/10' },
};

function RuleTraceMatrix({ trace }: { trace?: Record<string, string> }) {
  const rules = Array.from({ length: 16 }, (_, i) => {
    const id = `FIM-${(i + 1).toString().padStart(3, '0')}`;
    const status = trace?.[id] || 'pendente';
    return { id, status };
  });

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'ok': return {
        color: 'bg-primary border-primary shadow-[0_0_8px_rgba(0,255,170,0.4)]',
        label: 'Validado',
        msg: 'Critério técnico atendido.'
      };
      case 'bloqueado': return {
        color: 'bg-red-500 border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]',
        label: 'Bloqueado',
        msg: 'Entrada impedida por esta regra.'
      };
      case 'desativado': return {
        color: 'bg-gray-700 border-gray-600 opacity-40',
        label: 'Desativado',
        msg: 'Regra ignorada via configurações.'
      };
      default: return { // pendente
        color: 'bg-amber-400/40 border-amber-400/20',
        label: 'Pendente',
        msg: 'Aguardando processamento de mercado...'
      };
    }
  };

  return (
    <div className="grid grid-cols-8 gap-1.5 p-3 bg-white/5 rounded-2xl border border-white/5 mt-2">
      {rules.map((rule) => {
        const info = getStatusInfo(rule.status);
        return (
          <div key={rule.id} className="group relative">
            <div className={`w-2.5 h-2.5 rounded-full border transition-all duration-500 ${info.color}`} />
            
            {/* Tooltip Detalhado */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 p-3 rounded-xl bg-slate-900 border border-white/10 shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[8px] font-black text-white/40 uppercase">{rule.id}</span>
                <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded ${
                  rule.status === 'ok' ? 'bg-primary/20 text-primary' : 
                  rule.status === 'bloqueado' ? 'bg-red-500/20 text-red-400' : 
                  rule.status === 'desativado' ? 'bg-white/5 text-gray-500' : 'bg-amber-400/10 text-amber-400'
                }`}>
                  {info.label}
                </span>
              </div>
              <p className="text-[10px] font-bold text-white leading-tight mb-1">{RULE_METADATA[rule.id]?.name}</p>
              <p className="text-[9px] text-gray-400 leading-tight mb-2 italic">"{RULE_METADATA[rule.id]?.desc}"</p>
              
              <div className="pt-2 border-t border-white/5">
                <p className="text-[8px] font-black text-white/30 uppercase mb-1">Status Atual:</p>
                <p className={`text-[9px] font-medium leading-relaxed ${
                  rule.status === 'ok' ? 'text-primary/80' : 
                  rule.status === 'bloqueado' ? 'text-red-400/80' : 
                  rule.status === 'desativado' ? 'text-gray-500' : 'text-amber-400/80'
                }`}>{info.msg}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AssetFimatheCard({ asset }: { asset: FimatheAsset }) {
  const getPhaseStyles = (phase: string) => {
    switch (phase) {
      case 'monitoramento': 
        return {
          text: 'text-primary',
          bg: 'bg-primary/10',
          border: 'border-primary/20',
          glow: 'shadow-[0_0_20px_rgba(0,255,170,0.15)]',
          label: 'Monitoramento'
        };
      case 'rompimento':
        return {
          text: 'text-amber-400',
          bg: 'bg-amber-400/10',
          border: 'border-amber-400/20',
          glow: 'shadow-[0_0_20px_rgba(251,191,36,0.15)]',
          label: 'Rompimento'
        };
      case 'entrada':
        return {
          text: 'text-sky-400',
          bg: 'bg-sky-400/10',
          border: 'border-sky-400/20',
          glow: 'shadow-[0_0_20px_rgba(56,189,248,0.15)]',
          label: 'Entrada'
        };
      case 'gestao_risco':
        return {
          text: 'text-violet-400',
          bg: 'bg-violet-400/10',
          border: 'border-violet-400/20',
          glow: 'shadow-[0_0_20px_rgba(167,139,250,0.15)]',
          label: 'Gestão de Risco'
        };
      case 'erro':
        return {
          text: 'text-red-500',
          bg: 'bg-red-500/10',
          border: 'border-red-500/20',
          glow: 'shadow-[0_0_20px_rgba(239,68,68,0.15)]',
          label: 'Erro'
        };
      default:
        return {
          text: 'text-slate-400',
          bg: 'bg-slate-400/10',
          border: 'border-slate-400/20',
          glow: '',
          label: 'Aguardando'
        };
    }
  };

  const styles = getPhaseStyles(asset.status_phase);

  const FimatheStructureGauge = () => {
    const { point_a, point_b, projection_100, price, trend_direction } = asset;
    if (!point_a || !point_b || !price) return null;

    // Calcula níveis aproximados para a régua (SL -> B -> A -> P100)
    // Se BUY: SL < B < A < P100
    // Se SELL: SL > B > A > P100
    const isBuy = trend_direction === 'BUY';
    
    // Simplificação visual da régua: Normalizamos o range [B, P100] para 0-100%
    const range = Math.abs(projection_100! - point_b);
    if (range === 0) return null;

    const getPos = (val: number) => {
      const pos = ((val - point_b) / (projection_100! - point_b)) * 100;
      return Math.min(Math.max(pos, -10), 110); // Clamping com margem
    };

    const pricePos = getPos(price);
    const aPos = getPos(point_a);

    return (
      <div className="space-y-3 mt-2">
        <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest text-gray-500">
           <span>{isBuy ? 'Proteção/B' : 'Alvo/P100'}</span>
           <span>Preço Atual</span>
           <span>{isBuy ? 'Alvo/P100' : 'Proteção/B'}</span>
        </div>
        <div className="relative h-2 w-full bg-white/5 rounded-full border border-white/5 overflow-visible">
          {/* Zona Neutra / Canal */}
          <div 
            className="absolute h-full bg-white/10 border-x border-white/10"
            style={{ 
              left: isBuy ? '0%' : `${100 - aPos}%`, 
              width: `${Math.abs(aPos)}%` 
            }}
          />
          
          {/* Marcador Ponto A */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.5)] z-10"
            style={{ left: isBuy ? `${aPos}%` : `${100 - aPos}%` }}
          />

          {/* Marcador Preço Atual */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 -ml-1.5 z-20 transition-all duration-300"
            style={{ left: isBuy ? `${pricePos}%` : `${100 - pricePos}%` }}
          >
            <div className="w-3 h-3 rounded-full bg-white border-2 border-primary shadow-[0_0_15px_rgba(0,255,170,0.8)]" />
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white text-black text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-xl whitespace-nowrap">
               {price.toFixed(5)}
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center text-[10px] font-mono text-gray-400">
           <span>{isBuy ? point_b.toFixed(5) : projection_100?.toFixed(5)}</span>
           <span className="text-sky-400 font-bold">A: {point_a.toFixed(5)}</span>
           <span>{isBuy ? projection_100?.toFixed(5) : point_b.toFixed(5)}</span>
        </div>
      </div>
    );
  };

  return (
    <div className={`glass p-8 rounded-[40px] border border-white/5 flex flex-col gap-8 hover:border-white/10 transition-all duration-500 ${styles.glow} relative overflow-hidden`}>
      <div className={`absolute top-0 right-0 w-32 h-32 blur-[80px] -mr-16 -mt-16 opacity-5 ${asset.trend_direction === 'BUY' ? 'bg-primary' : 'bg-red-500'}`} />
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-bold text-lg text-white">
            {asset.symbol.substring(0, 3)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-lg">{asset.symbol}</h3>
              {asset.trading_type && PROFILE_BADGES[asset.trading_type] && (
                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md border border-white/5 shadow-sm ${PROFILE_BADGES[asset.trading_type].bg} ${PROFILE_BADGES[asset.trading_type].color}`}>
                  {PROFILE_BADGES[asset.trading_type].label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${styles.text.replace('text-', 'bg-')}`} />
              <span className={`text-[10px] font-bold uppercase tracking-widest ${styles.text}`}>
                {styles.label}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 justify-end mb-1">
             <Link href={`/monitor/${asset.symbol}`}>
               <button className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-[#00FFAA] bg-[#00FFAA]/10 border border-[#00FFAA]/30 px-2 py-0.5 rounded-sm hover:bg-[#00FFAA]/20 transition-all">
                  <Eye className="w-3 h-3" /> Terminal
               </button>
             </Link>
             <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-2">Price</span>
             <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
          </div>
          <p className="text-xl font-mono font-bold text-white leading-none mt-1.5">
            {asset.price !== undefined && asset.price !== null ? asset.price.toFixed(5) : '0.00000'}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className={`rounded-2xl p-4 border transition-colors duration-500 ${styles.bg} ${styles.border}`}>
          <div className="flex justify-between items-center mb-2">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter flex items-center gap-1">
              <Info className="w-3 h-3" /> Status do Motor
            </p>
            {asset.rule_id && (
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-white/5 rounded-md text-gray-400">
                {asset.rule_id}
              </span>
            )}
          </div>
          <p className="text-xs text-white leading-relaxed font-medium">{asset.status_text}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all group relative">
            <div className="flex justify-between items-center mb-1">
              <p className="text-[9px] text-gray-500 uppercase font-bold">Tendência</p>
              <HelpCircle className="w-3 h-3 text-gray-600 group-hover:text-primary transition-colors cursor-help" />
            </div>
            
            {/* Hover Tooltip para Tendencia */}
            <div className="absolute bottom-full left-0 mb-2 w-48 p-3 rounded-xl bg-slate-900 border border-white/10 shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50">
               <p className="text-[10px] font-bold text-primary mb-1 uppercase tracking-widest">Inclinação (pts)</p>
               <p className="text-[10px] text-gray-400 leading-relaxed">
                 Indica a força da tendência em pontos por candle. 
                 <br/><span className="text-white">Positivo: Alta</span>
                 <br/><span className="text-white">Negativo: Baixa</span>
               </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {asset.trend_direction === 'BUY' ? <TrendingUp className="w-3 h-3 text-primary" /> : <TrendingDown className="w-3 h-3 text-red-500" />}
                <span className={`text-[11px] font-black tracking-tight ${asset.trend_direction === 'BUY' ? 'text-primary' : 'text-red-500'}`}>
                  {asset.trend_direction || 'LATERAL'}
                </span>
                {asset.trend_timeframe && (
                  <span className="text-[9px] px-1 bg-white/5 rounded text-gray-500 font-bold">
                    {asset.trend_timeframe}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-mono text-gray-400">
                {asset.trend_slope_points !== undefined && asset.trend_slope_points !== null ? asset.trend_slope_points.toFixed(2) : '0.00'} pts
              </span>
            </div>
          </div>
          <div className={`p-3 rounded-2xl border transition-all duration-500 ${asset.open_positions > 0 ? 'bg-primary/10 border-primary/40 shadow-[0_0_15px_rgba(0,255,170,0.1)]' : 'bg-white/5 border-white/5'}`}>
            <div className="flex justify-between items-center mb-1">
              <p className="text-[9px] text-gray-500 uppercase font-bold">Posições / PnL</p>
              {asset.open_positions > 0 && asset.current_pnl !== undefined && (
                <span className={`text-[10px] font-mono font-black ${asset.current_pnl >= 0 ? 'text-primary' : 'text-red-500'} animate-pulse`}>
                  {asset.current_pnl >= 0 ? '+' : ''}${asset.current_pnl.toFixed(2)}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-black ${asset.open_positions > 0 ? 'text-primary' : 'text-white'}`}>
                {asset.open_positions} / {asset.max_open_positions}
              </span>
              {asset.open_positions > 0 ? (
                <div className="flex items-center gap-2">
                   <Activity className="w-3 h-3 text-primary animate-pulse" />
                </div>
              ) : (
                <Layers className="w-3 h-3 text-gray-600" />
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Estrutura Técnica</p>
            <div className="flex items-center gap-1 text-[9px] text-gray-600 font-bold uppercase">
               <Eye className="w-3 h-3" /> Visualizador
            </div>
          </div>
          
          <FimatheStructureGauge />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter flex items-center gap-1.5">
              <Layers className="w-3 h-3" /> Matriz de Auditoria (16 Regras)
            </p>
            <div className="flex items-center gap-3">
               <div className="flex items-center gap-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                 <span className="text-[8px] text-gray-500 font-bold">OK</span>
               </div>
               <div className="flex items-center gap-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                 <span className="text-[8px] text-gray-500 font-bold">BLOCK</span>
               </div>
               <div className="flex items-center gap-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                 <span className="text-[8px] text-gray-500 font-bold">WAIT</span>
               </div>
               <div className="flex items-center gap-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                 <span className="text-[8px] text-gray-500 font-bold">OFF</span>
               </div>
            </div>
          </div>
          
          <RuleTraceMatrix trace={asset.rule_trace} />

          {asset.next_trigger && (
            <div className="bg-primary/5 border border-primary/10 p-3 rounded-xl mt-2 flex items-start gap-2 animate-pulse">
               <Zap className="w-3 h-3 text-primary mt-0.5" />
               <div className="flex flex-col">
                  <span className="text-[9px] font-black text-primary/60 uppercase tracking-widest">Ação Corretiva / Gatilho</span>
                  <p className="text-[10px] text-primary/90 font-medium leading-tight">{asset.next_trigger}</p>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MonitorPage() {
  const [snapshot, setSnapshot] = useState<RuntimeSnapshot | null>(null);
  const [engineStatus, setEngineStatus] = useState<any>(null);

  useEffect(() => {
    const fetchSnapshot = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const [resRuntime, resStatus] = await Promise.all([
           fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/runtime`, {
             headers: { 'Authorization': `Bearer ${token}` }
           }),
           fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/status`, {
             headers: { 'Authorization': `Bearer ${token}` }
           })
        ]);

        if (resRuntime.status !== 401) {
          const data = await resRuntime.json();
          setSnapshot(data);
        }
        if (resStatus.status !== 401) {
          const statData = await resStatus.json();
          setEngineStatus(statData);
        }
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
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 mb-1">
          <Activity className={`w-5 h-5 ${engineStatus?.status === 'running' ? 'text-primary animate-pulse' : 'text-gray-500'}`} />
          <span className={`${engineStatus?.status === 'running' ? 'text-primary' : 'text-gray-500'} text-[10px] font-black uppercase tracking-[0.2em]`}>Telemetria em Tempo Real</span>
        </div>
        <h1 className="text-4xl font-black text-white tracking-tighter">MONITOR DE <span className={engineStatus?.status === 'running' ? 'text-primary' : 'text-gray-500'}>EXECUÇÃO</span></h1>
        <p className="text-gray-500 text-sm mt-1 max-w-md">Acompanhamento multi-ativo das fases da estratégia Fimathe, monitorando gatilhos e agrupamentos em nanosegundos.</p>
      </div>

      {engineStatus?.status === 'running' ? (
        <>
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
             <div className="glass p-10 rounded-[48px] border border-white/5 overflow-hidden mt-10">
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
                   {snapshot.recent_events.slice(-5).reverse().map((event: any, idx: number) => (
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
        </>
      ) : (
        <div className="glass p-16 rounded-[48px] border border-red-500/10 flex flex-col items-center justify-center text-center mt-12 mb-20 shadow-[0_0_80px_rgba(239,68,68,0.05)] w-full">
          <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center mb-8 relative">
            <div className="absolute inset-0 rounded-full border border-red-500/30 animate-ping" style={{ animationDuration: '3s' }} />
            <Activity className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tighter mb-4">MOTOR EM STANDBY</h2>
          <p className="text-gray-400 mt-2 max-w-lg leading-relaxed mb-8">
            A telemetria dos ativos foi desativada junto com o robô para evitar poluição visual e falsos alarmes com os últimos dados da API.
          </p>
        </div>
      )}
    </div>
  );
}
