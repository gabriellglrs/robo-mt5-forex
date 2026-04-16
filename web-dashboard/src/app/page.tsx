"use client";

import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  BarChart3, 
  Target,
  ArrowUpRight,
  ArrowDownRight
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

  useEffect(() => {
    const fetchMetrics = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/metrics`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.status === 401) return;
        
        const data = await res.json();
        setMetrics(data);
      } catch (e) { console.error(e); }
    };
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000);
    return () => clearInterval(interval);
  }, []);

  const chartData = metrics?.recent_trades
    .slice()
    .reverse()
    .reduce((acc: any[], trade, idx) => {
      const prevPnl = acc.length > 0 ? acc[acc.length - 1].pnl : 0;
      acc.push({
        name: idx,
        pnl: prevPnl + trade.pnl,
        date: new Date(trade.entry_time).toLocaleDateString()
      });
      return acc;
    }, []) || [];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-primary animate-pulse" />
            <span className="text-primary text-[10px] font-black uppercase tracking-[0.2em]">Painel de Performance</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter">ESTATÍSTICAS DO <span className="text-primary">ALGORITMO</span></h1>
          <p className="text-gray-500 text-sm mt-1 max-w-md">Visão geral do capital, taxa de acerto e eficiência operacional da estratégia Fimathe em tempo real.</p>
        </div>
        
        <div className="glass px-5 py-2.5 rounded-2xl border border-white/5 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse glow-primary" />
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Motor Operacional Conectado</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Saldo em Lucro" 
          value={`$ ${metrics?.pnl !== undefined && metrics?.pnl !== null ? metrics.pnl.toFixed(2) : '0.00'}`} 
          subValue="Lucro líquido total disparado" 
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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

        <div className="glass p-10 rounded-[48px] border border-white/5 flex flex-col">
          <div className="mb-8">
            <h3 className="text-xl font-bold text-white tracking-tight">Fluxo Recente</h3>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-0.5">Últimas Execuções</p>
          </div>
          <div className="space-y-4 flex-1 overflow-y-auto pr-2 max-h-[400px] custom-scrollbar">
            {metrics?.recent_trades.map((trade: Trade) => (
              <div key={trade.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${trade.type === 'BUY' ? 'bg-primary/10 text-primary' : 'bg-red-500/10 text-red-500'}`}>
                    {trade.type === 'BUY' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{trade.symbol}</h4>
                    <p className="text-[10px] text-gray-500">{new Date(trade.entry_time).toLocaleTimeString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-bold ${trade.pnl >= 0 ? 'text-primary' : 'text-red-500'}`}>
                    {trade.pnl >= 0 ? '+' : ''}{trade.pnl !== undefined && trade.pnl !== null ? trade.pnl.toFixed(2) : '0.00'}
                  </p>
                  <p className="text-[9px] text-gray-600 uppercase font-bold">{trade.strategy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
