"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Power, RefreshCcw, Bell, TrendingUp, TrendingDown, Zap } from 'lucide-react';

type BrowserWindow = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };
type NotificationItem = {
  id: number;
  event_type?: string;
  priority?: string;
  category?: string;
  message?: string;
  symbol?: string;
  side?: string;
  created_at?: string;
  is_read?: boolean;
};

export function TopBar() {
  const [status, setStatus] = useState({ status: 'stopped', pid: null });
  const [snapshot, setSnapshot] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsBusy, setNotificationsBusy] = useState(false);
  const prevUnreadRef = useRef<number | null>(null);
  const notificationsRef = useRef<HTMLDivElement | null>(null);

  const playNotificationBeep = () => {
    if (typeof window === 'undefined') return;
    const soundEnabled = localStorage.getItem('notifications_sound_enabled') !== 'false';
    if (!soundEnabled) return;
    try {
      const typedWindow = window as BrowserWindow;
      const AudioContextClass = typedWindow.AudioContext || typedWindow.webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      const oscillator = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      oscillator.frequency.linearRampToValueAtTime(1240, audioCtx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, audioCtx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.18);
      oscillator.connect(gain);
      gain.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.2);
    } catch {
      // Ignora falhas de áudio no navegador.
    }
  };

  const fetchStatus = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    try {
      const [resStatus, resSnap, resNotifMetrics] = await Promise.all([
         fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/status`, { headers: { 'Authorization': `Bearer ${token}` } }),
         fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/runtime`, { headers: { 'Authorization': `Bearer ${token}` } }),
         fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/notifications/metrics`, { headers: { 'Authorization': `Bearer ${token}` } })
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
      if (resNotifMetrics.ok) {
        const notifMetrics = await resNotifMetrics.json();
        const nextUnread = Number(notifMetrics?.unread_count ?? 0);
        if (prevUnreadRef.current !== null && nextUnread > prevUnreadRef.current) {
          playNotificationBeep();
        }
        prevUnreadRef.current = nextUnread;
        setUnreadCount(nextUnread);
      }

    } catch {
      setStatus({ status: 'stopped', pid: null });
    }
  };

  const fetchNotifications = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/notifications?limit=15`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const payload = await res.json();
        setNotifications(Array.isArray(payload?.items) ? payload.items : []);
      }
    } catch {
      // ignora erro de rede para nao travar topbar
    }
  };

  const markNotificationRead = async (id: number) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/notifications/${id}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // sem acao
    }
  };

  const clearNotifications = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setNotificationsBusy(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/notifications`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setNotificationsBusy(false);
    }
  };

  const toneClasses = (item: NotificationItem) => {
    const eventType = String(item.event_type || "").toUpperCase();
    const msg = String(item.message || "").toUpperCase();
    if (eventType.includes("ERROR") || eventType.includes("REJECTED") || eventType.includes("DISCONNECTED") || msg.includes("STOP")) {
      return "border-red-500/40 bg-[#1a0505]/95 shadow-[inset_0_0_20px_rgba(239,68,68,0.05)]";
    }
    if (eventType.includes("BREAK_EVEN") || eventType.includes("TRAILING")) {
      return "border-orange-500/40 bg-[#1a1005]/95 shadow-[inset_0_0_20px_rgba(245,158,11,0.05)]";
    }
    return "border-primary/40 bg-[#051a10]/95 shadow-[inset_0_0_20px_rgba(0,255,170,0.05)]";
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000); // 3 seconds real-time topbar
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!notificationsOpen) return;
    fetchNotifications();
  }, [notificationsOpen]);

  useEffect(() => {
    if (!notificationsOpen) return;
    const onClickOutside = (ev: MouseEvent) => {
      if (!notificationsRef.current) return;
      if (!notificationsRef.current.contains(ev.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [notificationsOpen]);

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
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  return (
    <header className="h-24 border-b border-white/5 flex items-center justify-between px-8 bg-black/40 backdrop-blur-md sticky top-0 z-[100]">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${status.status === 'running' ? 'bg-primary shadow-[0_0_12px_#00FFAA]' : 'bg-red-500 shadow-[0_0_12px_#FF3366]'}`} />
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Status do Motor</span>
            <span className="text-sm font-bold text-white uppercase tracking-tight">Robô {status.status === 'running' ? 'Operando' : 'Parado'}</span>
          </div>
          {status.pid && <span className="text-[9px] text-gray-600 bg-white/5 px-2 py-0.5 rounded border border-white/5 ml-2 font-mono">PID: {status.pid}</span>}
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* GLOBAL FINANCIAL CHIPS & TELEMETRY */}
        <div className="hidden xl:flex items-center gap-3 mr-4">
          {status.status === 'running' ? (
            <>
              {snapshot?.account && (
                <div className="glass px-5 py-2 rounded-2xl border border-white/5 flex items-center gap-3 hover:border-amber-400/20 transition-all cursor-default group">
                   <div className="p-1.5 rounded-lg bg-amber-400/10 group-hover:bg-amber-400/20 transition-colors">
                     <Zap className="w-4 h-4 text-amber-400" />
                   </div>
                   <div className="flex flex-col">
                     <span className="text-[8px] font-black text-gray-500 uppercase tracking-[0.2em] leading-none mb-1">Patrimônio Líquido</span>
                     <span className="text-[14px] font-mono text-white font-black leading-none min-w-[100px]">${snapshot.account.equity.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                   </div>
                </div>
              )}

              {snapshot?.account && (
                <div className={`glass px-5 py-2 rounded-2xl border border-white/5 flex items-center gap-3 transition-all cursor-default group ${snapshot.account.profit >= 0 ? 'hover:border-primary/20' : 'hover:border-red-500/20'}`}>
                   <div className={`p-1.5 rounded-lg ${snapshot.account.profit >= 0 ? 'bg-primary/10 group-hover:bg-primary/20' : 'bg-red-500/10 group-hover:bg-red-500/20'}`}>
                     <TrendingUp className={`w-4 h-4 ${snapshot.account.profit >= 0 ? 'text-primary' : 'text-red-500 hidden'}`} />
                     <TrendingDown className={`w-4 h-4 ${snapshot.account.profit < 0 ? 'text-red-500' : 'hidden'}`} />
                   </div>
                   <div className="flex flex-col">
                     <span className="text-[8px] font-black text-gray-500 uppercase tracking-[0.2em] leading-none mb-1">Lucro Flutuante</span>
                     <span className={`text-[14px] font-mono font-black leading-none min-w-[80px] ${snapshot.account.profit >= 0 ? 'text-primary' : 'text-red-500'}`}>
                       {snapshot.account.profit >= 0 ? '+' : ''}${snapshot.account.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                     </span>
                   </div>
                </div>
              )}

              <div className="glass px-5 py-2 rounded-2xl border border-white/5 flex items-center gap-4">
                <div className="flex items-center gap-2 pr-4 border-r border-white/10">
                   <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(0,255,170,0.6)]" />
                   <span className="text-[9px] font-black uppercase tracking-widest text-white italic">LIVE</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[7px] font-black text-gray-500 uppercase tracking-[0.2em] leading-none mb-1 text-center">Último Sync</span>
                  <span className="text-[11px] font-mono text-white/80 font-bold leading-none min-w-[70px]">{snapshot?.updated_at ? new Date(snapshot.updated_at).toLocaleTimeString('pt-BR') : '--:--:--'}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="glass opacity-60 px-6 py-2 rounded-2xl border border-red-500/20 flex items-center gap-4 bg-red-500/5">
                <div className="flex items-center gap-2 pr-4 border-r border-white/10">
                   <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                   <span className="text-[9px] font-black uppercase tracking-widest text-red-500">OFFLINE</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[7px] font-black text-red-500/60 uppercase tracking-[0.2em] leading-none mb-1">Sincronização</span>
                  <span className="text-[11px] font-mono text-red-500 font-black leading-none uppercase tracking-tighter">Motor Desativado</span>
                </div>
            </div>
          )}
        </div>

        <button 
          onClick={handleToggle}
          disabled={loading}
          className={`relative overflow-hidden flex items-center gap-3 px-10 py-3.5 rounded-full font-black uppercase tracking-widest text-[12px] transition-all duration-500 group shadow-lg ${
            status.status === 'running' 
              ? 'bg-gradient-to-r from-red-500/10 to-red-500/30 text-red-500 border border-red-500/50 hover:bg-red-500/40 hover:border-red-500 hover:shadow-[0_0_40px_rgba(239,68,68,0.4)]' 
              : 'bg-gradient-to-r from-primary/10 to-primary/30 text-primary border border-primary/50 hover:bg-primary/40 hover:border-primary hover:shadow-[0_0_40px_rgba(0,255,170,0.4)]'
          } ${loading && 'opacity-50 cursor-not-allowed grayscale'}`}
        >
          {/* Fio de Brilho Dinâmico Hover */}
          <div className={`absolute top-0 -left-[100%] w-1/2 h-full skew-x-12 transition-all duration-700 ease-in-out group-hover:left-[200%] opacity-30 ${status.status === 'running' ? 'bg-red-500' : 'bg-primary'}`} />

          <Power className={`w-4 h-4 transition-all duration-500 relative z-10 ${status.status === 'running' ? 'drop-shadow-[0_0_10px_rgba(239,68,68,1)]' : 'drop-shadow-[0_0_10px_rgba(0,255,170,1)]'}`} />
          
          <span className="relative z-10 flex items-center gap-2">
            {loading ? 'PROCESSANDO...' : status.status === 'running' ? (
               <>
                 INTERROMPER ROBÔ
                 <span className="relative flex h-2 w-2 ml-1">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                 </span>
               </>
            ) : (
               'INICIAR OPERAÇÕES'
            )}
          </span>
        </button>

        <div className="flex items-center gap-5 border-l border-white/10 pl-8">
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setNotificationsOpen((prev) => !prev)}
              className={`
                relative p-2.5 rounded-xl transition-all border duration-300
                ${unreadCount > 0 ? 'bg-primary/5 border-primary/20 text-primary shadow-[0_0_15px_rgba(0,255,170,0.1)]' : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:border-white/20'}
              `}
              title="Central de Notificações"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 ? (
                <>
                  <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1.5 rounded-full bg-primary text-black text-[11px] font-black flex items-center justify-center border-2 border-black">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                </>
              ) : null}
            </button>

            {notificationsOpen ? (
              <div className="absolute right-0 mt-4 w-[460px] max-w-[95vw] bg-[#0c0c0c]/95 backdrop-blur-3xl rounded-[32px] border border-white/10 shadow-[0_30px_90px_rgba(0,0,0,0.8)] z-[1001] overflow-hidden">
                <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                  <div>
                    <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-primary">Inteligência Operacional</h4>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Alertas Pendentes: <span className="text-white">{unreadCount}</span></p>
                  </div>
                  <button
                    onClick={clearNotifications}
                    disabled={notificationsBusy}
                    className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/40 disabled:opacity-40 transition-all"
                  >
                    Arquivar Tudo
                  </button>
                </div>

                <div className="max-h-[500px] overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center px-8 border border-white/5 rounded-[24px] bg-white/[0.01]">
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                        <Bell className="w-6 h-6 text-gray-600" />
                      </div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Nenhuma notificação estratégica</p>
                      <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">O sistema monitora o mercado 24/7. Novos gatilhos serão exibidos aqui.</p>
                    </div>
                  ) : (
                    notifications.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          if (!item.is_read) markNotificationRead(item.id);
                        }}
                        className={`
                          w-full group relative overflow-hidden text-left p-4 rounded-2xl border transition-all duration-300
                          ${toneClasses(item)} 
                          ${item.is_read ? "opacity-60 border-white/5 saturate-[0.5]" : "shadow-lg scale-[1.01]"}
                        `}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                             <span className="text-[10px] font-black uppercase tracking-widest text-white/90">{item.event_type || "SISTEMA"}</span>
                             <div className="w-1 h-1 rounded-full bg-white/20" />
                             <span className="text-[9px] text-gray-400 font-bold">{item.symbol ? `${item.symbol}` : "GERAL"}</span>
                          </div>
                          {!item.is_read ? (
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                              <span className="text-[8px] font-black bg-primary/20 text-primary px-2 py-0.5 rounded uppercase tracking-tighter">NOVO</span>
                            </div>
                          ) : null}
                        </div>
                        <p className="text-[13px] text-white font-bold leading-tight tracking-tight mb-2 group-hover:text-primary transition-colors">{item.message || "Evento operacional detectado."}</p>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                            <span className="text-[9px] font-mono text-gray-500">{item.created_at ? new Date(item.created_at).toLocaleString('pt-BR') : "--"}</span>
                            {item.side && (
                                <span className={`text-[8px] font-black px-2 py-0.5 rounded border ${item.side === 'BUY' ? 'border-primary/30 text-primary' : 'border-red-500/30 text-red-500'}`}>
                                    {item.side === 'BUY' ? 'ORDEM COMPRA' : 'ORDEM VENDA'}
                                </span>
                            )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
                <div className="p-4 bg-white/[0.02] border-t border-white/10 text-center">
                    <button className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-500 hover:text-white transition-colors">Visualizar Histórico Completo</button>
                </div>
              </div>
            ) : null}
          </div>
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary/40 to-accent/40 p-[1px] group cursor-pointer">
            <div className="w-full h-full rounded-[15px] bg-black flex items-center justify-center text-[13px] font-black text-white group-hover:text-primary transition-colors shadow-inner">
              GA
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
