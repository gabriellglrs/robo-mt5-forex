"use client";

import React from 'react';
import { 
  X, TrendingUp, TrendingDown, Target, 
  BarChart3, ListOrdered, ArrowUpRight, ArrowDownRight, AlertTriangle
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';
import { motion } from 'framer-motion';

interface Trade {
  symbol: string;
  side: string;
  entry_time: string;
  exit_time: string;
  entry_price: number;
  exit_price: number;
  pnl_points: number;
  result: string;
  rule_id?: string;
  entry_reason?: string;
}

interface RunDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: {
    preset_id: string;
    metrics: Record<string, number | string | boolean>;
    trades: Trade[];
  } | null;
}

export default function RunDetailModal({ isOpen, onClose, result }: RunDetailModalProps) {
  if (!isOpen || !result) return null;

  // Preparar dados para a curva de equity
  const equityPoints = result.trades.reduce((acc: number[], t) => {
    const last = acc.length > 0 ? acc[acc.length - 1] : 0;
    acc.push(last + t.pnl_points);
    return acc;
  }, []);

  const chartData = [
    { time: 'Início', equity: 0 },
    ...equityPoints.map((val, idx) => ({
      time: `Trade ${idx + 1}`,
      equity: Number(val.toFixed(2))
    }))
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-5xl max-h-[90vh] glass rounded-[32px] border border-white/10 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <BarChart3 className="text-primary w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Análise Detalhada: {result.preset_id}</h2>
              <p className="text-[10px] text-primary font-black uppercase tracking-widest">Performance em Ambiente de Laboratório</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl border border-white/5 hover:bg-white/5 text-gray-400 hover:text-white transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Equity Chart */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Curva de Equity (Pontos)</span>
            </div>
            <div className="h-[250px] w-full bg-black/20 rounded-2xl p-4 border border-white/5">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00ffaa" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00ffaa" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="time" hide />
                  <YAxis 
                    stroke="rgba(255,255,255,0.3)" 
                    fontSize={10} 
                    tickFormatter={(val) => `${val > 0 ? '+' : ''}${val}`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15,15,15,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px' }}
                    itemStyle={{ color: '#00ffaa' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="equity" 
                    stroke="#00ffaa" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorEquity)" 
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Metrics Quick Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="glass p-5 rounded-2xl border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-2xl group-hover:bg-primary/10 transition-colors" />
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Win Rate</p>
              <p className="text-2xl font-black text-primary">{result.metrics.win_rate}%</p>
              <div className="flex items-center gap-1 mt-2">
                <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${result.metrics.win_rate}%` }} />
                </div>
              </div>
            </div>

            <div className="glass p-5 rounded-2xl border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 blur-2xl group-hover:bg-secondary/10 transition-colors" />
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Profit Factor</p>
              <p className="text-2xl font-black text-secondary">{result.metrics.profit_factor}</p>
              <p className="text-[9px] text-gray-500 font-bold mt-2 uppercase tracking-tighter">Eficiência de Capital</p>
            </div>

            <div className="glass p-5 rounded-2xl border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 blur-2xl group-hover:bg-red-500/10 transition-colors" />
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Max Drawdown</p>
              <p className="text-2xl font-black text-red-400">{result.metrics.max_drawdown_points} pts</p>
              <p className="text-[9px] text-gray-500 font-bold mt-2 uppercase tracking-tighter">Estresse de Conta</p>
            </div>
          </div>

          {/* Trade Outcome Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-gray-500 uppercase">Ganhos (Wins)</p>
                  <p className="text-lg font-black text-white">{result.metrics.wins_count || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                  <Target className="w-4 h-4 text-yellow-500" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-gray-500 uppercase">Zero a Zero (0x0)</p>
                  <p className="text-lg font-black text-white">{result.metrics.be_count || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-gray-500 uppercase">Perdas (Losses)</p>
                  <p className="text-lg font-black text-white">{result.metrics.losses_count || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Trade History */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <ListOrdered className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Registro de Operações Simuladas</span>
            </div>
            <div className="overflow-hidden rounded-2xl border border-white/5">
              <table className="w-full text-sm">
                <thead className="bg-white/5 border-b border-white/5">
                  <tr>
                    <th className="text-left px-4 py-3 text-[10px] font-black text-gray-400 uppercase">Lado/ID</th>
                    <th className="text-left px-4 py-3 text-[10px] font-black text-gray-400 uppercase">Regra</th>
                    <th className="text-left px-4 py-3 text-[10px] font-black text-gray-400 uppercase">Entrada/Saída</th>
                    <th className="text-left px-4 py-3 text-[10px] font-black text-gray-400 uppercase">Preço</th>
                    <th className="text-left px-4 py-3 text-[10px] font-black text-gray-400 uppercase">PnL</th>
                    <th className="text-left px-4 py-3 text-[10px] font-black text-gray-400 uppercase">Resultado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {result.trades.map((trade, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded ${trade.side === 'BUY' ? 'bg-primary/20 text-primary' : 'bg-red-500/20 text-red-400'}`}>
                            {trade.side === 'BUY' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          </div>
                          <span className="font-bold text-gray-200">#{result.trades.length - idx}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-primary uppercase">{trade.rule_id || 'FIM-???'}</span>
                          <span className="text-[8px] text-gray-500 uppercase leading-none truncate max-w-[100px]" title={trade.entry_reason}>
                            {trade.entry_reason || 'Manual/Sim'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[10px] text-gray-300 font-medium">{new Date(trade.entry_time).toLocaleString()}</p>
                        <p className="text-[10px] text-gray-500">{new Date(trade.exit_time).toLocaleString()}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-300">
                        {trade.entry_price.toFixed(5)} → {trade.exit_price.toFixed(5)}
                      </td>
                      <td className={`px-4 py-3 font-black text-xs ${trade.pnl_points >= 0 ? 'text-primary' : 'text-red-400'}`}>
                        {trade.pnl_points > 0 ? '+' : ''}{trade.pnl_points.toFixed(2)} pts
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          trade.result === 'WIN' ? 'bg-primary/20 text-primary' : 
                          trade.result === '0x0' ? 'bg-yellow-500/20 text-yellow-500' : 
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {trade.result}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {result.trades.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <AlertTriangle className="w-10 h-10 text-yellow-500/50" />
                          <div className="space-y-1">
                            <p className="text-gray-400 font-bold">Nenhum trade executado nesta simulação.</p>
                            {result.metrics.diagnostic && (
                              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-2 mt-2">
                                <p className="text-[10px] text-yellow-500 font-black uppercase tracking-widest leading-tight">
                                  {result.metrics.diagnostic}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
