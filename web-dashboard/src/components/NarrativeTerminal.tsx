'use client';

import React, { useEffect, useMemo, useReducer, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Cpu, Zap, ShieldAlert, Bot, TrendingUp, Brain, Info, Crosshair } from 'lucide-react';
import type { FimatheAsset } from '@/types';

type RuntimeEvent = {
  timestamp?: string;
  symbol?: string;
  level?: string;
  message?: string;
};

type NarrativeMessage = {
  id: string;
  text: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'ai' | 'log';
  timestamp: string;
};

type RuntimeAssetExt = FimatheAsset & {
  reason?: string;
  entry_timeframe?: string;
  timestamp?: string;
  breakout_distance_points?: number;
  near_trade_region?: boolean;
  nearest_trade_region_points?: number;
  sr_tolerance_points?: number;
};

interface NarrativeTerminalProps {
  assetRuntime?: RuntimeAssetExt;
  recentEvents?: RuntimeEvent[];
}

type MessageAction =
  | { type: 'seed'; item: NarrativeMessage }
  | { type: 'append'; items: NarrativeMessage[] };

function messageReducer(state: NarrativeMessage[], action: MessageAction): NarrativeMessage[] {
  if (action.type === 'seed') {
    if (state.length > 0) return state;
    return [action.item];
  }
  if (action.type === 'append') {
    if (action.items.length === 0) return state;
    return [...state, ...action.items].slice(-45);
  }
  return state;
}

function toClock(value?: string): string {
  if (!value) return new Date().toLocaleTimeString();
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleTimeString();
}

function mapLogType(level?: string): NarrativeMessage['type'] {
  const lv = String(level || '').toUpperCase();
  if (lv === 'ERROR') return 'error';
  if (lv === 'ENTRY') return 'success';
  if (lv === 'FLOW') return 'info';
  if (lv === 'WARNING' || lv === 'WARN') return 'warning';
  return 'log';
}

function buildAiNarrative(asset: RuntimeAssetExt): { text: string; type: NarrativeMessage['type'] } {
  const rule = asset.rule_id || 'FIM-014';
  const status = asset.status_text || 'Monitorando setup.';
  const trigger = asset.next_trigger || 'Aguardando proximo gatilho tecnico.';
  const trend = asset.trend_direction || 'LATERAL';
  const trendTf = asset.trend_timeframe || 'H1';
  const entryTf = asset.entry_timeframe || 'M15';

  const base =
    `Analise operacional: regra ativa ${rule}. Estado atual: ${status} ` +
    `Leitura de tendencia: ${trend} em ${trendTf}, execucao em ${entryTf}. ` +
    `Acao corretiva objetiva: ${trigger}`;

  if (asset.signal) {
    return { text: `${base} Gatilho confirmado (${asset.signal}).`, type: 'success' };
  }
  if ((asset.open_positions || 0) > 0) {
    return { text: `${base} Posicao em curso sob gestao de risco.`, type: 'info' };
  }
  if (asset.reason === 'reversao_bloqueada' || asset.reason === 'fora_da_regiao_negociavel') {
    return { text: `${base} Bloqueio tecnico ativo, sem permissao de entrada.`, type: 'warning' };
  }
  return { text: base, type: 'ai' };
}

function buildProximityHint(asset: RuntimeAssetExt): { text: string; type: NarrativeMessage['type'] } | null {
  const tol = typeof asset.sr_tolerance_points === 'number' ? asset.sr_tolerance_points : 35;
  const dist = asset.nearest_trade_region_points;
  const breakoutDist = asset.breakout_distance_points;

  if (typeof breakoutDist === 'number') {
    if (breakoutDist <= Math.max(3, tol * 0.2)) {
      return {
        text: `Proximidade de gatilho: faltam ~${breakoutDist.toFixed(1)} pontos para teste de rompimento.`,
        type: 'warning',
      };
    }
    if (breakoutDist <= tol) {
      return {
        text: `Mercado em aproximação de gatilho: distancia de rompimento em ~${breakoutDist.toFixed(1)} pontos.`,
        type: 'info',
      };
    }
  }

  if (typeof dist === 'number') {
    if (dist <= tol) {
      return {
        text: `Preco em regiao negociavel (${dist.toFixed(1)} pts da faixa de execucao).`,
        type: 'success',
      };
    }
    if (dist <= tol * 3) {
      return {
        text: `Preco aproximando zona de gatilho (${dist.toFixed(1)} pts). Aguardar confirmacao de regra.`,
        type: 'info',
      };
    }
  }

  return null;
}

