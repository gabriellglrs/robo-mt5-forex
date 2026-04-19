"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Play, Beaker, Settings2, ShieldQuestion, Info, Search, ChevronDown, Plus, Target } from 'lucide-react';
import { InfoTooltip } from '../InfoTooltip';

interface CockpitTabProps {
  symbol: string;
  symbols: string[];
  setSymbol: (s: string) => void;
  windowDays: number;
  setWindowDays: (d: number) => void;
  preset: string;
  setPreset: (p: string) => void;
  spread: number;
  setSpread: (n: number) => void;
  slippage: number;
  setSlippage: (n: number) => void;
  beTrigger: number;
  setBeTrigger: (n: number) => void;
  targetLock: number;
  setTargetLock: (n: number) => void;
  dragMode: number;
  setDragMode: (n: number) => void;
  gordurinha: number;
  setGordurinha: (n: number) => void;
  trendTimeframe: string;
  setTrendTimeframe: (tf: string) => void;
  entryTimeframe: string;
  setEntryTimeframe: (tf: string) => void;
  requireGrouping: boolean;
  setRequireGrouping: (value: boolean) => void;
  requireChannelBreak: boolean;
  setRequireChannelBreak: (value: boolean) => void;
  requirePullbackRetest: boolean;
  setRequirePullbackRetest: (value: boolean) => void;
  requireStructuralTrend: boolean;
  setRequireStructuralTrend: (value: boolean) => void;
  requireSrTouch: boolean;
  setRequireSrTouch: (value: boolean) => void;
  strictReversalLogic: boolean;
  setStrictReversalLogic: (value: boolean) => void;
  breakoutBufferPoints: number;
  setBreakoutBufferPoints: (value: number) => void;
  pullbackTolerancePoints: number;
  setPullbackTolerancePoints: (value: number) => void;
  srTolerancePoints: number;
  setSrTolerancePoints: (value: number) => void;
  abLookbackCandles: number;
  setAbLookbackCandles: (value: number) => void;
  trendCandles: number;
  setTrendCandles: (value: number) => void;
  loading: boolean;
  onStart: () => void;
}

