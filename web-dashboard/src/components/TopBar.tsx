"use client";

import React, { useEffect, useState } from 'react';
import { Power, Circle, RefreshCcw, Bell } from 'lucide-react';

export function TopBar() {
  const [status, setStatus] = useState({ status: 'stopped', pid: null });
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      setStatus({ status: 'stopped', pid: null });
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
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
        <button 
          onClick={handleToggle}
          disabled={loading}
          className={`flex items-center gap-3 px-6 py-2.5 rounded-full font-bold transition-all duration-300 ${
            status.status === 'running' 
              ? 'bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20' 
              : 'bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 glow-primary'
          } ${loading && 'opacity-50 cursor-not-allowed'}`}
        >
          <Power className="w-4 h-4" />
          {loading ? 'Processando...' : status.status === 'running' ? 'Parar Robô' : 'Iniciar Robô'}
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
