"use client";

import React from 'react';
import {
  LayoutDashboard,
  Settings,
  Activity,
  Terminal,
  TrendingUp,
  ShieldCheck,
  Zap,
  GraduationCap,
  BookOpenCheck,
  Beaker,
  ChevronLeft,
  Menu,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: Activity, label: 'Monitor Fimathe', href: '/monitor' },
  { icon: TrendingUp, label: 'Estatísticas', href: '/stats' },
  { icon: Terminal, label: 'Logs & Auditoria', href: '/logs' },
  { icon: Settings, label: 'Configurações', href: '/settings' },
  { icon: BookOpenCheck, label: 'Como o Robô Opera', href: '/estrategia' },
  { icon: Beaker, label: 'Strategy Lab', href: '/lab' },
  { icon: GraduationCap, label: 'Fimathe Academy', href: '/academy' },
];

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
}

export function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isCollapsed ? 80 : 256 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed left-0 top-0 h-screen glass border-r border-white/10 z-50 flex flex-col overflow-hidden"
    >
      {/* Header & Toggle */}
      <div className={`p-6 flex items-center justify-between mb-4`}>
        <div className="flex items-center gap-3 overflow-hidden">
          <motion.div 
            className="w-10 h-10 bg-primary/20 rounded-xl flex-shrink-0 flex items-center justify-center border border-primary/30 glow-primary shadow-[0_0_15px_rgba(0,255,170,0.3)]"
          >
            <Zap className="text-primary w-6 h-6" />
          </motion.div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="whitespace-nowrap"
              >
                <h1 className="text-xl font-black text-white tracking-tight">Robo MT5</h1>
                <p className="text-[10px] text-primary font-black uppercase tracking-widest">Premium v2.0</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg border border-white/5 hover:bg-white/5 text-gray-400 hover:text-white transition-all group"
        >
          {isCollapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative ${
                isActive 
                  ? 'bg-primary/10 text-primary border border-primary/20 glow-primary' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 transition-colors ${isActive ? 'text-primary' : 'group-hover:text-primary'}`} />
              
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="font-bold text-sm whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Tooltip for collapsed mode */}
              {isCollapsed && (
                <div className="absolute left-full ml-4 px-3 py-1 bg-black/90 border border-white/10 rounded-lg text-xs font-black text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-1 group-hover:translate-x-0 z-[100] shadow-xl">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        <AnimatePresence>
          {!isCollapsed ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-accent p-4 rounded-2xl border border-primary/10 bg-gradient-to-tr from-transparent to-primary/5"
            >
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="text-primary w-4 h-4" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Segurança Ativa</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div className="bg-primary h-full w-full opacity-50 glow-primary shadow-[0_0_10px_rgba(0,255,170,0.5)]"></div>
              </div>
              <p className="text-[9px] text-gray-500 mt-2 font-medium">Nenhum erro detectado no feed.</p>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group cursor-help relative">
                <ShieldCheck className="w-5 h-5 text-primary animate-pulse" />
                <div className="absolute left-full ml-4 px-3 py-1 bg-black/90 border border-white/10 rounded-lg text-xs font-black text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-1 group-hover:translate-x-0 z-[100]">
                  SISTEMA SEGURO
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
}

