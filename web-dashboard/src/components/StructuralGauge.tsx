'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface StructuralGaugeProps {
  currentPrice?: number;
  pointA?: number;
  pointB?: number;
  target50?: number;
  target100?: number;
  trendDirection?: string;
}

export default function StructuralGauge({
  currentPrice,
  pointA,
  pointB,
  target50,
  target100,
  trendDirection,
  trendTimeframe,
}: StructuralGaugeProps & { trendTimeframe?: string }) {
  if (!pointA || !pointB || currentPrice === undefined) return null;

  // Em Fimathe, a largura do canal (Canal de Referência + Zona Neutra) é a base da escala visual.
  // Definimos que um canal completo (Ponto A até Ponto B) ocupa 40% da altura total para melhor visibilidade.
  const channelWidth = Math.abs(pointA - pointB) || 0.0001;
  const scale = 40 / channelWidth; 

  const getRelativePos = (val?: number) => {
    if (val === undefined || currentPrice === undefined) return 50;
    const delta = val - currentPrice;
    return 50 + (delta * scale);
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Altímetro Fimathe</h3>
        <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${trendDirection ? 'bg-primary' : 'bg-gray-500'} animate-pulse shadow-[0_0_8px_rgba(0,255,170,0.4)]`} />
            <span className={`text-[10px] font-black uppercase tracking-widest ${trendDirection ? 'text-primary' : 'text-gray-500'}`}>Monitoramento Ativo</span>
        </div>
      </div>
      
      <div 
        className="glass rounded-3xl border border-white/5 relative h-[28rem] xl:h-full min-h-[28rem] overflow-hidden bg-black/60 shadow-[inset_0_2px_30px_rgba(0,0,0,0.8)]"
        style={{
            maskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)'
        }}
      >
        {/* Background Grid Lines (Static) */}
        <div className="absolute inset-0 flex flex-col justify-between opacity-[0.05] py-6 pointer-events-none">
            {[...Array(10)].map((_, i) => (
                <div key={i} className="w-full border-t border-white" />
            ))}
        </div>

        {/* Level Indicators (MOVING TAPE) - Z-INDEX 10 */}
        <div className="absolute inset-0 z-10">
            <LevelMarker label="🎯 ALVO 100%" val={target100} pos={getRelativePos(target100)} color="text-primary border-primary/30 bg-primary/10" glow />
            <LevelMarker label="🏁 ALVO 50%" val={target50} pos={getRelativePos(target50)} color="text-sky-300 border-sky-500/20 bg-sky-500/10" />
            
            <LevelMarker 
                label="🛑 PONTO A (RESISTÊNCIA)" 
                val={Math.max(pointA, pointB)} 
                pos={getRelativePos(Math.max(pointA, pointB))} 
                color="border-sky-500/40 bg-sky-500/20 text-sky-400" 
                thick 
            />
            
            <LevelMarker 
                label="🟢 PONTO B (SUPORTE)" 
                val={Math.min(pointA, pointB)} 
                pos={getRelativePos(Math.min(pointA, pointB))} 
                color="border-orange-500/40 bg-orange-500/20 text-orange-400" 
                thick 
            />

            <LevelMarker 
                label="⚖️ ZONA NEUTRA (50%)" 
                val={(pointA + pointB) / 2} 
                pos={getRelativePos((pointA + pointB) / 2)} 
                color="text-gray-400 border-gray-600/30 bg-gray-600/10" 
                dashed 
            />
        </div>

        {/* FIXED CROSSHAIR (Fixed at 50% - Price on the Right) - Z-INDEX 30 */}
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex items-center z-30 pointer-events-none px-1">
            <div className="w-full flex items-center justify-between gap-4">
                {/* Long Horizontal Line Section */}
                <div className="flex-1 flex items-center">
                    <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-primary shadow-[0_0_15px_rgba(0,255,170,0.2)]" />
                    <div className="w-4 h-4 rounded-full bg-primary shadow-[0_0_20px_#00ffaa] -ml-2 border-2 border-black" />
                </div>
                
                {/* Price Card Aligned to the RIGHT */}
                <div className="flex flex-col items-end min-w-[130px]">
                    <div className="px-6 py-2.5 glass-strong border border-primary/60 rounded-[14px] shadow-[0_10px_40px_rgba(0,0,0,0.6)] bg-black/95 transform translate-y-2">
                        <span className="text-[16px] font-black text-primary font-mono tracking-tighter">
                            {currentPrice?.toFixed(5)}
                        </span>
                    </div>
                    <div className="text-[9px] font-black text-primary/60 uppercase tracking-[0.2em] mt-3 mr-1 italic font-mono">Cotação Atual</div>
                </div>
            </div>
        </div>

        {/* Dynamic Trend Overlay */}
        <div className={`absolute inset-0 transition-opacity duration-1000 ${trendDirection === 'BUY' ? 'opacity-[0.08] bg-gradient-to-t from-transparent via-primary/40 to-transparent' : trendDirection === 'SELL' ? 'opacity-[0.08] bg-gradient-to-b from-transparent via-red-500/40 to-transparent' : 'opacity-0'}`} />
      </div>

      {/* Footer Info (PT-BR) */}
      <div className="grid grid-cols-2 gap-4 px-2">
          <div className="space-y-1">
              <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">Fluxo Operacional</span>
              <div className={`text-[10px] font-black flex items-center gap-2 ${trendDirection === 'BUY' ? 'text-primary' : trendDirection === 'SELL' ? 'text-red-500' : 'text-white'}`}>
                {trendDirection === 'BUY' ? 'ESTRUTURA DE ALTA' : trendDirection === 'SELL' ? 'ESTRUTURA DE BAIXA' : 'MERCADO LATERAL'}
                <div className={`w-1.5 h-1.5 rounded-full ${trendDirection === 'BUY' ? 'bg-primary shadow-[0_0_6px_rgba(0,255,170,0.6)]' : trendDirection === 'SELL' ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]' : 'bg-white'}`} />
              </div>
          </div>
          <div className="space-y-1 text-right">
              <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">Periodicidade</span>
              <div className="text-[10px] font-black text-white uppercase italic tracking-widest">{trendTimeframe || 'AGUARDANDO'}</div>
          </div>
      </div>
    </div>
  );
}