export default function CockpitTab({
  symbol, symbols, setSymbol, windowDays, setWindowDays, 
  preset, setPreset, spread, setSpread, 
  slippage, setSlippage, 
  beTrigger, setBeTrigger, targetLock, setTargetLock,
  dragMode, setDragMode, gordurinha, setGordurinha,
  trendTimeframe, setTrendTimeframe, entryTimeframe, setEntryTimeframe,
  requireGrouping, setRequireGrouping,
  requireChannelBreak, setRequireChannelBreak,
  requirePullbackRetest, setRequirePullbackRetest,
  requireStructuralTrend, setRequireStructuralTrend,
  requireSrTouch, setRequireSrTouch,
  strictReversalLogic, setStrictReversalLogic,
  breakoutBufferPoints, setBreakoutBufferPoints,
  pullbackTolerancePoints, setPullbackTolerancePoints,
  srTolerancePoints, setSrTolerancePoints,
  abLookbackCandles, setAbLookbackCandles,
  trendCandles, setTrendCandles,
  loading, onStart
}: CockpitTabProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isScalper, setIsScalper] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleScalper = () => {
    const next = !isScalper;
    setIsScalper(next);
    if (next) {
      setWindowDays(2);
      setBeTrigger(50);
      setGordurinha(10);
    }
  };

  const filteredSymbols = symbols.filter(s => 
    s.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 50);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Configuration Form */}
      <div className="lg:col-span-2 space-y-6">
        <div className="glass p-8 rounded-[32px] border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] -mr-32 -mt-32" />
          
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
              <Settings2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white tracking-tight">Configuração do Experimento</h3>
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Defina os parâmetros para a matriz de backtest</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 relative" ref={dropdownRef}>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center">
                Ativo do Mercado
                <InfoTooltip 
                  title="Ativo" 
                  content="Selecione o ativo financeiro para simulação. Os dados históricos serão baixados diretamente do seu terminal MetaTrader 5."
                />
              </label>
              <div className="relative">
                <input 
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:border-primary/50 transition-all outline-none font-bold pr-10" 
                  value={isDropdownOpen ? searchTerm : symbol} 
                  onChange={(e) => {
                    setSearchTerm(e.target.value.toUpperCase());
                    setIsDropdownOpen(true);
                  }} 
                  onFocus={() => setIsDropdownOpen(true)}
                  placeholder="Pesquisar ativo..." 
                />
                <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </div>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 w-full mt-2 bg-[#0a0a0b] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-60 overflow-y-auto custom-scrollbar">
                  {filteredSymbols.length > 0 ? (
                    filteredSymbols.map(s => (
                      <button
                        key={s}
                        className="w-full px-4 py-3 text-left text-sm font-bold text-gray-300 hover:bg-primary/10 hover:text-primary transition-colors flex justify-between items-center group"
                        onClick={() => {
                          setSymbol(s);
                          setSearchTerm(s);
                          setIsDropdownOpen(false);
                        }}
                      >
                        {s}
                        <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-xs text-gray-500 italic">Nenhum ativo encontrado</div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center">
                Janela de Histórico
                <InfoTooltip 
                  title="Histórico" 
                  content="Quantidade de dias passados para simulação. Quanto maior a janela, mais robusta é a validação estatística."
                />
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[2, 7, 14].map((d) => (
                  <button
                    key={d}
                    onClick={() => setWindowDays(d)}
                    className={`py-3 rounded-2xl text-xs font-black transition-all border ${
                      windowDays === d 
                        ? 'bg-primary/20 border-primary/40 text-primary shadow-[0_0_15px_rgba(0,255,170,0.1)]' 
                        : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {d} DIAS
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center">
                Estratégia Base (Preset)
                <InfoTooltip 
                  title="Estratégia" 
                  content="O preset servirá de base. O laboratório testará variações automáticas de buffers, risco e agrupamento a partir dele."
                />
              </label>
              <select 
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:border-primary/50 transition-all outline-none font-bold appearance-none cursor-pointer" 
                value={preset} 
                onChange={(e) => setPreset(e.target.value)}
              >
                <option value="FIM-010">FIM-010 (Padrão/Purista)</option>
                <option value="FIM-017">FIM-017 (Conservador)</option>
                <option value="FIM-018">FIM-018 (Infinity/Arraste)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center">
                  Trend Timeframe
                  <InfoTooltip 
                    title="Timeframe Tendência" 
                    content="Tempo gráfico para análise de tendência maior (FIM-002/016)."
                  />
                </label>
                <select 
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:border-primary/50 transition-all outline-none font-bold appearance-none cursor-pointer" 
                  value={trendTimeframe} 
                  onChange={(e) => setTrendTimeframe(e.target.value)}
                >
                  <option value="H4">H4 (Macro)</option>
                  <option value="H1">H1 (Padrão)</option>
                  <option value="M30">M30 (Curto)</option>
                  <option value="M15">M15 (Micro)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center">
                  Entry Timeframe
                  <InfoTooltip 
                    title="Timeframe Entrada" 
                    content="Tempo gráfico para gatilhos e agrupamentos (FIM-006/007)."
                  />
                </label>
                <select 
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:border-primary/50 transition-all outline-none font-bold appearance-none cursor-pointer" 
                  value={entryTimeframe} 
                  onChange={(e) => setEntryTimeframe(e.target.value)}
                >
                  <option value="M30">M30</option>
                  <option value="M15">M15 (Padrão)</option>
                  <option value="M5">M5 (Scalper)</option>
                  <option value="M1">M1 (Extremo)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center">
                  Spread (pts)
                  <InfoTooltip 
                    title="Spread" 
                    content="Custo fixo por entrada (diferença entre compra e venda). Essencial para simular lucros reais."
                  />
                </label>
                <input 
                  type="number"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:border-primary/50 transition-all outline-none font-mono" 
                  value={spread} 
                  onChange={(e) => setSpread(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center">
                  Slippage (pts)
                  <InfoTooltip 
                    title="Slippage" 
                    content="Derrapagem de execução. Simula a perda de pontos que ocorre em mercados voláteis ou ordens grandes."
                  />
                </label>
                <input 
                  type="number"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:border-primary/50 transition-all outline-none font-mono" 
                  value={slippage} 
                  onChange={(e) => setSlippage(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center">
                Regras FIM (Ligado/Desligado)
                <InfoTooltip
                  title="Regras FIM"
                  content="Ative ou desative regras do motor para validar cenarios extremos no laboratorio."
                />
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[
                  { key: "group", label: "FIM-006 Agrupamento", value: requireGrouping, setValue: setRequireGrouping },
                  { key: "break", label: "FIM-007 Rompimento", value: requireChannelBreak, setValue: setRequireChannelBreak },
                  { key: "pullback", label: "FIM-011 Reteste", value: requirePullbackRetest, setValue: setRequirePullbackRetest },
                  { key: "struct", label: "FIM-016 Estrutural", value: requireStructuralTrend, setValue: setRequireStructuralTrend },
                  { key: "sr", label: "FIM-008 S/R", value: requireSrTouch, setValue: setRequireSrTouch },
                  { key: "strict", label: "Reversao Rigorosa", value: strictReversalLogic, setValue: setStrictReversalLogic },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => item.setValue(!item.value)}
                    className={`rounded-xl border px-3 py-2 text-left text-[11px] font-bold transition-all ${
                      item.value
                        ? "border-primary/40 bg-primary/15 text-primary"
                        : "border-white/10 bg-black/20 text-gray-500"
                    }`}
                  >
                    {item.label}: {item.value ? "ON" : "OFF"}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
                  Buffer Rompimento (pts)
                </label>
                <input
                  type="number"
                  min={0}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:border-primary/50 transition-all outline-none font-mono"
                  value={breakoutBufferPoints}
                  onChange={(e) => setBreakoutBufferPoints(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
                  Tolerancia Reteste (pts)
                </label>
                <input
                  type="number"
                  min={0}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:border-primary/50 transition-all outline-none font-mono"
                  value={pullbackTolerancePoints}
                  onChange={(e) => setPullbackTolerancePoints(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
                  Tolerancia S/R (pts)
                </label>
                <input
                  type="number"
                  min={0}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:border-primary/50 transition-all outline-none font-mono"
                  value={srTolerancePoints}
                  onChange={(e) => setSrTolerancePoints(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
                  Canal A/B (velas)
                </label>
                <input
                  type="number"
                  min={7}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:border-primary/50 transition-all outline-none font-mono"
                  value={abLookbackCandles}
                  onChange={(e) => setAbLookbackCandles(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
                  Confirmacao de Tendencia (velas)
                </label>
                <input
                  type="number"
                  min={5}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:border-primary/50 transition-all outline-none font-mono"
                  value={trendCandles}
                  onChange={(e) => setTrendCandles(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Advanced Fimathe Group */}
          <div className="mt-8 pt-8 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary">
                  <ShieldQuestion className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-tighter">Proteção & Arraste</span>
                </div>
                <button 
                  onClick={toggleScalper}
                  className={`px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all ${
                    isScalper ? 'bg-primary text-black' : 'bg-white/5 text-gray-500 border border-white/10'
                  }`}
                >
                  Perfil Scalper
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Gatilho 0x0 (%)</label>
                    <span className="text-xs font-bold text-primary">{beTrigger}%</span>
                  </div>
                  <input 
                    type="range" min="30" max="100" step="5"
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                    value={beTrigger}
                    onChange={(e) => setBeTrigger(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Modo de Arraste (FIM-018)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 1, label: 'BE Fixo' },
                      { id: 2, label: 'Arraste' }
                    ].map(mode => (
                      <button
                        key={mode.id}
                        onClick={() => setDragMode(mode.id)}
                        className={`py-2 rounded-xl text-[10px] font-black transition-all border ${
                          dragMode === mode.id ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-white/5 border-white/5 text-gray-500'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-2 text-secondary">
                <Target className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-tighter">Alvos & Gordurinha</span>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Trava de Ciclo (%)</label>
                   <div className="grid grid-cols-3 gap-2">
                     {[50, 80, 100].map(val => (
                       <button
                         key={val}
                         onClick={() => setTargetLock(val)}
                         className={`py-2 rounded-xl text-[10px] font-bold transition-all border ${
                           targetLock === val ? 'bg-secondary/20 border-secondary/40 text-secondary' : 'bg-white/5 border-white/5 text-gray-500'
                         }`}
                       >
                         {val}%
                       </button>
                     ))}
                   </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Gordurinha (Pontos)</label>
                  <div className="relative">
                    <input 
                      type="number"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-secondary/50 outline-none font-mono" 
                      value={gordurinha} 
                      onChange={(e) => setGordurinha(Number(e.target.value))}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-600 uppercase">PTS</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10">
            <button 
              onClick={onStart} 
              disabled={loading || !symbol}
              className="w-full group relative overflow-hidden rounded-[20px] p-[1px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary animate-gradient-x" />
              <div className="relative bg-[#050505] rounded-[19px] px-6 py-4 flex items-center justify-center gap-3 transition-all group-hover:bg-transparent">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                ) : (
                  <Play className="w-5 h-5 text-primary group-hover:text-black transition-colors" />
                )}
                <span className={`font-black text-sm uppercase tracking-[0.2em] ${loading ? 'text-gray-500' : 'text-primary group-hover:text-black transition-colors'}`}>
                  {loading ? 'Processando Matriz...' : 'Iniciar Motor de Laboratório'}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Information Panel */}
      <div className="space-y-6">
        <div className="glass p-6 rounded-[32px] border border-white/10 bg-gradient-to-b from-primary/[0.02] to-transparent">
          <div className="flex items-center gap-2 mb-4">
            <ShieldQuestion className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Como funciona</span>
          </div>
          <div className="space-y-4">
            {[
              { title: 'Replay Realista', desc: 'Simulação vela por vela baseada no histórico real do seu MT5.' },
              { title: 'Pairwise Matrix', desc: 'O sistema testa variações dos parâmetros para encontrar o melhor ajuste.' },
              { title: 'Custos Operacionais', desc: 'Spread e slippage são descontados de cada trade simulado.' }
            ].map((item, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0 shadow-[0_0_8px_rgba(0,255,170,0.5)]" />
                <div>
                  <h4 className="text-xs font-bold text-gray-200">{item.title}</h4>
                  <p className="text-[10px] text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass p-6 rounded-[32px] border border-white/10 border-dashed">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-secondary" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Dica Premium</span>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed italic">
            "Ativos com alta volatilidade (como ETHUSD) geralmente perforam melhor com buffers de rompimento maiores (&gt; 12 pts) para evitar falsos sinais."
          </p>
        </div>
      </div>
    </div>
  );
}
