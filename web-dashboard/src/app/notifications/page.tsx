"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
  return parsed.toLocaleString("pt-BR");
}

function eventTone(item: NotificationItem): "red" | "green" | "orange" {
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
      // Sem ação: alguns browsers bloqueiam áudio sem gesto do usuário.
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
      setLoading(false);
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
      setToast("Todas as notificações foram marcadas como lidas.");
    } finally {
      setBusy(false);
      setTimeout(() => setToast(null), 2200);
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
      fetchNotifications(false);
    } catch (error) {
      console.error(error);
    }
  };

  const clearAll = async () => {
    if (!window.confirm("Excluir TODAS as notificações? Esta ação não pode ser desfeita.")) return;
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
      setToast("Todas as notificações foram removidas.");
    } finally {
      setBusy(false);
      setTimeout(() => setToast(null), 2200);
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
          message: "Teste manual de notificacao disparado pelo painel.",
          category: "health",
          priority: "P2",
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      await fetchNotifications(false);
      setToast("Notificacao de teste enviada.");
    } catch (error) {
      console.error(error);
      setToast("Falha ao enviar notificacao de teste.");
    } finally {
      setSendingTest(false);
      setTimeout(() => setToast(null), 2200);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-5 h-5 text-primary" />
            <span className="text-primary text-[10px] font-black uppercase tracking-[0.2em]">Central de Alertas</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter">
            NOTIFICAÇÕES <span className="text-primary">EM TEMPO REAL</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">Entrada, stop, break-even, erros e eventos críticos do robô.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSoundEnabled((v) => !v)}
            className="glass px-4 py-2 rounded-xl text-xs font-black text-white border border-white/10 hover:border-primary/30 transition-all flex items-center gap-2"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-primary" /> : <VolumeX className="w-4 h-4 text-red-400" />}
            {soundEnabled ? "Som Ligado" : "Som Mutado"}
          </button>
          <button onClick={markAllRead} disabled={busy} className="glass px-4 py-2 rounded-xl text-xs font-black text-white border border-white/10 hover:border-green-400/30 transition-all flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" /> Marcar Todas Lidas
          </button>
          <button onClick={clearAll} disabled={busy} className="glass px-4 py-2 rounded-xl text-xs font-black text-white border border-red-500/30 hover:bg-red-500/10 transition-all flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-red-400" /> Limpar Tudo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass rounded-2xl p-5 border border-white/10"><p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Total</p><p className="text-2xl font-black text-white">{metrics.total}</p></div>
        <div className="glass rounded-2xl p-5 border border-primary/30 bg-primary/5"><p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Não Lidas</p><p className="text-2xl font-black text-primary">{metrics.unread_count}</p></div>
        <div className="glass rounded-2xl p-5 border border-green-500/20"><p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Emitidas</p><p className="text-2xl font-black text-green-400">{metrics.emitted}</p></div>
        <div className="glass rounded-2xl p-5 border border-red-500/20"><p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Falha Entrega</p><p className="text-2xl font-black text-red-400">{metrics.delivery_failed}</p></div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { id: "all", label: "Todas" },
          { id: "unread", label: "Não Lidas" },
          { id: "critical", label: "Críticas" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as "all" | "unread" | "critical")}
            className={`px-4 py-2 rounded-xl text-xs font-black border transition-all flex items-center gap-2 ${
              filter === f.id ? "bg-primary text-black border-primary" : "glass text-gray-300 border-white/10"
            }`}
          >
            <Filter className="w-3 h-3" /> {f.label}
          </button>
        ))}
        <button onClick={() => fetchNotifications(false)} className="glass px-4 py-2 rounded-xl text-xs font-black text-gray-300 border border-white/10 flex items-center gap-2">
          <RefreshCw className="w-3 h-3" /> Atualizar
        </button>
        <button
          onClick={sendTestNotification}
          disabled={sendingTest}
          className="glass px-4 py-2 rounded-xl text-xs font-black text-white border border-cyan-400/30 hover:bg-cyan-500/10 transition-all flex items-center gap-2 disabled:opacity-60"
        >
          <Bell className="w-3 h-3 text-cyan-300" /> {sendingTest ? "Enviando..." : "Enviar Teste"}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-20">
          <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => {
            const tone = eventTone(item);
            const toneClasses =
              tone === "red"
                ? "border-red-500/30 bg-red-950/20"
                : tone === "orange"
                ? "border-orange-500/30 bg-orange-950/20"
                : "border-green-500/30 bg-green-950/20";
            return (
              <div
                key={item.id}
                className={`glass p-5 rounded-2xl border ${toneClasses} ${item.is_read ? "opacity-75" : ""}`}
                onClick={() => {
                  if (!item.is_read) markRead(item.id);
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {tone === "red" ? (
                        <ShieldAlert className="w-4 h-4 text-red-300" />
                      ) : tone === "orange" ? (
                        <AlertTriangle className="w-4 h-4 text-orange-300" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-green-300" />
                      )}
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">{item.priority || "P2"}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{item.event_type || "EVENT"}</span>
                      {!item.is_read && <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary text-black font-black">NOVA</span>}
                    </div>
                    <p className="text-sm text-white font-semibold leading-relaxed">{item.message || "Sem mensagem."}</p>
                    <p className="text-[11px] text-gray-400">
                      {item.symbol ? `${item.symbol} • ` : ""}
                      {item.side ? `${item.side} • ` : ""}
                      {item.category || "setup"} • {formatDateTime(item.created_at)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteOne(item.id);
                    }}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Excluir notificação"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
          {filteredItems.length === 0 && (
            <div className="glass p-10 rounded-2xl border border-white/10 text-center text-gray-400 text-sm">
              Nenhuma notificação encontrada para este filtro.
            </div>
          )}
        </div>
      )}

      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[120] glass px-5 py-3 rounded-2xl border border-primary/30 text-xs font-black text-white">
          {toast}
        </div>
      )}
    </div>
  );
}

