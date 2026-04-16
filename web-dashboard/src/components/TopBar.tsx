"use client";

import React, { useEffect, useState } from 'react';
import { Power, Circle, RefreshCcw, Bell, TrendingUp, TrendingDown, Zap } from 'lucide-react';

export function TopBar() {
  const [status, setStatus] = useState({ status: 'stopped', pid: null });
  const [snapshot, setSnapshot] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    try {
      const [resStatus, resSnap] = await Promise.all([
         fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/status`, { headers: { 'Authorization': `Bearer ${token}` } }),
         fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/runtime`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      if (resStatus.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      
      if (resStatus.ok) {
        setStatus(await resStatus.json());
      }
      
      if (resSnap.ok) {
        setSnapshot(await resSnap.json());
      }

    } catch (e) {
      setStatus({ status: 'stopped', pid: null });
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000); // 3 seconds real-time topbar
    return () => clearInterval(interval);
  }, []);

  const handleToggle = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(true);
    const action = status.status === 'running' ? 'stop' : 'start';
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/${action}`, { 
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      await fetchStatus();
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-black/40 backdrop-blur-md sticky top-0 z-40">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full animate-pulse ${status.status === 'running' ? 'bg-primary shadow-[0_0_8px_#00FFAA]' : 'bg-red-500 shadow-[0_0_8px_#FF3366]'}`} />
          <span className="text-sm font-medium text-gray-400 capitalize">Robô {status.status === 'running' ? 'Operando' : 'Parado'}</span>
          {status.pid && <span className="text-[10px] text-gray-600 ml-1">PID: {status.pid}</span>}
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* GLOBAL FINANCIAL CHIPS & TELEMETRY */}
        <div className="hidden lg:flex items-center gap-3 mr-4">
          {status.status === 'running' ? (
            <>
              {snapshot?.account && (
                <div className="glass px-4 py-1.5 rounded-xl border border-white/5 flex items-center gap-2.5 hover:border-amber-400/20 transition-all">
                   <div className="p-1 rounded bg-amber-400/10">
                     <Zap className="w-3.5 h-3.5 text-amber-400" />
                   </div>
                   <div className="flex flex-col">
                     <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest leading-none">Saldo Atual</span>
                     <span className="text-[12px] font-mono text-white font-bold leading-none mt-1 min-w-[90px]">${snapshot.account.equity.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                   </div>
                </div>
              )}

              {snapshot?.account && (
                <div className={`glass px-4 py-1.5 rounded-xl border border-white/5 flex items-center gap-2.5 transition-all ${snapshot.account.profit >= 0 ? 'hover:border-primary/20' : 'hover:border-red-500/20'}`}>
                   <div className={`p-1 rounded ${snapshot.account.profit >= 0 ? 'bg-primary/10' : 'bg-red-500/10'}`}>
                     <TrendingUp className={`w-3.5 h-3.5 ${snapshot.account.profit >= 0 ? 'text-primary' : 'text-red-500 hidden'}`} />
                     <TrendingDown className={`w-3.5 h-3.5 ${snapshot.account.profit < 0 ? 'text-red-500' : 'hidden'}`} />
                   </div>
                   <div className="flex flex-col">
                     <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest leading-none">Flutuante</span>
                     <span className={`text-[12px] font-mono font-bold leading-none mt-1 min-w-[70px] ${snapshot.account.profit >= 0 ? 'text-primary' : 'text-red-500'}`}>
                       {snapshot.account.profit >= 0 ? '+' : ''}${snapshot.account.profit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                     </span>
                   </div>
                </div>
              )}

              <div className="glass px-4 py-1.5 rounded-xl border border-white/5 flex items-center gap-3">
                <div className="flex items-center gap-2 pr-3 border-r border-white/10">
                   <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(0,255,170,0.6)]" />
                   <span className="text-[9px] font-black uppercase tracking-widest text-white">Sistema Live</span>
                </div>
                <div className="p-1 rounded-lg bg-primary/10">
                  <RefreshCcw className="w-3.5 h-3.5 text-primary animate-spin" style={{ animationDuration: '4s' }} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[7px] font-black text-gray-500 uppercase tracking-[0.2em] leading-none">Sincronizado</span>
                  <span className="text-[10px] font-mono text-white font-bold leading-none mt-1 min-w-[60px]">{snapshot?.updated_at ? new Date(snapshot.updated_at).toLocaleTimeString() : '--:--:--'}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="glass opacity-60 px-4 py-1.5 rounded-xl border border-red-500/20 flex items-center gap-3 bg-red-500/5">
                <div className="flex items-center gap-2 pr-3 border-r border-white/10">
                   <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                   <span className="text-[9px] font-black uppercase tracking-widest text-red-500">Sistema Offline</span>
                </div>
                <div className="p-1 rounded-lg bg-red-500/10">
                  <Power className="w-3.5 h-3.5 text-red-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[7px] font-black text-red-500/60 uppercase tracking-[0.2em] leading-none">Motor Fimathe</span>
                  <span className="text-[10px] font-mono text-red-500 font-bold leading-none mt-1 min-w-[60px]">DESATIVADO</span>
                </div>
            </div>
          )}
        </div>

        <button 
          onClick={handleToggle}
          disabled={loading}
          className={`relative overflow-hidden flex items-center gap-3 px-8 py-3 rounded-full font-black uppercase tracking-widest text-[11px] transition-all duration-500 group ${
            status.status === 'running' 
              ? 'bg-gradient-to-r from-red-500/5 to-red-500/20 text-red-500 border border-red-500/40 hover:bg-red-500/30 hover:border-red-500 hover:shadow-[0_0_30px_rgba(239,68,68,0.3)]' 
              : 'bg-gradient-to-r from-primary/5 to-primary/20 text-primary border border-primary/40 hover:bg-primary/30 hover:border-primary hover:shadow-[0_0_30px_rgba(0,255,170,0.3)]'
          } ${loading && 'opacity-50 cursor-not-allowed grayscale'}`}
        >
          {/* Fio de Brilho Dinâmico Hover */}
          <div className={`absolute top-0 -left-[100%] w-1/2 h-full skew-x-12 transition-all duration-700 ease-in-out group-hover:left-[200%] opacity-20 ${status.status === 'running' ? 'bg-red-500' : 'bg-primary'}`} />

          <Power className={`w-4 h-4 transition-all duration-500 relative z-10 ${status.status === 'running' ? 'drop-shadow-[0_0_10px_rgba(239,68,68,1)]' : 'drop-shadow-[0_0_10px_rgba(0,255,170,1)]'}`} />
          
          <span className="relative z-10 flex items-center gap-2">
            {loading ? 'PROCESSANDO...' : status.status === 'running' ? (
               <>
                 PARAR ROBÔ
                 <span className="relative flex h-2 w-2 ml-1">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                 </span>
               </>
            ) : (
               'INICIAR ROBÔ'
            )}
          </span>
        </button>

        <div className="flex items-center gap-4 border-l border-white/10 pl-6">
          <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full animate-ping" />
          </button>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-accent p-[1px]">
            <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-xs font-bold text-white">
              GA
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
