"use client";

import React, { useState, useEffect } from "react";
import { Database, RefreshCw, CheckCircle2, X as CloseIcon, AlertCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";

interface InventoryItem {
  symbol: string;
  timeframe: string;
  last_sync: string;
  size_bytes: number;
}

interface DataTabProps {
  apiBase: string;
}

export default function DataTab({ apiBase }: DataTabProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchInventory = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${apiBase}/lab/inventory`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setInventory(data.items || []);
    } catch (err) {
      console.error("Erro ao carregar inventário de dados", err);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const syncAll = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setSyncing(true);
    setMessage(null);
    try {
      const res = await fetch(`${apiBase}/lab/sync-all`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.ok) {
        setMessage({ type: "success", text: "Sincronização global concluída com sucesso!" });
        fetchInventory();
      } else {
        setMessage({ type: "error", text: "Falha na sincronização global." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Erro na comunicação com a API." });
    } finally {
      setSyncing(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header & Main Action */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full -mr-20 -mt-20 group-hover:bg-primary/10 transition-colors" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white flex items-center gap-3">
              <Database className="w-8 h-8 text-primary" />
              Fimathe Data Lake
            </h2>
            <p className="text-gray-400 text-sm max-w-md">
              Mantenha o histórico de 14 dias dos seus ativos monitorados sempre local. 
              Isso torna o Strategy Lab instantâneo e independente do MT5.
            </p>
          </div>

          <button
            onClick={syncAll}
            disabled={syncing}
            className={`
              relative px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm
              transition-all duration-300 flex items-center gap-3
              ${syncing 
                ? "bg-gray-800 text-gray-500 cursor-not-allowed" 
                : "bg-primary text-black hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"}
            `}
          >
            {syncing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                Sincronizar Tudo
              </>
            )}
          </button>
        </div>

        {message && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-6 p-4 rounded-xl flex items-center gap-3 border ${
              message.type === "success" 
                ? "bg-primary/10 border-primary/20 text-primary" 
                : "bg-red-500/10 border-red-500/20 text-red-400"
            }`}
          >
            {message.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="text-sm font-bold">{message.text}</span>
          </motion.div>
        )}
      </div>

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {inventory.length > 0 ? (
          inventory.map((item) => (
            <motion.div
              layout
              key={`${item.symbol}-${item.timeframe}`}
              className="bg-white/5 border border-white/5 hover:border-white/10 rounded-2xl p-5 group transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-black text-primary">{item.symbol.substring(0, 3)}</span>
                  </div>
                  <div>
                    <h3 className="text-white font-black">{item.symbol}</h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">{item.timeframe}</p>
                  </div>
                </div>
                <div className="px-2 py-1 rounded-md bg-white/5 text-[9px] font-black text-gray-400 uppercase tracking-tighter">
                  {formatSize(item.size_bytes)}
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1 uppercase">
                    <Clock className="w-3 h-3" />
                    Último Sync
                  </span>
                  <span className="text-[10px] text-gray-300 font-mono">
                    {new Date(item.last_sync).toLocaleString()}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-full opacity-50" />
                  </div>
                  <span className="text-[9px] font-black text-primary uppercase">Pronto</span>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center space-y-4">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
              <Database className="w-8 h-8 text-gray-600" />
            </div>
            <p className="text-gray-500 font-bold">Nenhum dado local encontrado. Clique em Sincronizar Tudo.</p>
          </div>
        )}
      </div>
    </div>
  );
}
