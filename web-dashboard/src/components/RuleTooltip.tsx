"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, ShieldCheck, ShieldAlert, Zap } from 'lucide-react';

interface RuleTooltipProps {
  rule: {
    id: string;
    name: string;
    purpose: string;
    onActive: string;
    onInactive: string;
    type: 'MANDATORY' | 'OPTIONAL';
  };
  isActive: boolean;
  isVisible: boolean;
}

export const RuleTooltip: React.FC<RuleTooltipProps> = ({ rule, isActive, isVisible }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10, x: '-50%' }}
          animate={{ opacity: 1, scale: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, scale: 0.9, y: 10, x: '-50%' }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="absolute bottom-full left-1/2 mb-4 z-[100] w-[280px] pointer-events-none"
        >
          {/* Main Glass Container */}
          <div className="relative p-5 rounded-[24px] border border-white/10 bg-[#0a0a0b]/95 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
            
            {/* Ambient Glow */}
            <div className={`absolute -top-10 -right-10 w-24 h-24 blur-[40px] opacity-20 rounded-full ${
              isActive ? 'bg-primary' : 'bg-red-500'
            }`} />

            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
              <div className={`p-1.5 rounded-lg ${
                isActive ? 'bg-primary/20 text-primary' : 'bg-white/5 text-gray-500'
              }`}>
                {isActive ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/30">{rule.id}</span>
                <span className="text-[11px] font-bold text-white leading-none">{rule.name}</span>
              </div>
            </div>

            {/* Content Sections */}
            <div className="space-y-4">
              {/* Section: Purpose */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Info className="w-3 h-3 text-secondary" />
                  <span className="text-[9px] font-black uppercase tracking-wider text-secondary/80">Para que serve?</span>
                </div>
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  {rule.purpose}
                </p>
              </div>

              {/* Section: Impact */}
              <div className="space-y-1.5 pt-3 border-t border-white/5">
                <div className="flex items-center gap-1.5">
                  <Zap className={`w-3 h-3 ${isActive ? 'text-primary' : 'text-orange-400'}`} />
                  <span className={`text-[9px] font-black uppercase tracking-wider ${isActive ? 'text-primary' : 'text-orange-400'}`}>
                    Impacto ({isActive ? 'Ativo' : 'Desativado'})
                  </span>
                </div>
                <p className={`text-[10px] leading-relaxed ${isActive ? 'text-gray-300' : 'text-orange-200/70 font-medium'}`}>
                  {isActive ? rule.onActive : rule.onInactive}
                </p>
              </div>
            </div>

            {/* Tip Arrow */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#0a0a0b] rotate-45 border-r border-b border-white/10" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
