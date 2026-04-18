'use client';

import React from 'react';
import { motion } from 'framer-motion';

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
  if (!pointA || !pointB) return null;

  // In Fimathe:
  // Ponto A = Resistance (Highest boundary of the neutral zone/channel)
  // Ponto B = Support (Lowest boundary of the neutral zone/channel)
  const isSell = trendDirection === 'SELL';
  
  // To ensure the gauge always shows high at the top and low at the bottom:
  // We sort levels for the range calculation
  const levels = [pointA, pointB, target50, target100, currentPrice].filter(
    (v): v is number => v !== undefined && v !== null
  );
  const min = Math.min(...levels);
  const max = Math.max(...levels);
  const range = max - min || 1;

  const getPos = (val?: number) => {
    if (val === undefined) return 0;
    // We want higher values at the top, so we use percentage from min
    return ((val - min) / range) * 100;
  };

  const pricePos = getPos(currentPrice);
  const channelMid = (pointA + pointB) / 2;

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] px-1">Mapa de Níveis Fimathe</h3>
      
      <div className="glass p-6 rounded-3xl border border-white/5 relative h-72 overflow-hidden bg-black/20">
        {/* Background Track */}
        <div className="absolute left-1/2 -translate-x-1/2 top-4 bottom-4 w-1 bg-white/5 rounded-full" />
        
        {/* Level Indicators */}
        <LevelMarker label="ALVO 100%" val={target100} pos={getPos(target100)} color="text-primary border-primary bg-primary/20" />
        <LevelMarker label="ALVO 50%" val={target50} pos={getPos(target50)} color="text-white/70 border-white/30 bg-white/10" />
        
        {/* Neutral Zone Midpoint */}
        <LevelMarker label="ZONA NEUTRA (50%)" val={channelMid} pos={getPos(channelMid)} color="text-gray-400 border-gray-600 bg-gray-500/10" dashed={true} />

        {/* Channel Boundaries - A is Always Top, B is Always Bottom in the UI for clarity */}
        <LevelMarker label="PONTO A (RES)" val={Math.max(pointA, pointB)} pos={getPos(Math.max(pointA, pointB))} color="text-sky-400 border-sky-400/50 bg-sky-400/10" />
        <LevelMarker label="PONTO B (SUP)" val={Math.min(pointA, pointB)} pos={getPos(Math.min(pointA, pointB))} color="text-orange-400 border-orange-400/50 bg-orange-400/10" />

        {/* Current Price Pointer */}
        <motion.div 
            className="absolute left-0 right-0 flex items-center justify-center pointer-events-none"
            initial={false}
            animate={{ bottom: `${pricePos}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
            <div className="relative flex items-center">
                <div className="w-12 h-[1px] bg-primary/50 absolute right-full mr-2" />
                <div className="px-3 py-1 glass border border-primary/50 rounded-full shadow-[0_0_15px_rgba(0,255,170,0.3)] bg-black/80">
                    <span className="text-[10px] font-black text-primary font-mono">{currentPrice?.toFixed(5)}</span>
                </div>
                <div className="w-12 h-[1px] bg-primary/50 absolute left-full ml-2" />
            </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-1">
          <div className="flex flex-col">
              <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Inclinacao</span>
              <span className={`text-xs font-bold ${trendDirection === 'BUY' ? 'text-primary' : trendDirection === 'SELL' ? 'text-red-500' : 'text-white'}`}>
                {trendDirection === 'BUY' ? 'Tendência de Alta' : trendDirection === 'SELL' ? 'Tendência de Baixa' : 'Lateralizado'}
              </span>
          </div>
          <div className="flex flex-col text-right">
              <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Tempo Gráfico</span>
              <span className="text-xs font-bold text-white uppercase">{trendTimeframe || '--'}</span>
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
  dashed = false
}: { 
  label: string; 
  val?: number; 
  pos: number; 
  color: string;
  dashed?: boolean;
}) {
  if (val === undefined) return null;
  return (
    <motion.div 
        className="absolute left-0 right-0 flex items-center px-4 pointer-events-none"
        initial={false}
        animate={{ bottom: `${pos}%` }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
        <div className={`text-[8px] font-black px-2 py-0.5 rounded-full border flex items-center gap-2 ${dashed ? 'border-dashed' : 'border-solid'} ${color}`}>
            <span className="whitespace-nowrap">{label}</span>
            <span className="font-mono opacity-50">{val.toFixed(5)}</span>
        </div>
        <div className="flex-1 border-t border-white/5 border-dashed ml-2 opacity-20" />
    </motion.div>
  );
}