export default function NarrativeTerminal({ assetRuntime, recentEvents }: NarrativeTerminalProps) {
  const [messages, dispatch] = useReducer(messageReducer, []);
  const scrollRef = useRef<HTMLDivElement>(null);

  const seenEventKeysRef = useRef<Set<string>>(new Set());
  const lastAiKeyRef = useRef<string>('');
  const lastAiAtRef = useRef<number>(0);
  const prevPositionsRef = useRef<number>(0);
  const lastHealthStateRef = useRef<string>('');
  const lastProximityKeyRef = useRef<string>('');

  const symbol = assetRuntime?.symbol;

  // Seed message
  useEffect(() => {
    if (!symbol) return;
    dispatch({
      type: 'seed',
      item: {
        id: `seed-${symbol}`,
        text: `Canal de analise iniciado para ${symbol}. Aguardando eventos do runtime para narrativa em tempo real.`,
        type: 'ai',
        timestamp: new Date().toLocaleTimeString(),
      },
    });
  }, [symbol]);

  // Runtime events -> terminal lines (event-driven, no duplication)
  useEffect(() => {
    if (!symbol || !Array.isArray(recentEvents) || recentEvents.length === 0) return;

    const eventLines: NarrativeMessage[] = [];
    for (const ev of recentEvents) {
      if (!ev || ev.symbol !== symbol) continue;
      const key = `${ev.timestamp || ''}|${ev.symbol || ''}|${ev.level || ''}|${ev.message || ''}`;
      if (seenEventKeysRef.current.has(key)) continue;

      seenEventKeysRef.current.add(key);
      eventLines.push({
        id: `log-${key}`,
        text: `Runtime[${String(ev.level || 'INFO').toUpperCase()}]: ${ev.message || 'Evento sem mensagem.'}`,
        type: mapLogType(ev.level),
        timestamp: toClock(ev.timestamp),
      });
    }

    if (eventLines.length === 0) return;

    // Prevent unbounded growth of dedup cache.
    if (seenEventKeysRef.current.size > 300) {
      const keys = Array.from(seenEventKeysRef.current);
      seenEventKeysRef.current = new Set(keys.slice(-200));
    }

    dispatch({ type: 'append', items: eventLines });
  }, [recentEvents, symbol]);

  // AI explanation line only on meaningful state changes or 30s heartbeat.
  useEffect(() => {
    if (!assetRuntime || !symbol) return;

    const tol = typeof assetRuntime.sr_tolerance_points === 'number' ? assetRuntime.sr_tolerance_points : 35;
    const dist = assetRuntime.nearest_trade_region_points;
    let proximityBand = 'unknown';
    if (typeof dist === 'number') {
      if (dist <= tol) proximityBand = 'inside';
      else if (dist <= tol * 3) proximityBand = 'approaching';
      else proximityBand = 'far';
    }

    const key = [
      assetRuntime.status_phase || '',
      assetRuntime.reason || '',
      assetRuntime.rule_id || '',
      assetRuntime.next_trigger || '',
      String(assetRuntime.open_positions || 0),
      String(assetRuntime.signal || ''),
      String(assetRuntime.trend_direction || ''),
      proximityBand,
    ].join('|');

    const now = Date.now();
    const changed = key !== lastAiKeyRef.current;
    const heartbeat = now - lastAiAtRef.current > 30000;
    if (!changed && !heartbeat) return;

    const ai = buildAiNarrative(assetRuntime);
    const extraMessages: NarrativeMessage[] = [];

    const openPos = assetRuntime.open_positions || 0;
    if (openPos > prevPositionsRef.current) {
      extraMessages.push({
        id: `exec-open-${now}`,
        text: `Execucao detectada: posicao aberta (${openPos}/${assetRuntime.max_open_positions || 0}).`,
        type: 'success',
        timestamp: new Date().toLocaleTimeString(),
      });
    } else if (openPos < prevPositionsRef.current) {
      extraMessages.push({
        id: `exec-close-${now}`,
        text: `Desalavancagem detectada: posicao encerrada. Exposicao atual ${openPos}/${assetRuntime.max_open_positions || 0}.`,
        type: 'info',
        timestamp: new Date().toLocaleTimeString(),
      });
    }

    if ((assetRuntime.max_open_positions || 0) > 0 && openPos >= (assetRuntime.max_open_positions || 0)) {
      extraMessages.push({
        id: `risk-cap-${now}`,
        text: `Limite de exposicao atingido (${openPos}/${assetRuntime.max_open_positions}). Nova entrada bloqueada ate liberar vaga.`,
        type: 'warning',
        timestamp: new Date().toLocaleTimeString(),
      });
    }

    const proximity = buildProximityHint(assetRuntime);
    if (proximity) {
      const proximityKey = `${proximityBand}|${assetRuntime.breakout_distance_points || ''}|${assetRuntime.nearest_trade_region_points || ''}`;
      if (proximityKey !== lastProximityKeyRef.current || changed) {
        extraMessages.push({
          id: `prox-${now}`,
          text: proximity.text,
          type: proximity.type,
          timestamp: new Date().toLocaleTimeString(),
        });
        lastProximityKeyRef.current = proximityKey;
      }
    }

    let healthState = 'healthy';
    const assetTs = assetRuntime.timestamp ? new Date(assetRuntime.timestamp).getTime() : NaN;
    if (!Number.isNaN(assetTs)) {
      const ageSec = Math.max(0, (now - assetTs) / 1000);
      if (ageSec > 20) {
        healthState = 'stale';
        if (lastHealthStateRef.current !== healthState) {
          extraMessages.push({
            id: `health-stale-${now}`,
            text: `Saude de telemetria: ultimo update do ativo com atraso de ${ageSec.toFixed(0)}s.`,
            type: 'warning',
            timestamp: new Date().toLocaleTimeString(),
          });
        }
      }
    }
    if (healthState === 'healthy' && lastHealthStateRef.current === 'stale') {
      extraMessages.push({
        id: `health-recovered-${now}`,
        text: 'Telemetria normalizada: stream do runtime voltou ao ritmo esperado.',
        type: 'success',
        timestamp: new Date().toLocaleTimeString(),
      });
    }
    lastHealthStateRef.current = healthState;

    dispatch({
      type: 'append',
      items: [
        {
          id: `ai-${now}`,
          text: ai.text,
          type: ai.type,
          timestamp: new Date().toLocaleTimeString(),
        },
        ...extraMessages,
      ],
    });

    prevPositionsRef.current = openPos;
    lastAiKeyRef.current = key;
    lastAiAtRef.current = now;
  }, [assetRuntime, symbol]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const channelState = useMemo(() => {
    if (!assetRuntime) return 'Aguardando Sincronia';
    if (assetRuntime.signal) return 'Gatilho Confirmado';
    if ((assetRuntime.open_positions || 0) > 0) return 'Gestao de Posicao';
    return 'Monitorando Setup';
  }, [assetRuntime]);

  const getColor = (type: NarrativeMessage['type']) => {
    if (type === 'success') return 'text-primary';
    if (type === 'error') return 'text-red-500';
    if (type === 'warning') return 'text-amber-400';
    if (type === 'ai') return 'text-sky-400';
    if (type === 'log') return 'text-gray-500';
    return 'text-gray-300';
  };

  const getIcon = (type: NarrativeMessage['type']) => {
    if (type === 'success') return <Zap className="w-3 h-3 text-primary animate-pulse" />;
    if (type === 'error') return <ShieldAlert className="w-3 h-3 text-red-500" />;
    if (type === 'warning') return <TrendingUp className="w-3 h-3 text-amber-400" />;
    if (type === 'ai') return <Brain className="w-3 h-3 text-sky-400" />;
    if (type === 'log') return <Info className="w-3 h-3 text-gray-500" />;
    return <Terminal className="w-3 h-3 text-gray-400" />;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/15 border border-primary/30 shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Cerebro Operacional</h3>
            <span className="text-[8px] text-primary/60 uppercase font-bold tracking-tighter">Narrativa orientada ao runtime</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[9px] font-black text-primary/80 uppercase tracking-widest">Event Stream</span>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar font-mono scroll-smooth">
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full opacity-20 gap-2">
              <Cpu className="w-8 h-8 animate-spin-slow" />
              <span className="text-[10px] uppercase font-black tracking-widest">Aguardando Telemetria...</span>
            </div>
          ) : (
            messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex gap-3 px-3 py-2 rounded-lg transition-all hover:bg-white/5 border border-transparent hover:border-white/5"
              >
                <div className="flex-shrink-0 flex flex-col items-center gap-1 mt-1">
                  <span className="text-[8px] text-gray-600 font-bold tracking-tighter">{msg.timestamp}</span>
                  {getIcon(msg.type)}
                </div>
                <p className={`${getColor(msg.type)} text-[11px] leading-relaxed break-words font-medium selection:bg-primary/20`}>
                  {msg.text}
                </p>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-1 h-1 rounded-full ${assetRuntime?.signal ? 'bg-primary animate-pulse' : 'bg-gray-600'}`} />
          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{channelState}</span>
        </div>
        <div className="flex items-center gap-1">
          <Crosshair className="w-2.5 h-2.5 text-gray-600" />
          <span className="text-[9px] text-gray-600 font-black">{symbol || '--'}</span>
        </div>
      </div>
    </div>
  );
}
