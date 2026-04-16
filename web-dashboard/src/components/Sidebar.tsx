"use client";

import React from 'react';
import { 
  LayoutDashboard, 
  Settings, 
  Activity, 
  Terminal, 
  TrendingUp, 
  ShieldCheck,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: Activity, label: 'Monitor Fimathe', href: '/monitor' },
  { icon: Terminal, label: 'Logs & Auditoria', href: '/logs' },
  { icon: Settings, label: 'Configurações', href: '/settings' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 glass border-r border-white/10 z-50 flex flex-col">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30 glow-primary">
          <Zap className="text-primary w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Robo MT5</h1>
          <p className="text-[10px] text-primary font-mono uppercase tracking-widest">v2.0 Premium</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                isActive 
                  ? 'bg-primary/10 text-primary border border-primary/20 glow-primary' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-primary' : 'group-hover:text-primary'}`} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        <div className="glass-accent p-4 rounded-2xl border border-primary/10">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="text-primary w-4 h-4" />
            <span className="text-xs font-semibold text-white">Segurança Ativa</span>
          </div>
          <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
            <div className="bg-primary h-full w-full opacity-50 glow-primary"></div>
          </div>
          <p className="text-[10px] text-gray-400 mt-2">Nenhum erro detectado no feed de sinais.</p>
        </div>
      </div>
    </aside>
  );
}
