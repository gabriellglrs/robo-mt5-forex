"use client";

import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  BarChart3, 
  Target,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCcw,
  CheckCircle2,
  Zap,
  Activity
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Metrics, Trade } from '@/types';

function StatsCard({ title, value, subValue, icon: Icon, color }: any) {
  return (
    <div className="glass p-8 rounded-[40px] relative overflow-hidden group hover:border-white/10 transition-all duration-500">
      <div className={`absolute top-0 right-0 w-32 h-32 blur-[80px] -mr-16 -mt-16 opacity-10 bg-${color}`} />
      
      <div className="flex justify-between items-start mb-6">
        <div className={`p-4 rounded-2xl bg-${color}/10 border border-${color}/20 text-${color} relative overflow-hidden group-hover:scale-110 transition-transform duration-500`}>
          <Icon className="w-6 h-6 relative z-10" />
          <div className={`absolute inset-0 bg-${color}/20 opacity-0 group-hover:opacity-100 transition-opacity`} />
        </div>
        <div className="flex items-center gap-1.5 text-[9px] font-black text-primary bg-primary/10 px-3 py-1.5 rounded-full uppercase tracking-widest border border-primary/20">
          <div className="w-1 h-1 rounded-full bg-primary animate-ping" />
          Live
        </div>
      </div>
      
      <div className="relative z-10">
        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-3xl font-black text-white tracking-tighter mb-1">{value}</h3>
        <p className="text-[10px] text-gray-500 font-medium leading-relaxed">{subValue}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [snapshot, setSnapshot] = useState<any>(null);
  const [engineStatus, setEngineStatus] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const [metRes, snapRes, statRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/metrics`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/runtime`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/status`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (metRes.status === 200) {
          setMetrics(await metRes.json());
        }
        if (snapRes.status === 200) {
          setSnapshot(await snapRes.json());
        }
        if (statRes.status === 200) {
          setEngineStatus(await statRes.json());
        }
      } catch (e) { 
        console.error(e); 
      }
    };
    
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const chartData = [
    { name: 'Início', pnl: 0, date: '' },
    ...(metrics?.recent_trades
      ? metrics.recent_trades
          .filter(t => t.status === 'CLOSED')
          .slice()
          .reverse()
          .reduce((acc: any[], trade, idx) => {
            const prevPnl = acc.length > 0 ? acc[acc.length - 1].pnl : 0;
            acc.push({
              name: idx + 1,
              pnl: Number((prevPnl + (trade.pnl || 0)).toFixed(2)),
              date: new Date(trade.exit_time || trade.entry_time).toLocaleDateString()
            });
            return acc;
          }, [])
      : [])
  ];

  const openTrades = metrics?.recent_trades.filter(t => t.status === 'OPEN') || [];
  const closedTrades = metrics?.recent_trades.filter(t => t.status === 'CLOSED') || [];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className={`w-5 h-5 ${engineStatus?.status === 'running' ? 'text-primary animate-pulse' : 'text-gray-500'}`} />
          <span className={`${engineStatus?.status === 'running' ? 'text-primary' : 'text-gray-500'} text-[10px] font-black uppercase tracking-[0.2em]`}>Painel de Performance</span>
        </div>
        <h1 className="text-4xl font-black text-white tracking-tighter">ESTATÍSTICAS DO <span className={engineStatus?.status === 'running' ? 'text-primary' : 'text-gray-500'}>ALGORITMO</span></h1>
        <p className="text-gray-500 text-sm mt-1 max-w-md">Visão geral do capital, taxa de acerto e eficiência operacional da estratégia Fimathe em tempo real.</p>
      </div>

      {engineStatus?.status === 'running' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard 
              title="Saldo em Lucro (Fechado)" 
              value={`$ ${metrics?.pnl !== undefined && metrics?.pnl !== null ? metrics.pnl.toFixed(2) : '0.00'}`} 
              subValue="Lucro líquido de todas operações encerradas" 
              icon={DollarSign} 
              color="primary"
            />
            <StatsCard 
              title="Taxa de Acerto" 
              value={`${metrics?.win_rate !== undefined && metrics?.win_rate !== null ? metrics.win_rate.toFixed(1) : '0'}%`} 
              subValue="Consistência baseada na estratégia" 
              icon={Target} 
              color="secondary"
            />
            <StatsCard 
              title="Total de Trades" 
              value={metrics?.total_trades || '0'} 
              subValue="Ordens executadas pelo robô" 
              icon={BarChart3} 
              color="accent"
            />
            <StatsCard 
              title="Fator de Lucro" 
              value="1.84" 
              subValue="Relação ganho/perda estimada" 
              icon={TrendingUp} 
              color="primary"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            <div className="lg:col-span-2 glass p-10 rounded-[48px] border border-white/5 overflow-hidden">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">Curva de Equity</h3>
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-0.5">Evolução do Saldo Projetado</p>
                </div>
                <div className="flex gap-2">
                  <span className="px-4 py-1.5 rounded-full bg-white/5 text-[9px] text-gray-400 font-black border border-white/5 uppercase tracking-tighter">Histórico de Ordens</span>
                </div>
              </div>
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00FFAA" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00FFAA" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="name" hide />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip 
                      contentStyle={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                      itemStyle={{ color: '#00FFAA' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="pnl" 
                      stroke="#00FFAA" 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#colorPnl)" 
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="flex flex-col gap-8 w-full">
              {openTrades.length > 0 && (
                <div className="glass p-8 rounded-[40px] border border-primary/20 flex flex-col shadow-[0_0_30px_rgba(0,255,170,0.05)]">
                  <div className="mb-6 flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" /> Posições Abertas
                      </h3>
                      <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-0.5 ml-4">Monitoramento Live</p>
                    </div>
                    <div className="bg-primary/10 text-primary text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider border border-primary/20 shadow-sm">
                      {openTrades.length} Ativo{openTrades.length > 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {openTrades.map((trade: Trade) => {
                      const livePnl = snapshot?.symbols?.[trade.symbol]?.current_pnl;
                      const displayPnl = livePnl !== undefined ? livePnl : trade.pnl;

                      return (
                      <div key={trade.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-primary/10 hover:bg-primary/5 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${trade.type === 'BUY' ? 'bg-primary/20 text-primary' : 'bg-red-500/20 text-red-500'}`}>
                            {trade.type === 'BUY' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <h4 className="text-xs font-bold text-white">{trade.symbol}</h4>
                              <span className="text-[8px] bg-primary/20 text-primary px-1.5 py-0.5 rounded uppercase font-black tracking-widest border border-primary/30 shadow-[0_0_8px_rgba(0,255,170,0.2)]">Livre</span>
                            </div>
                            <p className="text-[10px] text-gray-400">Posição Aberta</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-xs font-black ${displayPnl >= 0 ? 'text-primary drop-shadow-[0_0_8px_rgba(0,255,170,0.8)]' : 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]'}`}>
                            {displayPnl >= 0 ? '+' : ''}{displayPnl !== undefined && displayPnl !== null ? displayPnl.toFixed(2) : '0.00'}
                          </p>
                          <p className="text-[9px] text-primary/60 uppercase font-black tracking-widest mt-0.5">{trade.strategy}</p>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="glass p-10 rounded-[48px] border border-white/5 flex flex-col">
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-white tracking-tight">Fluxo Recente</h3>
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-0.5">Últimas Execuções</p>
                </div>
                <div className="space-y-4 flex-1 overflow-y-auto pr-2 max-h-[400px] custom-scrollbar">
                  {closedTrades.map((trade: Trade) => (
                    <div key={trade.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${trade.type === 'BUY' ? 'bg-primary/10 text-primary' : 'bg-red-500/10 text-red-500'}`}>
                          {trade.type === 'BUY' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white">{trade.symbol}</h4>
                          <p className="text-[10px] text-gray-500">{new Date(trade.exit_time || trade.entry_time).toLocaleTimeString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-bold ${trade.pnl >= 0 ? 'text-primary' : 'text-red-500'}`}>
                          {trade.pnl >= 0 ? '+' : ''}{trade.pnl !== undefined && trade.pnl !== null ? trade.pnl.toFixed(2) : '0.00'}
                        </p>
                        <p className="text-[9px] text-gray-600 uppercase font-bold tracking-widest mt-0.5">{trade.strategy}</p>
                      </div>
                    </div>
                  ))}
                  {closedTrades.length === 0 && (
                    <div className="text-center text-gray-600 text-xs py-8">Nenhum trade encerrado ainda.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="glass p-16 rounded-[48px] border border-red-500/10 flex flex-col items-center justify-center text-center mt-12 mb-20 shadow-[0_0_80px_rgba(239,68,68,0.05)]">
          <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center mb-8 relative">
            <div className="absolute inset-0 rounded-full border border-red-500/30 animate-ping" style={{ animationDuration: '3s' }} />
            <Activity className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tighter mb-4">MOTOR EM STANDBY</h2>
          <p className="text-gray-400 mt-2 max-w-lg leading-relaxed mb-8">
            A exibição de estatísticas e painéis de controle está bloqueada porque o coração do sistema foi intencionalmente desativado. Ligue no painel superior para restaurar a leitura.
          </p>
        </div>
      )}
    </div>
  );
}
