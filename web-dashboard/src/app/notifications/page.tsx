"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Volume2,
  VolumeX,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Filter,
  RefreshCw,
  Clock,
  Zap,
} from "lucide-react";

type NotificationItem = {
  id: number;
  event_type?: string;
  category?: string;
  priority?: string;
  severity?: string;
  message?: string;
  symbol?: string;
  side?: string;
  status?: string;
  created_at?: string;
  is_read?: boolean;
};

type NotificationMetrics = {
  total: number;
  unread_count: number;
  emitted: number;
  suppressed: number;
  delivery_failed: number;
};

type BrowserWindow = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };

function formatDateTime(value?: string) {
  if (!value) return "--";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

function eventTone(item: NotificationItem): "red" | "green" | "orange" | "cyan" {
  const event = String(item.event_type || "").toUpperCase();
  const msg = String(item.message || "").toUpperCase();
  const status = String(item.status || "").toLowerCase();

  if (
    event.includes("DISCONNECTED") ||
    event.includes("REJECTED") ||
    event.includes("CRITICAL") ||
    event.includes("ERROR") ||
    status === "delivery_failed" ||
    msg.includes("STOP")
  ) {
    return "red";
  }
  if (event.includes("BREAK_EVEN") || event.includes("TRAILING") || msg.includes("ZERO A ZERO")) {
    return "orange";
  }
  if (event.includes("OPENED") || event.includes("RECONNECTED") || msg.includes("TAKE")) {
    return "green";
  }
  if (event.includes("ORDER_CLOSED")) {
    if (msg.includes("+")) return "green";
    if (msg.includes("-")) return "red";
    return "orange";
  }
  if (event.includes("TEST") || event.includes("ENGINE_STARTED")) return "cyan";
  return item.category === "risk" ? "orange" : "green";
}

export default function NotificationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [metrics, setMetrics] = useState<NotificationMetrics>({
    total: 0,
    unread_count: 0,
    emitted: 0,
    suppressed: 0,
    delivery_failed: 0,
  });
  const [filter, setFilter] = useState<"all" | "unread" | "critical">("all");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [sendingTest, setSendingTest] = useState(false);
  const lastMaxIdRef = useRef<number>(0);

  const playNotificationBeep = () => {
    if (!soundEnabled) return;
    try {
      const typedWindow = window as BrowserWindow;
      const AudioContextClass = typedWindow.AudioContext || typedWindow.webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      const oscillator = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(960, audioCtx.currentTime);
      oscillator.frequency.linearRampToValueAtTime(1320, audioCtx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.14, audioCtx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.2);
      oscillator.connect(gain);
      gain.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.2);
    } catch {
      // Ignored
    }
  };

  const fetchNotifications = async (firstLoad = false) => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/notifications?limit=250`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 401) {
        localStorage.removeItem("token");
        router.push("/login");
        return;
      }
      const payload = await response.json();
      const nextItems = Array.isArray(payload?.items) ? payload.items : [];
      const nextMetrics = payload?.metrics || {};
      setItems(nextItems);
      setMetrics({
        total: Number(nextMetrics.total ?? nextItems.length ?? 0),
        unread_count: Number(nextMetrics.unread_count ?? 0),
        emitted: Number(nextMetrics.emitted ?? 0),
        suppressed: Number(nextMetrics.suppressed ?? 0),
        delivery_failed: Number(nextMetrics.delivery_failed ?? 0),
      });
      const maxId = nextItems.reduce((acc: number, n: NotificationItem) => Math.max(acc, Number(n.id || 0)), 0);
      if (!firstLoad && maxId > lastMaxIdRef.current) {
        playNotificationBeep();
      }
      lastMaxIdRef.current = Math.max(lastMaxIdRef.current, maxId);
    } catch (error) {
      console.error(error);
    } finally {
      if (firstLoad) setLoading(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("notifications_sound_enabled");
    setSoundEnabled(saved !== "false");
    fetchNotifications(true);
    const interval = setInterval(() => fetchNotifications(false), 3500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem("notifications_sound_enabled", soundEnabled ? "true" : "false");
  }, [soundEnabled]);

  const filteredItems = useMemo(() => {
    if (filter === "unread") return items.filter((n) => !n.is_read);
    if (filter === "critical")
      return items.filter((n) => eventTone(n) === "red" || String(n.priority || "").toUpperCase() === "P1");
    return items;
  }, [items, filter]);

  const markRead = async (id: number) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/notifications/${id}/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      setMetrics((prev) => ({ ...prev, unread_count: Math.max(0, prev.unread_count - 1) }));
    } catch (error) {
      console.error(error);
    }
  };

  const markAllRead = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setBusy(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/notifications/read-all`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setMetrics((prev) => ({ ...prev, unread_count: 0 }));
      setToast("Sucesso: Todas as notificações marcadas como lidas.");
    } finally {
      setBusy(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const deleteOne = async (id: number) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/notifications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  const clearAll = async () => {
    if (!window.confirm("CONFIRMAÇÃO CRÍTICA: Deseja apagar permanentemente todas as notificações?")) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    setBusy(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/notifications`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems([]);
      setMetrics({ total: 0, unread_count: 0, emitted: 0, suppressed: 0, delivery_failed: 0 });
      setToast("Banco de notificações limpo com sucesso.");
    } finally {
      setBusy(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const sendTestNotification = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setSendingTest(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/notifications/test`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "⚠️ Teste de Central: Verificação de latência e prioridade.",
          category: "health",
          priority: "P2",
        }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await fetchNotifications(false);
      setToast("Teste disparado! Verifique a lista.");
    } catch (error) {
      console.error(error);
      setToast("Erro ao processar teste.");
    } finally {
      setSendingTest(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* HEADER SECTION - COCKPIT STYLE */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--color-primary),0.8)]" />
            <span className="text-primary text-[10px] font-black uppercase tracking-[0.3em]">Transparência Operacional</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter leading-none italic">
            CENTRAL DE <span className="text-primary NOT-italic">ALERTAS</span>
          </h1>
          <p className="text-gray-500 text-sm font-medium border-l-2 border-primary/20 pl-4 py-1">
            Monitoramento em tempo real de execução, riscos e integridade do sistema.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
          <button
            onClick={() => setSoundEnabled((v) => !v)}
            className={`glass px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border ${
              soundEnabled ? "border-primary/20 text-white hover:border-primary/50" : "border-red-500/20 text-red-400"
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-primary" /> : <VolumeX className="w-4 h-4 text-red-500" />}
            {soundEnabled ? "Áudio ON" : "Áudio OFF"}
          </button>
          <button 
            onClick={markAllRead} 
            disabled={busy} 
            className="glass px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white border border-white/5 hover:border-green-500/40 hover:bg-green-500/5 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4 text-green-400" /> Marcar Lidas
          </button>
          <button 
            onClick={clearAll} 
            disabled={busy} 
            className="glass px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white border border-white/5 hover:border-red-500/40 hover:bg-red-500/5 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4 text-red-400" /> Limpar Tudo
          </button>
          <button
            onClick={sendTestNotification}
            disabled={sendingTest}
            className="glass px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white border border-white/5 hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Zap className={`w-4 h-4 text-cyan-400 ${sendingTest ? "animate-spin" : ""}`} /> Log Teste
          </button>
        </div>
      </div>

      {/* METRICS GRID - NEON CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total de Alertas", value: metrics.total, color: "gray" },
          { label: "Não Lidas", value: metrics.unread_count, color: "primary", glow: true },
          { label: "Transmitidas", value: metrics.emitted, color: "green" },
          { label: "Erros de Entrega", value: metrics.delivery_failed, color: "red" },
        ].map((m, i) => (
          <div key={i} className={`glass rounded-2xl p-6 border relative overflow-hidden group transition-all duration-500 ${
            m.color === 'primary' ? 'border-primary/40 bg-primary/5' : 
            m.color === 'green' ? 'border-green-500/20' : 
            m.color === 'red' ? 'border-red-500/20' : 'border-white/5'
          }`}>
             <div className="relative z-10">
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-1">{m.label}</p>
              <p className={`text-4xl font-black italic tracking-tighter ${
                m.color === 'primary' ? 'text-primary' : 
                m.color === 'green' ? 'text-green-400' : 
                m.color === 'red' ? 'text-red-500' : 'text-white'
              }`}>{m.value}</p>
            </div>
            {m.glow && <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 blur-[40px] rounded-full -mr-12 -mt-12 group-hover:bg-primary/20 transition-all" />}
          </div>
        ))}
      </div>

      {/* FILTER TABS & LIST */}
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-black/40 p-1 rounded-2xl border border-white/5">
            {[
              { id: "all", label: "Registro Geral" },
              { id: "unread", label: "Novos Alertas" },
              { id: "critical", label: "Alta Prioridade" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as any)}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                  filter === f.id ? "bg-primary text-black" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button 
            onClick={() => fetchNotifications(false)} 
            className="group flex items-center gap-2 text-gray-500 hover:text-primary transition-all text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-transparent hover:border-primary/20"
          >
            <RefreshCw className="w-3 h-3 group-hover:rotate-180 transition-all duration-500" /> Sincronizar
          </button>
        </div>

        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase text-primary/60 tracking-[0.3em] animate-pulse">Estabelecendo Conexão...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 relative">
            <AnimatePresence mode="popLayout" initial={false}>
              {filteredItems.map((item) => {
                const tone = eventTone(item);
                const isCritical = tone === 'red' || item.priority === 'P1';
                
                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className={`group relative glass rounded-2xl border-l-[6px] border transition-all duration-300 ${
                      item.is_read ? "opacity-60 grayscale-[0.4]" : "hover:border-primary/40 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)]"
                    } ${
                      tone === "red" ? "border-red-500/50 bg-red-950/5 border-white/5" : 
                      tone === "orange" ? "border-orange-500/50 bg-orange-950/5 border-white/5" : 
                      tone === "cyan" ? "border-cyan-500/50 bg-cyan-900/5 border-white/5" :
                      "border-green-500/50 bg-green-950/5 border-white/5"
                    }`}
                    onClick={() => !item.is_read && markRead(item.id)}
                  >
                    <div className="p-5 flex items-start justify-between gap-6 cursor-pointer">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-black/40 ${
                            tone === 'red' ? 'text-red-400' : 
                            tone === 'orange' ? 'text-orange-400' : 
                            tone === 'cyan' ? 'text-cyan-400' : 'text-green-400'
                          }`}>
                            {tone === 'red' ? <ShieldAlert className="w-4 h-4" /> : 
                             tone === 'orange' ? <AlertTriangle className="w-4 h-4" /> : 
                             tone === 'cyan' ? <Zap className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                          </div>
                          <div className="flex flex-col">
                            <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${
                              tone === 'red' ? 'text-red-400' : 
                              tone === 'orange' ? 'text-orange-400' : 
                              tone === 'cyan' ? 'text-cyan-400' : 'text-green-400'
                            }`}>
                              {item.priority || "P2"} / {item.event_type?.replace('_', ' ') || "SISTEMA"}
                            </span>
                            <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase">
                              <Clock className="w-3 h-3" /> {formatDateTime(item.created_at)}
                            </div>
                          </div>
                          {!item.is_read && (
                            <div className="px-2.5 py-0.5 rounded-full bg-primary text-black text-[8px] font-black uppercase ml-2 animate-bounce">
                              AO VIVO
                            </div>
                          )}
                        </div>

                        <h3 className="text-sm md:text-md text-white font-bold tracking-tight leading-relaxed max-w-2xl">
                          {item.message || "Sem dados de telemetria."}
                        </h3>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                           {item.symbol && (
                            <div className="bg-white/5 px-2 py-1 rounded text-[10px] text-gray-400 font-bold">
                              ATIVO: <span className="text-white">{item.symbol}</span>
                            </div>
                          )}
                           {item.side && (
                            <div className="bg-white/5 px-2 py-1 rounded text-[10px] text-gray-400 font-bold">
                              LADO: <span className={item.side === 'BUY' ? 'text-green-400' : 'text-red-400'}>{item.side}</span>
                            </div>
                          )}
                          <div className="bg-white/5 px-2 py-1 rounded text-[10px] text-gray-400 font-bold">
                            CAT: <span className="text-gray-200 uppercase">{item.category || "Geral"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteOne(item.id); }}
                          className="p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all border border-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {filteredItems.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="glass p-20 rounded-2xl border border-white/5 text-center flex flex-col items-center space-y-4"
              >
                <div className="p-4 rounded-full bg-white/5">
                  <Bell className="w-10 h-10 text-gray-700" />
                </div>
                <div className="space-y-1">
                  <p className="text-white font-black uppercase tracking-widest text-[11px]">Sistema em Espera</p>
                  <p className="text-gray-500 text-xs">Aguardando novos eventos telemétricos.</p>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {toast && (
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[120] glass px-6 py-4 rounded-2xl border border-primary/40 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-3"
        >
          <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white">{toast}</span>
        </motion.div>
      )}
    </div>
  );
}

