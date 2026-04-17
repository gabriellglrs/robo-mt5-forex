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
  Zap,
  Activity,
  PieChart as PieChartIcon,
  ShieldAlert,
  Calendar,
  HelpCircle
} from 'lucide-react';
import { MetricTooltip } from '@/components/MetricTooltip';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';

function StatsKpiCard({ title, value, subValue, icon: Icon, color, info }: any) {
  const [showInfo, setShowInfo] = useState(false);
  
  const colorMap: any = {
    primary: 'from-primary/20 to-primary/0 border-primary/20 text-primary',
    secondary: 'from-blue-500/20 to-blue-500/0 border-blue-500/20 text-blue-500',
    accent: 'from-purple-500/20 to-purple-500/0 border-purple-500/20 text-purple-500',
    warning: 'from-yellow-500/20 to-yellow-500/0 border-yellow-500/20 text-yellow-500',
    danger: 'from-red-500/20 to-red-500/0 border-red-500/20 text-red-500',
  };

  const selectedColor = colorMap[color] || colorMap.primary;

  return (
    <div className={`glass p-8 rounded-[40px] relative overflow-hidden group hover:border-white/10 transition-all duration-500 border border-white/5`}>
      <div className={`absolute top-0 right-0 w-32 h-32 blur-[80px] -mr-16 -mt-16 opacity-10 bg-gradient-to-br ${selectedColor.split(' ')[0]}`} />
      
      <div className="flex justify-between items-start mb-6">
        <div className={`p-4 rounded-2xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform duration-500`}>
          <Icon className={`w-6 h-6 ${selectedColor.split(' ').pop()}`} />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[9px] font-black text-white/40 bg-white/5 px-3 py-1.5 rounded-full uppercase tracking-widest border border-white/5">
            Analytics
          </div>
          <div 
            className="relative"
            onMouseEnter={() => setShowInfo(true)}
            onMouseLeave={() => setShowInfo(false)}
          >
            <HelpCircle className="w-3.5 h-3.5 text-gray-600 hover:text-white transition-colors cursor-help" />
            <MetricTooltip 
              title={title} 
              description={info.desc} 
              formula={info.formula} 
              isVisible={showInfo} 
            />
          </div>
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

export default function PerformanceStatsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/performance`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.status === 200) {
          const data = await res.json();
          setStats(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000); // 10s refresh for BI is fine
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Zap className="w-12 h-12 text-primary animate-pulse" />
          <p className="text-primary font-mono text-[10px] uppercase tracking-widest">Calculando Inteligência...</p>
        </div>
      </div>
    );
  }

  if (!stats?.summary?.total_trades) {
    return (
      <div className="glass p-16 rounded-[48px] flex flex-col items-center justify-center text-center mt-12 shadow-[0_0_80px_rgba(255,170,0,0.05)] border-white/5">
        <Activity className="w-12 h-12 text-gray-600 mb-6" />
        <h2 className="text-2xl font-black text-white tracking-tighter mb-4">DADOS INSUFICIENTES</h2>
        <p className="text-gray-500 max-w-sm mb-8">
          A inteligência de BI requer trades fechados para calcular métricas de performance. 
          Assim que o robô realizar as primeiras operações, os insights aparecerão aqui.
        </p>
      </div>
    );
  }

  const pieData = [
    { name: 'Vitórias', value: stats.win_loss_distribution.wins },
    { name: 'Derrotas', value: stats.win_loss_distribution.losses },
  ];
  const COLORS = ['#00FFAA', '#EF4444'];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 mt-4">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-5 h-5 text-primary" />
          <span className="text-primary text-[10px] font-black uppercase tracking-[0.2em]">Business Intelligence</span>
        </div>
        <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Relatório de <span className="text-primary">Performance</span></h1>
        <p className="text-gray-500 text-sm mt-1 max-w-md">Análise estatística profunda e insights operacionais da estratégia Fimathe.</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsKpiCard 
          title="Fator de Lucro" 
          value={stats.summary.profit_factor} 
          subValue="Consistência matemática (Ideal > 1.5)" 
          icon={TrendingUp} 
          color="primary"
          info={{
            desc: "Representa quanto o sistema lucra para cada $1 perdido. É o indicador número 1 de robustez.",
            formula: "Lucro Bruto / |Prejuízo Bruto|"
          }}
        />
        <StatsKpiCard 
          title="Taxa de Acerto" 
          value={`${stats.summary.win_rate}%`} 
          subValue={`Baseado em ${stats.summary.total_trades} trades fechados`} 
          icon={Target} 
          color="secondary"
          info={{
            desc: "Porcentagem de operações que terminaram com lucro positivo no histórico acumulado.",
            formula: "(Trades Vencedores / Total de Trades) * 100"
          }}
        />
        <StatsKpiCard 
          title="Payoff Ratio" 
          value={stats.summary.payoff} 
          subValue="Eficiência: Média de Ganho / Média Perda" 
          icon={BarChart3} 
          color="accent"
          info={{
            desc: "Indica se seus ganhos médios compensam suas perdas médias. Essencial para estratégias de tendência.",
            formula: "Média de Ganho / |Média de Perda|"
          }}
        />
        <StatsKpiCard 
          title="Max Drawdown" 
          value={`$ ${stats.summary.max_drawdown}`} 
          subValue="Maior queda histórica do capital" 
          icon={ShieldAlert} 
          color="danger"
          info={{
            desc: "A maior queda ('mergulho') que sua conta já sofreu de um pico até um vale.",
            formula: "Max(Pico de Capital - Capital Atual)"
          }}
        />
      </div>

      {/* Middle Section: Equity and WinRate */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass p-10 rounded-[48px] border border-white/5 overflow-hidden">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">Curva de Equity Realizada</h3>
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-0.5">Progressão de Lucro Líquido</p>
            </div>
            <div className="flex gap-2">
              <span className="px-4 py-1.5 rounded-full bg-primary/10 text-[9px] text-primary font-black border border-primary/20 uppercase tracking-tighter">Realized PnL</span>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.pnl_curve}>
                <defs>
                  <linearGradient id="colorPnlStats" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00FFAA" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00FFAA" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="time" hide />
                <YAxis stroke="rgba(156, 163, 175, 0.5)" fontSize={10} tickFormatter={(val) => `$${val}`} />
                <Tooltip 
                  contentStyle={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '12px' }}
                  itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                  labelStyle={{ display: 'none' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="pnl" 
                  stroke="#00FFAA" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorPnlStats)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass p-10 rounded-[48px] border border-white/5 flex flex-col items-center justify-center">
          <div className="w-full mb-6">
            <h3 className="text-xl font-bold text-white tracking-tight text-center">Distribuição</h3>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-0.5 text-center">Win / Loss Ratio</p>
          </div>
          <div className="h-[250px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                  animationDuration={1500}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                   itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Inner Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-black text-white">{stats.summary.win_rate}%</span>
              <span className="text-[9px] text-gray-500 uppercase font-black">Accuracy</span>
            </div>
          </div>
          <div className="flex gap-6 mt-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-xs text-gray-400 font-bold">{stats.win_loss_distribution.wins} Vitórias</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-xs text-gray-400 font-bold">{stats.win_loss_distribution.losses} Derrotas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Asset Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass p-10 rounded-[48px] border border-white/5">
          <div className="mb-10">
            <h3 className="text-xl font-bold text-white tracking-tight">Performance por Ativo</h3>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-0.5">Lucro acumulado por par operado</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.by_asset} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="symbol" type="category" stroke="white" fontSize={11} fontWeight="bold" width={80} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.02)'}}
                  contentStyle={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar 
                  dataKey="total_pnl" 
                  radius={[0, 10, 10, 0]} 
                  animationDuration={1500}
                >
                  {stats.by_asset.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.total_pnl >= 0 ? '#00FFAA' : '#EF4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass p-10 rounded-[48px] border border-white/5 flex flex-col">
          <div className="mb-10">
            <h3 className="text-xl font-bold text-white tracking-tight">Resumo Operacional</h3>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-0.5">Métricas de Execução e Risco</p>
          </div>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-6 rounded-3xl bg-white/5 border border-white/5">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Profitabilidade Total</h4>
                  <p className="text-[10px] text-gray-500 uppercase font-black">Realized PnL</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-xl font-black ${stats.summary.total_pnl >= 0 ? 'text-primary' : 'text-red-500'}`}>
                  ${stats.summary.total_pnl.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-6 rounded-3xl bg-white/5 border border-white/5">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-2xl">
                  <Calendar className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Frequência Operacional</h4>
                  <p className="text-[10px] text-gray-500 uppercase font-black">Volume de Trades</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-blue-500">
                  {stats.summary.total_trades} <span className="text-[10px] text-gray-500">Trades</span>
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-6 rounded-3xl bg-red-500/5 border border-red-500/10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-500/10 rounded-2xl">
                  <ShieldAlert className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Exposição de Capital</h4>
                  <p className="text-[10px] text-gray-500 uppercase font-black">Drawdown Máximo</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-red-500">
                  -${stats.summary.max_drawdown}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
