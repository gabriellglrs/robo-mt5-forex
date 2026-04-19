"use client";

import React from 'react';
import { 
  Trophy, Medal, TrendingUp, Users, 
  BarChart as BarChartIcon 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as ChartTooltip, ResponsiveContainer, Cell
} from 'recharts';
import { motion } from 'framer-motion';
import StrategyDNA from './StrategyDNA';

interface RankingRow {
  symbol: string;
  window_days: number;
  preset_id: string;
  sample_size: number;
  avg_score: number;
  best_score: number;
  avg_pnl_points: number;
  avg_win_rate: number;
}

interface LeaderboardTabProps {
  ranking: RankingRow[];
}

export default function LeaderboardTab({ ranking }: LeaderboardTabProps) {
  const top10 = ranking.slice(0, 10);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Top 3 High-End Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {ranking.slice(0, 3).map((row, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`glass p-6 rounded-[32px] border relative overflow-hidden ${
              i === 0 ? 'border-primary/40 bg-primary/5' : 'border-white/10'
            }`}
          >
            {i === 0 && (
              <div className="absolute top-4 right-4 animate-bounce">
                <Trophy className="w-8 h-8 text-primary opacity-20" />
              </div>
            )}
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                i === 0 ? 'bg-primary text-black' : 'bg-white/5 text-gray-400'
              }`}>
                {i + 1}
              </div>
              <div>
                <h4 className="font-black text-white text-lg tracking-tight">{row.symbol}</h4>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{row.preset_id} • {row.window_days}d</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Radar Chart DNA para o vencedor */}
              {i === 0 && (
                <div className="bg-black/20 rounded-2xl p-2 border border-primary/10 mb-2">
                  <StrategyDNA metrics={{
                    total_pnl_points: row.avg_pnl_points,
                    win_rate: row.avg_win_rate,
                    profit_factor: 1.5, // Estimado se não vier no ranking
                    max_drawdown_points: 50, // Estimado
                    score: row.avg_score
                  }} />
                </div>
              )}
              
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[9px] font-black text-gray-500 uppercase mb-1 tracking-widest">Score Médio</p>
                  <p className={`text-4xl font-black ${i === 0 ? 'text-primary' : 'text-white'}`}>{row.avg_score}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-gray-500 uppercase mb-1 tracking-widest">Win Rate</p>
                  <p className="text-xl font-black text-gray-200">{row.avg_win_rate}%</p>
                </div>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${row.avg_score}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-full ${i === 0 ? 'bg-primary' : 'bg-secondary'}`}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Ranking Table & Performance Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Performance Chart */}
        <div className="glass p-8 rounded-[32px] border border-white/10 flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-xl bg-secondary/10 border border-secondary/20">
              <BarChartIcon className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white tracking-tight">Distribuição de Score Médio</h3>
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Top 10 configurações mais eficientes</p>
            </div>
          </div>
          
          <div className="h-[300px] w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top10} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="symbol" 
                  type="category" 
                  stroke="rgba(255,255,255,0.4)" 
                  fontSize={10} 
                  tickFormatter={(val, i) => `${val} (${top10[i].preset_id})`}
                  width={100}
                />
                <ChartTooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: 'rgba(15,15,15,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Bar dataKey="avg_score" radius={[0, 4, 4, 0]}>
                  {top10.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#00ffaa' : '#00a3ff'} opacity={0.8 - (index * 0.05)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Full Table */}
        <div className="glass p-8 rounded-[32px] border border-white/10">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
              <Medal className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white tracking-tight">Leaderboard Global</h3>
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Ranking agregado de todas as simulações</p>
            </div>
          </div>

          <div className="overflow-auto max-h-[400px] pr-2 custom-scrollbar">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[#0a0a0a] z-10">
                <tr className="border-b border-white/5">
                  <th className="text-left py-3 text-[10px] font-black text-gray-500 uppercase">Ativo</th>
                  <th className="text-left py-3 text-[10px] font-black text-gray-500 uppercase">Score</th>
                  <th className="text-left py-3 text-[10px] font-black text-gray-500 uppercase">PnL Médio</th>
                  <th className="text-left py-3 text-[10px] font-black text-gray-500 uppercase">Amostras</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {ranking.map((row, idx) => (
                  <tr key={idx} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="py-4">
                      <p className="text-sm font-black text-white">{row.symbol}</p>
                      <p className="text-[10px] text-gray-500 font-bold">{row.preset_id} • {row.window_days}d</p>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-black ${idx < 3 ? 'text-primary' : 'text-gray-300'}`}>{row.avg_score}</span>
                        {idx === 0 && <TrendingUp className="w-3 h-3 text-primary animate-pulse" />}
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`text-xs font-mono ${row.avg_pnl_points >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {row.avg_pnl_points > 0 ? '+' : ''}{row.avg_pnl_points} pts
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3 h-3 text-gray-600" />
                        <span className="text-xs text-gray-400">{row.sample_size}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
