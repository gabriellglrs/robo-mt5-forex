"use client";

import React from 'react';
import {
  Radar, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer
} from 'recharts';

interface StrategyDNAProps {
  metrics: {
    total_pnl_points: number;
    win_rate: number;
    profit_factor: number;
    max_drawdown_points: number;
    score: number;
  };
}

export default function StrategyDNA({ metrics }: StrategyDNAProps) {
  // Normalização básica para o radar (0 a 100)
  const data = [
    { subject: 'PnL Cap', A: Math.min(100, (metrics.total_pnl_points / 500) * 100), fullMark: 100 },
    { subject: 'Win Rate', A: metrics.win_rate, fullMark: 100 },
    { subject: 'Profit Factor', A: Math.min(100, (metrics.profit_factor / 3) * 100), fullMark: 100 },
    { subject: 'Risk (DD)', A: Math.max(0, 100 - (metrics.max_drawdown_points / 100) * 100), fullMark: 100 },
    { subject: 'Score', A: metrics.score, fullMark: 100 },
  ];

  return (
    <div className="w-full h-[200px] flex flex-col items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.05)" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 8, fontWeight: 'bold' }} 
          />
          <Radar
            name="Strategy DNA"
            dataKey="A"
            stroke="#00ffaa"
            fill="#00ffaa"
            fillOpacity={0.2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
