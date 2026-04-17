"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, BarChart3, TrendingUp, ShieldAlert, Target } from 'lucide-react';

interface MetricTooltipProps {
  title: string;
  description: string;
  formula?: string;
  isVisible: boolean;
}

export const MetricTooltip: React.FC<MetricTooltipProps> = ({ title, description, formula, isVisible }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10, x: '-50%' }}
          animate={{ opacity: 1, scale: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, scale: 0.9, y: 10, x: '-50%' }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="absolute bottom-full left-1/2 mb-4 z-[200] w-[300px] pointer-events-none"
        >
          <div className="relative p-6 rounded-[32px] border border-white/10 bg-[#0a0a0b]/98 backdrop-blur-3xl shadow-[0_30px_60px_rgba(0,0,0,0.8)] overflow-hidden">
            
            <div className="absolute -top-10 -left-10 w-24 h-24 blur-[40px] opacity-20 rounded-full bg-primary" />

            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Info className="w-4 h-4" />
              </div>
              <span className="text-xs font-black text-white uppercase tracking-widest">{title}</span>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-gray-500 mb-1.5 block">Definição Técnica</span>
                <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
                  {description}
                </p>
              </div>

              {formula && (
                <div className="pt-3 border-t border-white/5">
                  <span className="text-[9px] font-black uppercase tracking-wider text-primary/80 mb-1.5 block">Base de Cálculo</span>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <code className="text-[10px] font-mono text-primary font-bold">{formula}</code>
                  </div>
                </div>
              )}
            </div>

            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#0a0a0b] rotate-45 border-r border-b border-white/10" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
