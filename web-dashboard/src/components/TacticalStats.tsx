'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, Zap, Shield } from 'lucide-react';

interface TacticalStatsProps {
  price?: number;
  pnl?: number;
  phase?: string;
  isRunning?: boolean;
}

export default function TacticalStats({ price, pnl, phase, isRunning }: TacticalStatsProps) {
  const formatPrice = (p?: number) => p?.toFixed(5) || '0.00000';
  const formatPnL = (v?: number) => (v !== undefined ? `${v >= 0 ? '+' : ''}${v.toFixed(2)}` : '0.00');

  const containers = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containers}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full"
    >
      {/* Price Card */}
      <motion.div variants={item} className="glass p-4 rounded-3xl border border-white/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
          <Activity className="w-8 h-8 text-primary" />
        </div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Preço de Mercado</p>
        <div className="flex items-baseline gap-2">
          <h2 className="text-2xl font-black text-white tracking-tight font-mono">{formatPrice(price)}</h2>
          <div className="flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-primary animate-pulse' : 'bg-red-500'}`} />
            <span className="text-[9px] font-bold text-gray-500 uppercase">{isRunning ? 'Live' : 'Off'}</span>
          </div>
        </div>
      </motion.div>

      {/* PnL Card */}
      <motion.div variants={item} className="glass p-4 rounded-3xl border border-white/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
          {pnl && pnl >= 0 ? (
            <TrendingUp className="w-8 h-8 text-primary" />
          ) : (
            <TrendingDown className="w-8 h-8 text-red-500" />
          )}
        </div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">PnL Flutuante</p>
        <h2
          className={`text-2xl font-black tracking-tight ${
            pnl && pnl > 0 ? 'text-primary' : pnl && pnl < 0 ? 'text-red-500' : 'text-white'
          }`}
        >
          ${formatPnL(pnl)}
        </h2>
      </motion.div>

      {/* Phase Card */}
      <motion.div variants={item} className="glass p-4 rounded-3xl border border-white/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
          <Zap className="w-8 h-8 text-amber-400" />
        </div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Estado Operacional</p>
        <h2 className="text-xl font-black text-white tracking-tight uppercase truncate">
          {phase || 'Aguardando'}
        </h2>
      </motion.div>

      {/* Security/Risk Card */}
      <motion.div variants={item} className="glass p-4 rounded-3xl border border-white/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
          <Shield className="w-8 h-8 text-sky-400" />
        </div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Risco Ativo</p>
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-black text-white tracking-tight">3.00%</h2>
          <span className="text-[10px] font-bold text-sky-400 border border-sky-400/30 px-2 py-0.5 rounded-full uppercase">
            STI
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