function LevelMarker({ 
  label, 
  val, 
  pos, 
  color,
  dashed = false,
  thick = false,
  glow = false
}: { 
  label: string; 
  val?: number; 
  pos: number; 
  color: string;
  dashed?: boolean;
  thick?: boolean;
  glow?: boolean;
}) {
  if (val === undefined) return null;
  // Ocultar se estiver muito fora da tela (com margem de segurança)
  if (pos < -20 || pos > 120) return null;

  return (
    <motion.div 
        className="absolute left-0 right-0 flex items-center px-4 pointer-events-none"
        initial={false}
        animate={{ 
            bottom: `${pos}%`,
            opacity: pos < 5 || pos > 95 ? 0 : 1, // Fade out nas bordas
            scale: pos < 5 || pos > 95 ? 0.9 : 1
        }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
    >
        <div className={`
            flex items-center gap-3 px-2 py-1 rounded-lg border transition-all duration-300
            ${dashed ? 'border-dashed' : 'border-solid'} 
            ${thick ? 'border-2' : 'border'}
            ${color}
            ${glow ? 'shadow-[0_0_15px_rgba(0,255,170,0.15)]' : ''}
        `}>
            <span className="text-[7px] font-black uppercase tracking-tighter whitespace-nowrap">{label}</span>
            <div className="h-2 w-px bg-white/10" />
            <span className="font-mono text-[9px] font-bold">{val.toFixed(5)}</span>
        </div>
        <div className="flex-1 border-t border-white/5 border-dashed ml-2 opacity-30" />
    </motion.div>
  );
}
