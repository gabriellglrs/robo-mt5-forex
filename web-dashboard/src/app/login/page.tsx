"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, ShieldCheck, Zap } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.access_token);
        router.push('/');
      } else {
        const errData = await res.json();
        setError(errData.detail || 'Usuário ou senha incorretos');
      }
    } catch (err) {
      setError('Erro de conexão com o servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#050505] overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 blur-[120px] rounded-full" />
      
      <div className="relative w-full max-w-md p-1 px-1 rounded-[40px] bg-gradient-to-b from-primary/20 to-transparent">
        <div className="bg-[#0a0a0a]/90 backdrop-blur-3xl p-10 rounded-[39px] shadow-2xl space-y-8 border border-white/5">
          <div className="text-center space-y-2">
            <div className="inline-flex p-4 rounded-3xl bg-primary/10 border border-primary/20 text-primary mb-2 glow-primary">
              <Zap className="w-8 h-8 fill-primary/20" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter">ROBO MT5 <span className="text-primary">v2</span></h1>
            <p className="text-gray-500 text-sm font-medium">Enterprise Trading Dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2 group">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-4">Usuário</label>
              <div className="relative flex items-center">
                <User className="absolute left-4 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                <input 
                  type="text"
                  placeholder="Seu login operacional"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-all focus:bg-white/[0.08]"
                  required
                />
              </div>
            </div>

            <div className="space-y-2 group">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-4">Senha</label>
              <div className="relative flex items-center">
                <Lock className="absolute left-4 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                <input 
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-all focus:bg-white/[0.08]"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs py-3 px-4 rounded-xl animate-shake">
                {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all glow-primary active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  ACESSAR TERMINAL
                </>
              )}
            </button>
          </form>

          <div className="pt-4 text-center">
            <p className="text-[10px] text-gray-600 font-medium uppercase tracking-widest">
              Conexão Segura AES-256 via Fimathe API
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
