"use client";

import React, { useEffect, useState } from 'react';
import { 
  Save, 
  RotateCcw, 
  Shield, 
  Target, 
  Layers, 
  Globe,
  Settings as SettingsIcon,
  Zap,
  Info,
  Server,
  Eye,
  EyeOff,
  Activity,
  ShieldAlert,
  HelpCircle,
  Plus,
  X,
  CheckCircle2,
  LogOut,
  ShieldCheck,
  Trash2
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const POPULAR_SYMBOLS = ["EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "EURGBP", "EURJPY", "BTCUSD", "ETHUSD", "XAUUSD"];

const FIMATHE_RULES = [
  { 
    id: 'FIM-001', 
    name: 'Coleta de Dados', 
    type: 'MANDATORY', 
    desc: 'Verifica conectividade e histórico de candles.', 
    tech: 'Detecta desconexão com o MT5 e valida se há dados suficientes para calcular canais.',
    category: 'analysis' 
  },
  { 
    id: 'FIM-002', 
    name: 'Tendência Principal', 
    type: 'MANDATORY', 
    desc: 'Define tendência ou bloqueia se lateral.', 
    tech: 'Calcula o slope (inclinação) da média móvel. Se inferior ao limite, bloqueia por lateralidade.',
    category: 'analysis' 
  },
  { 
    id: 'FIM-003', 
    name: 'Canais A/B', 
    type: 'MANDATORY', 
    desc: 'Marcação automática de Canais.', 
    tech: 'Identifica topos e fundos para projetar o Canal de Referência e Zona Neutra (100% amplitude).',
    category: 'analysis' 
  },
  { 
    id: 'FIM-004', 
    name: 'Conformidade de Timeframe', 
    type: 'MANDATORY', 
    desc: 'Sincronia entre H1/M15/M1.', 
    tech: 'Valida se o robô está recebendo candles dos tempos gráficos corretos para evitar sinais defasados.',
    category: 'analysis' 
  },
  { 
    id: 'FIM-005', 
    name: 'Região Negociável', 
    type: 'MANDATORY', 
    desc: 'Preço em zona de Gatilho.', 
    tech: 'Verifica se o preço está dentro do Canal A/B ou nas Projeções (50/100) onde a Fimathe autoriza negociação.',
    category: 'analysis' 
  },
  { 
    id: 'FIM-006', 
    name: 'Filtro de Agrupamento', 
    type: 'OPTIONAL', 
    desc: 'Exige consolidação no M1.', 
    tech: 'Analisa se os últimos candles no M1 ficaram em uma faixa estreita antes do rompimento.',
    key: 'require_grouping', 
    category: 'signal_logic' 
  },
  { 
    id: 'FIM-007', 
    name: 'Rompimento Canal', 
    type: 'OPTIONAL', 
    desc: 'Exige fechamento fora do canal.', 
    tech: 'Valida se o candle de sinal fechou fora do canal com corpo real, evitando pavios enganosos.',
    key: 'require_channel_break', 
    category: 'signal_logic' 
  },
  { 
    id: 'FIM-008', 
    name: 'Regra Anti-Achômetro', 
    type: 'OPTIONAL', 
    desc: 'Proximidade com S/S histórico.', 
    tech: 'Verifica S/R históricos. Se longe de níveis fortes, a entrada é considerada de baixo valor.',
    key: 'require_sr_touch', 
    category: 'signal_logic' 
  },
  { 
    id: 'FIM-009', 
    name: 'Filtro de Spread', 
    type: 'OPTIONAL', 
    desc: 'Bloqueia custo alto.', 
    tech: 'Compara o spread atual com o limite. Protege contra picos de volatilidade e spreads abusivos.',
    key: 'max_spread_points', 
    category: 'signal_logic', 
    isThreshold: true 
  },
  { 
    id: 'FIM-010', 
    name: 'Ciclo de Proteção', 
    type: 'OPTIONAL', 
    desc: 'Trailing stop automático.', 
    tech: 'Gerencia o Break-even e Profit Lock automático conforme os sub-níveis Fimathe são atingidos.',
    key: 'fimathe_cycle_enabled', 
    category: 'risk_management' 
  },
  { 
    id: 'FIM-011', 
    name: 'Reteste (Pullback)', 
    type: 'OPTIONAL', 
    desc: 'Exige retorno à borda do canal.', 
    tech: 'Aguarda o preço tocar de volta na borda do canal rompido antes de disparar a ordem.',
    key: 'require_pullback_retest', 
    category: 'signal_logic' 
  },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('strategy'); // 'strategy', 'risk', 'connection'
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchSettings = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/settings`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.status === 401) {
          localStorage.removeItem('token');
          router.push('/login');
          return;
        }

        const data = await res.json();
        setSettings(data);
      } catch (e) { 
        console.error(e); 
      }
      setLoading(false);
    };
    fetchSettings();
  }, [router]);

  const handleSave = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/settings`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ settings }),
      });
      
      if (res.ok) {
        setNotification({ message: 'CONFIGURAÇÕES APLICADAS: O robô já está operando com os novos parâmetros.', type: 'success' });
        setTimeout(() => setNotification(null), 5000);
      } else {
        setNotification({ message: 'ERRO AO SALVAR: Verifique a conexão com a API.', type: 'error' });
        setTimeout(() => setNotification(null), 5000);
      }
    } catch (e) { 
      setNotification({ message: 'ERRO CRÍTICO: Não foi possível alcançar o servidor.', type: 'error' });
      setTimeout(() => setNotification(null), 5000);
    }
    setSaving(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const updateNested = (category: string, key: string, value: any) => {
    setSettings((prev: any) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  if (loading) return (
    <div className="flex items-center justify-center p-20">
      <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );
  
  if (!settings) return <div className="p-8 text-white">Erro ao carregar configurações.</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <SettingsIcon className="w-5 h-5 text-primary animate-spin-slow" />
            <span className="text-primary text-[10px] font-black uppercase tracking-[0.2em]">Configuração do Sistema</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter">CENTRAL DE <span className="text-primary">CONTROLE</span></h1>
          <p className="text-gray-500 text-sm mt-1 max-w-md">Gerencie os parâmetros operacionais, conexão com MetaTrader 5 e filtros de risco da estratégia Fimathe.</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={handleLogout}
            className="glass px-5 py-2.5 rounded-2xl text-[10px] font-bold text-red-400 hover:bg-red-500/10 transition-all flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" /> SAIR
          </button>
          <button 
            onClick={() => window.location.reload()}
            className="glass px-6 py-2.5 rounded-2xl text-[10px] font-bold text-gray-400 hover:text-white transition-all flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> RESETAR
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className={`px-8 py-2.5 rounded-2xl text-[11px] font-black transition-all flex items-center gap-2 relative overflow-hidden ${
              saving ? 'bg-primary/50 text-black' : 'bg-primary text-black hover:bg-primary/80 glow-primary shadow-[0_0_20px_rgba(34,211,238,0.2)]'
            }`}
          >
            {saving ? (
              <Activity className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'SINCRONIZANDO...' : 'SALVAR ALTERAÇÕES'}
          </button>
        </div>
      </div>

      {/* Premium Toast Notification */}
      {notification && (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-[32px] border glass flex items-center gap-4 animate-in slide-in-from-top-10 fade-in duration-500 shadow-2xl ${
          notification.type === 'success' ? 'border-primary/30' : 'border-red-500/30'
        }`}>
          <div className={`p-2 rounded-full ${notification.type === 'success' ? 'bg-primary/20 text-primary' : 'bg-red-500/20 text-red-500'}`}>
            {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-0.5">Notificação do Sistema</span>
            <span className="text-[11px] font-bold text-white">{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="ml-4 text-white/20 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs Menu */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-3xl w-fit border border-white/5">
        {[
          { id: 'strategy', label: 'Estratégia', icon: Layers },
          { id: 'risk', label: 'Gestão de Risco', icon: Shield },
          { id: 'connection', label: 'Conexão & Filtros', icon: Server },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-[22px] text-xs font-bold transition-all ${
              activeTab === tab.id 
                ? 'bg-primary text-black shadow-lg shadow-primary/20' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 animate-in fade-in duration-500">
        
        {/* Tab content: STRATEGY */}
        {activeTab === 'strategy' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <section className="glass p-10 rounded-[48px] border border-white/5 space-y-8">
              <div className="flex items-center gap-4">
                <div className="p-3.5 rounded-2xl bg-secondary/10 border border-secondary/20 text-secondary">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">Parametrização Fimathe</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Defina os canais e sensibilidade</p>
                </div>
              </div>

              <div className="space-y-6">
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-2 tracking-widest flex items-center gap-2">
                       Ativos Monitorados 
                       <span className="text-[8px] bg-white/5 px-2 py-0.5 rounded text-gray-500">SELECIONE OS PARES PARA ANÁLISE</span>
                    </label>
                    
                    <div className="flex flex-wrap gap-2 p-4 bg-white/[0.02] border border-white/5 rounded-[32px]">
                      {Array.isArray(settings.analysis?.symbols) && settings.analysis.symbols.map((sym: string) => (
                        <div key={sym} className="flex items-center gap-2 bg-secondary/10 border border-secondary/20 text-secondary px-3 py-1.5 rounded-full text-[10px] font-black group animate-in zoom-in duration-300">
                          {sym}
                          <button 
                            onClick={() => {
                              const newList = settings.analysis.symbols.filter((s: string) => s !== sym);
                              updateNested('analysis', 'symbols', newList);
                            }}
                            className="hover:text-white transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      
                      <div className="flex items-center gap-2 ml-auto">
                        <select 
                          onChange={(e) => {
                            if (e.target.value && !settings.analysis?.symbols?.includes(e.target.value)) {
                              const newList = [...(settings.analysis?.symbols || []), e.target.value];
                              updateNested('analysis', 'symbols', newList);
                            }
                            e.target.value = "";
                          }}
                          className="bg-transparent text-[10px] font-bold text-gray-500 focus:outline-none cursor-pointer hover:text-white transition-colors"
                        >
                          <option value="">+ ADICIONAR POPULAR</option>
                          {POPULAR_SYMBOLS.filter(s => !settings.analysis?.symbols?.includes(s)).map(s => (
                            <option key={s} value={s} className="bg-black">{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-gray-500 uppercase ml-2 tracking-widest">Lookback Histórico (Velas)</label>
                       <input 
                          type="number" 
                          value={settings.analysis?.trend_candles || 200}
                          onChange={(e) => updateNested('analysis', 'trend_candles', parseInt(e.target.value))}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-secondary transition-all"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-gray-500 uppercase ml-2 tracking-widest">Slope Mínimo (Pontos)</label>
                       <input 
                          type="number" step="0.01"
                          value={settings.signal_logic?.trend_min_slope_points || 0.20}
                          onChange={(e) => updateNested('signal_logic', 'trend_min_slope_points', parseFloat(e.target.value))}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-secondary transition-all"
                       />
                    </div>
                 </div>
              </div>
            </section>

            <section className="glass p-10 rounded-[48px] border border-white/5 space-y-8">
              <div className="flex items-center gap-4">
                <div className="p-3.5 rounded-2xl bg-accent/10 border border-accent/20 text-accent">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">Execução e Timeframes</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Ciclos de análise temporal</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-[10px] text-gray-400 font-bold uppercase ml-2">Timeframe Tendência</label>
                   <select 
                      value={settings.signal_logic?.trend_timeframe || 'H1'}
                      onChange={(e) => updateNested('signal_logic', 'trend_timeframe', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-accent appearance-none"
                   >
                      {['H4','H1','M30','M15'].map(tf => <option key={tf} value={tf}>{tf}</option>)}
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] text-gray-400 font-bold uppercase ml-2">Timeframe Entrada</label>
                   <select 
                      value={settings.signal_logic?.entry_timeframe || 'M15'}
                      onChange={(e) => updateNested('signal_logic', 'entry_timeframe', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-accent appearance-none"
                   >
                      {['M30','M15','M5','M1'].map(tf => <option key={tf} value={tf}>{tf}</option>)}
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] text-gray-400 font-bold uppercase ml-2">Breakout Buffer (Pts)</label>
                   <input 
                      type="number"
                      value={settings.signal_logic?.breakout_buffer_points || 10}
                      onChange={(e) => updateNested('signal_logic', 'breakout_buffer_points', parseInt(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-accent"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] text-gray-400 font-bold uppercase ml-2">S/R Tolerance (Pts)</label>
                   <input 
                      type="number"
                      value={settings.signal_logic?.sr_tolerance_points || 35}
                      onChange={(e) => updateNested('signal_logic', 'sr_tolerance_points', parseInt(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-accent"
                   />
                </div>
              </div>
            </section>

            <section className="glass p-10 rounded-[48px] border border-white/5 space-y-8 lg:col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">Gestor de Regras Fimathe</h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Controle de gatilhos e algoritmos</p>
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                  <Info className="w-3 h-3 text-gray-500" />
                  <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Passe o mouse para detalhes técnicos</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {FIMATHE_RULES.map((rule) => (
                  <div 
                    key={rule.id} 
                    className={`glass p-5 rounded-[32px] border transition-all duration-300 relative group overflow-hidden ${
                      rule.type === 'MANDATORY' ? 'border-primary/10 bg-primary/[0.01]' : 'border-white/5 hover:border-accent/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3 relative z-30">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                        rule.type === 'MANDATORY' ? 'bg-primary/20 text-primary' : 'bg-gray-500/10 text-gray-500'
                      }`}>
                        {rule.id}
                      </span>
                      {rule.type === 'MANDATORY' ? (
                        <CheckCircle2 className="w-4 h-4 text-primary opacity-50" />
                      ) : (
                        <div className="relative">
                          <div 
                            onClick={() => {
                              const currentVal = rule.isThreshold ? (settings[rule.category!]?.[rule.key!] > 0) : settings[rule.category!]?.[rule.key!];
                              const newVal = !currentVal;
                              if (rule.isThreshold) {
                                updateNested(rule.category!, rule.key!, newVal ? 30 : 0);
                              } else {
                                updateNested(rule.category!, rule.key!, newVal);
                              }
                            }}
                            className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-all duration-300 ${
                              (rule.isThreshold ? (settings[rule.category!]?.[rule.key!] > 0) : settings[rule.category!]?.[rule.key!]) 
                              ? 'bg-accent/40 shadow-[0_0_10px_rgba(244,114,182,0.2)]' 
                              : 'bg-white/10'
                            }`}
                          >
                            <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 ${
                              (rule.isThreshold ? (settings[rule.category!]?.[rule.key!] > 0) : settings[rule.category!]?.[rule.key!]) 
                              ? 'translate-x-5 shadow-[0_0_10px_rgba(255,255,255,0.5)]' 
                              : 'translate-x-0'
                            }`} />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <h4 className="text-xs font-bold text-white mb-1 group-hover:text-accent transition-colors">{rule.name}</h4>
                    <p className="text-[9px] text-gray-500 leading-relaxed mb-1 pr-6">{rule.desc}</p>
                    
                    <div className="absolute inset-0 bg-black/90 p-5 pt-14 flex flex-col justify-start translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-20 backdrop-blur-xl">
                       <div className="flex items-center gap-2 mb-2 border-t border-white/5 pt-3">
                          <Info className="w-3 h-3 text-accent" />
                          <span className="text-[8px] font-black text-accent uppercase tracking-widest">Detalhe Técnico</span>
                       </div>
                       <p className="text-[9px] text-gray-400 leading-relaxed selection:bg-accent/30">
                          {rule.tech}
                       </p>
                    </div>

                    {rule.type === 'MANDATORY' && (
                      <div className="absolute top-4 right-4 p-2">
                         <HelpCircle className="w-3 h-3 text-primary/30" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Tab content: RISK */}
        {activeTab === 'risk' && (
          <section className="glass p-10 rounded-[48px] border border-white/5 space-y-10 max-w-4xl mx-auto w-full">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">Gestão de Exposição e Risco</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Proteção do capital e limites</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-8">
                 <div className="space-y-3">
                    <div className="flex justify-between items-center group">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Risco por Trade</label>
                      <span className="text-primary font-black text-xl">{settings.risk_management?.risk_percent || 0.5}%</span>
                    </div>
                    <input 
                       type="range" min="0.1" max="3" step="0.1"
                       value={settings.risk_management?.risk_percent || 0.5}
                       onChange={(e) => updateNested('risk_management', 'risk_percent', parseFloat(e.target.value))}
                       className="w-full accent-primary bg-white/10 h-2 rounded-full appearance-none cursor-pointer"
                    />
                    <p className="text-[10px] text-gray-600 italic">* Risco máximo travado em 3% por segurança sistêmica.</p>
                 </div>

                 <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                       <div className="flex flex-col">
                          <span className="text-sm font-bold text-white">Ciclo Fimathe Ativo</span>
                          <span className="text-[10px] text-gray-500">Trailing dinâmico 50/80/100</span>
                       </div>
                       <input 
                        type="checkbox" 
                        checked={settings.risk_management?.fimathe_cycle_enabled || false} 
                        onChange={(e) => updateNested('risk_management', 'fimathe_cycle_enabled', e.target.checked)} 
                        className="w-10 h-10 accent-primary cursor-pointer" 
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                       <div className="flex flex-col">
                          <span className="text-sm font-bold text-white">Break-even Automático</span>
                          <span className="text-[10px] text-gray-500">Mover para entrada após 1º nível</span>
                       </div>
                       <input 
                        type="checkbox" 
                        checked={settings.risk_management?.use_breakeven || false} 
                        onChange={(e) => updateNested('risk_management', 'use_breakeven', e.target.checked)} 
                        className="w-10 h-10 accent-primary cursor-pointer" 
                      />
                    </div>
                 </div>
              </div>

              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase ml-2 tracking-widest">Max. Posições Simultâneas</label>
                    <input 
                       type="number"
                       value={settings.risk_management?.max_open_positions || 3}
                       onChange={(e) => updateNested('risk_management', 'max_open_positions', parseInt(e.target.value))}
                       className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-primary transition-all"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-2 tracking-widest">Magic Number (Identificador)</label>
                    <input type="number" value={settings.risk_management?.magic_number || 202404} onChange={(e) => updateNested('risk_management', 'magic_number', parseInt(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-2 tracking-widest">Cooldown entre Ordens (Segundos)</label>
                    <input type="number" value={settings.risk_management?.symbol_cooldown_seconds || 3600} onChange={(e) => updateNested('risk_management', 'symbol_cooldown_seconds', parseInt(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white" />
                 </div>
              </div>
            </div>
          </section>
        )}

        {/* Tab content: CONNECTION */}
        {activeTab === 'connection' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <section className="glass p-10 rounded-[48px] border border-white/5 space-y-8">
              <div className="flex items-center gap-4">
                <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Server className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">Terminal MetaTrader 5</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Credenciais de negociação</p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-2 tracking-widest">Servidor Corretora</label>
                  <input 
                    type="text"
                    value={settings.mt5_connection?.server || 'Alpari-MT5-Demo'}
                    onChange={(e) => updateNested('mt5_connection', 'server', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-2 tracking-widest">Login (ID)</label>
                    <input 
                      type="number"
                      value={settings.mt5_connection?.login || 0}
                      onChange={(e) => updateNested('mt5_connection', 'login', parseInt(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-2 tracking-widest">Password</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? 'text' : 'password'}
                        value={settings.mt5_connection?.password || ''}
                        onChange={(e) => updateNested('mt5_connection', 'password', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-indigo-500 pr-12"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="glass p-10 rounded-[48px] border border-white/5 space-y-8">
              <div className="flex items-center gap-4">
                <div className="p-3.5 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">Filtros de Execução</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Proteção contra volatilidade</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-gray-400 uppercase ml-2 tracking-widest">Spread Máximo (Pontos)</label>
                   <div className="relative">
                    <input 
                      type="number"
                      value={settings.signal_logic?.max_spread_points || 30}
                      onChange={(e) => updateNested('signal_logic', 'max_spread_points', parseInt(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-orange-500"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-600 tracking-tighter uppercase">Pts</span>
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-gray-400 uppercase ml-2 tracking-widest">Slippage / Desvio (Pts)</label>
                   <div className="relative">
                    <input 
                      type="number"
                      value={settings.signal_logic?.max_slippage_points || 20}
                      onChange={(e) => updateNested('signal_logic', 'max_slippage_points', parseInt(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-orange-500"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-600 tracking-tighter uppercase">Pts</span>
                   </div>
                </div>
              </div>

              <div className="p-6 bg-orange-500/10 rounded-[32px] border border-orange-500/20">
                <div className="flex gap-3">
                  <Info className="w-5 h-5 text-orange-400 shrink-0" />
                  <p className="text-[11px] text-orange-200/80 leading-relaxed font-medium mt-0.5">
                    O robô rejeitará sinais no momento do rompimento caso o Spread atual da corretora exceda o limite parametrizado. Isso garante que sua margem de lucro não seja absorvida pelos custos operais.
                  </p>
                </div>
              </div>
            </section>

            <section className="glass p-10 rounded-[48px] border border-white/5 space-y-8">
              <div className="flex items-center gap-4">
                <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">Manutenção Automática</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Gestão de armazenamento de logs</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-2 tracking-widest">Auto-Limpeza de Logs (Minutos)</label>
                  <div className="relative">
                    <input 
                      type="number"
                      value={settings.ui_settings?.log_cleanup_minutes || 0}
                      onChange={(e) => updateNested('ui_settings', 'log_cleanup_minutes', parseInt(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-red-500"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-600 tracking-tighter uppercase">Min</span>
                  </div>
                  <p className="text-[9px] text-gray-600 ml-2 italic">* O robô limpará logs mais antigos que o tempo definido. Use 0 para desativar.</p>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
