'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const RULE_METADATA: Record<string, { name: string; desc: string }> = {
  'FIM-001': { name: 'Coleta de Dados', desc: 'Conexão e histórico de candles' },
  'FIM-002': { name: 'Tendência Principal', desc: 'Direção do timeframe maior' },
  'FIM-003': { name: 'Canais A/B', desc: 'Cálculo de referência e zona neutra' },
  'FIM-004': { name: 'Sincronia Temporal', desc: 'Alinhamento dos timeframes' },
  'FIM-005': { name: 'Região Negociável', desc: 'Preço em zona de gatilho' },
  'FIM-006': { name: 'Filtro de Agrupamento', desc: 'Consolidação no timeframe de entrada' },
  'FIM-007': { name: 'Rompimento Canal', desc: 'Fechamento fora da borda do canal' },
  'FIM-008': { name: 'Regra Anti-Achômetro', desc: 'Validação de suporte/resistência' },
  'FIM-009': { name: 'Filtro de Spread', desc: 'Custo da corretora' },
  'FIM-010': { name: 'Ciclo de Proteção', desc: 'Gestão e trailing do ciclo' },
  'FIM-011': { name: 'Reteste (Pullback)', desc: 'Confirmação após rompimento' },
  'FIM-012': { name: 'Limite de Risco', desc: 'Trava de exposição financeira' },
  'FIM-013': { name: 'Gestão de Alvos', desc: 'Projeção dinâmica de saída' },
  'FIM-014': { name: 'Auditoria de Estado', desc: 'Rastreabilidade total da decisão' },
  'FIM-015': { name: 'Reversão Rigorosa', desc: 'Confluência para reversão técnica' },
  'FIM-016': { name: 'Tendência Estrutural', desc: 'Topos e fundos técnicos' },
};

type RuleStatus = 'ok' | 'bloqueado' | 'desativado' | 'pendente';

interface RuleGridProps {
  trace?: Record<string, string>;
}

export default function RuleGrid({ trace }: RuleGridProps) {
  const normalizeStatus = (value: string | undefined): RuleStatus => {
    if (value === 'ok' || value === 'bloqueado' || value === 'desativado') return value;
    return 'pendente';
  };

  const getStatusColor = (status: RuleStatus) => {
    switch (status) {
      case 'ok': return 'bg-primary shadow-[0_0_10px_rgba(0,255,170,0.5)]';
      case 'bloqueado': return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]';
      case 'desativado': return 'bg-gray-600';
      default: return 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]';
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">Analistas de Estado (16)</h3>
        <div className="flex gap-2">
            <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span className="text-[8px] font-bold text-gray-500 uppercase">OK</span>
            </div>
            <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span className="text-[8px] font-bold text-gray-500 uppercase">Block</span>
            </div>
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-2 relative">
        {/* Technical Grid Background */}
        <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 pointer-events-none opacity-10">
            {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="border-[0.5px] border-white/20" />
            ))}
        </div>
        
        {Array.from({ length: 16 }, (_, i) => {
          const id = `FIM-${(i + 1).toString().padStart(3, '0')}`;
          const status = normalizeStatus(trace?.[id]);
          const meta = RULE_METADATA[id];

          return (
            <motion.div
              key={id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative aspect-square glass rounded-xl border border-white/5 flex flex-col items-center justify-center cursor-help group"
              title={`${id}: ${meta.name}\n${status.toUpperCase()}: ${meta.desc}`}
            >
              <div className={`w-2 h-2 rounded-full mb-1.5 transition-all duration-500 ${getStatusColor(status)} ${status === 'bloqueado' ? 'animate-pulse' : ''}`} />
              <span className="text-[9px] font-black text-white/70 tracking-tighter">{id.replace('FIM-', '')}</span>
              
              {/* Tooltip-like popup on hover (simulated as simple CSS/div since I don't want to create a full Tooltip lib now) */}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 p-2 glass rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50">
                <p className="text-[9px] font-black text-primary mb-1">{id}</p>
                <p className="text-[10px] font-bold text-white mb-0.5">{meta.name}</p>
                <p className="text-[9px] text-gray-400 leading-tight">{meta.desc}</p>
                <div className={`mt-2 text-[8px] font-black uppercase px-2 py-0.5 rounded-full inline-block ${
                    status === 'ok' ? 'bg-primary/20 text-primary' : 
                    status === 'bloqueado' ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'
                }`}>
                    {status}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
