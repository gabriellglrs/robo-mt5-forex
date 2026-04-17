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
  Trash2,
  HelpCircle as InfoIcon
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { RuleTooltip } from '@/components/RuleTooltip';

const POPULAR_SYMBOLS = [
  "EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD", "USDCHF", "NZDUSD", // Majors
  "EURGBP", "EURJPY", "EURCHF", "EURAUD", "GBPJPY", "GBPAUD", "AUDJPY", // Minors
  "XAUUSD", "XAGUSD", "BTCUSD", "ETHUSD", "US30", "SPX500", "NAS100", "GER40" // Metals, Crypto, Indices
];

const FIMATHE_RULES = [
  { 
    id: 'FIM-001', 
    name: 'Coleta de Dados', 
    type: 'MANDATORY', 
    desc: 'Verifica conectividade e histórico de candles.', 
    category: 'analysis',
    purpose: 'Garante que o robô tenha insumos técnicos confiáveis para operar.',
    onActive: 'Bloqueia operações preventivamente se a conexão com o MT5 falhar ou se houver "buracos" no histórico de preços.',
    onInactive: 'Regra obrigatória. Não pode ser desativada para evitar execuções baseadas em dados corrompidos.'
  },
  { 
    id: 'FIM-002', 
    name: 'Tendência Principal', 
    type: 'MANDATORY', 
    desc: 'Define tendência ou bloqueia se lateral.', 
    category: 'analysis',
    purpose: 'Filtra mercados em consolidacao (caixote) que destroem o capital.',
    onActive: 'Só permite compras em tendência de alta e vendas em baixa, seguindo o fluxo institucional.',
    onInactive: 'Regra obrigatória. Sem ela, o robô operaria em lateralidade, onde a maioria dos stops são atingidos.'
  },
  { 
    id: 'FIM-003', 
    name: 'Canais A/B', 
    type: 'MANDATORY', 
    desc: 'Marcação automática de Canais.', 
    category: 'analysis',
    purpose: 'Define a "região de valor" do preço baseada na volatilidade recente.',
    onActive: 'Calcula matematicamente o Canal de Referência e Zona Neutra para projetar alvos realistas.',
    onInactive: 'Regra obrigatória. Essencial para a existência da técnica Fimathe no código.'
  },
  { 
    id: 'FIM-004', 
    name: 'Sincronia Temporal', 
    type: 'MANDATORY', 
    desc: 'Sincronia entre H1/M15/M1.', 
    category: 'analysis',
    purpose: 'Garante que a análise macro e micro estejam alinhadas no mesmo segundo.',
    onActive: 'Valida se os candles de diferentes timeframes foram recebidos corretamente.',
    onInactive: 'Regra obrigatória. Evita sinais baseados em preços antigos ou defasados.'
  },
  { 
    id: 'FIM-005', 
    name: 'Região Negociável', 
    type: 'MANDATORY', 
    desc: 'Preço em zona de Gatilho.', 
    category: 'analysis',
    purpose: 'Garante que a entrada ocorra apenas em pontos de alta probabilidade estatística.',
    onActive: 'Filtra o preço para que as ordens só ocorram dentro dos limites técnicos autorizados.',
    onInactive: 'Regra obrigatória. Impede entradas "no meio do nada" que ignoram a estrutura de canais.'
  },
  { 
    id: 'FIM-006', 
    name: 'Filtro de Agrupamento', 
    type: 'OPTIONAL', 
    desc: 'Exige consolidação no M1.', 
    key: 'require_grouping', 
    category: 'signal_logic',
    purpose: 'Proteção contra rompimentos falsos de um único candle (spike).',
    onActive: 'Exige que o preço "respire" e consolide força antes de romper o canal.',
    onInactive: 'Entradas mais rápidas, porém 30% mais expostas a "violinos" e reversões imediatas.'
  },
  { 
    id: 'FIM-007', 
    name: 'Rompimento Canal', 
    type: 'OPTIONAL', 
    desc: 'Exige fechamento fora do canal.', 
    key: 'require_channel_break', 
    category: 'signal_logic',
    purpose: 'Validação de força compradora ou vendedora real.',
    onActive: 'Exige que o candle feche com o corpo fora da borda, ignorando pavios enganosos.',
    onInactive: 'Entradas antecipadas; ganha alguns pontos, mas aumenta o risco de rompimento falso.'
  },
  { 
    id: 'FIM-008', 
    name: 'Regra Anti-Achômetro', 
    type: 'OPTIONAL', 
    desc: 'Proximidade com S/S histórico.', 
    key: 'require_sr_touch', 
    category: 'signal_logic',
    purpose: 'Confluência com níveis de Suporte e Resistência históricos do ativo.',
    onActive: 'Só entra se o sinal for validado por barreiras de preço onde grandes players atuam.',
    onInactive: 'O robô operará puramente pelo preço atual, ignorando a memória histórica do mercado.'
  },
  { 
    id: 'FIM-009', 
    name: 'Filtro de Spread', 
    type: 'OPTIONAL', 
    desc: 'Bloqueia custo alto.', 
    key: 'max_spread_points', 
    category: 'signal_logic', 
    isThreshold: true,
    purpose: 'Controle de custos operacionais da corretora.',
    onActive: 'Rejeita sinais se a taxa (spread) estiver muito alta, preservando sua margem líquida.',
    onInactive: 'Você pode ganhar o trade tecnicamente, mas perder dinheiro devido ao custo da corretora.'
  },
  { 
    id: 'FIM-010', 
    name: 'Ciclo de Proteção', 
    type: 'OPTIONAL', 
    desc: 'Trailing stop automático.', 
    key: 'fimathe_cycle_enabled', 
    category: 'risk_management',
    purpose: 'Gestão dinâmica de stop-loss por níveis de expansão (50/100).',
    onActive: 'Move para Zero a Zero e Trava Lucro automaticamente conforme o preço avança.',
    onInactive: 'Gestão passiva; o robô não protegerá o lucro sozinho, exigindo intervenção manual no MT5.'
  },
  { 
    id: 'FIM-011', 
    name: 'Reteste (Pullback)', 
    type: 'OPTIONAL', 
    desc: 'Exige retorno à borda.', 
    key: 'require_pullback_retest', 
    category: 'signal_logic',
    purpose: 'Entrada conservadora após a confirmação do rompimento.',
    onActive: 'Aguarda o preço "voltar" e tocar na borda antes de disparar a ordem oficial.',
    onInactive: 'Entrada agressiva no rompimento direto; prioriza execução sobre precisão de preço.'
  },
  { 
    id: 'FIM-012', 
    name: 'Limite de Risco (3%)', 
    type: 'MANDATORY', 
    desc: 'Trava de segurança financeira.', 
    category: 'risk_management',
    purpose: 'Preservação de capital baseada na "Regra de Ouro" da Fimathe.',
    onActive: 'Garante que nenhuma operação arrisque mais que 3% do seu saldo total da conta.',
    onInactive: 'Segurança nativa inegociável para garantir a sobrevivência da conta a longo prazo.'
  },
  { 
    id: 'FIM-013', 
    name: 'Gestão de Alvos', 
    type: 'MANDATORY', 
    desc: 'Cálculo dinâmico de TP.', 
    category: 'risk_management',
    purpose: 'Ajuste matemático da saída (Take Profit) pela volatilidade do canal.',
    onActive: 'Projeta alvos técnicos de 80%, 85% ou 100% conforme sua configuração de risco.',
    onInactive: 'Regra central para garantir relações de Risco:Retorno matematicamente positivas.'
  },
  { 
    id: 'FIM-014', 
    name: 'Auditoria de Estado', 
    type: 'MANDATORY', 
    desc: 'Rastreabilidade total.', 
    category: 'analysis',
    purpose: 'Elimina o "achismo" operacional através de logs detalhados.',
    onActive: 'Cada entrada ou bloqueio gera um Rule Trace, explicando exatamente POR QUE o robô agiu.',
    onInactive: 'Regra obrigatória para manutenção da transparência e auditoria de sinais.'
  },
  { 
    id: 'FIM-015', 
    name: 'Reversão Rigorosa', 
    type: 'OPTIONAL', 
    desc: 'Exige 2 níveis + Triângulo M1.', 
    key: 'strict_reversal_logic', 
    category: 'signal_logic',
    purpose: 'Evita a perigosa tentativa de "adivinhar" topos e fundos contra a tendência.',
    onActive: 'Exige queda brusca e consolidação antes de permitir venda em tendência de alta.',
    onInactive: 'Permite operações contra a tendência principal, elevando o risco de stop por continuidade.'
  },
  { 
    id: 'FIM-016', 
    name: 'Tendência Estrutural', 
    type: 'OPTIONAL', 
    desc: 'Valida Topos e Fundos (H1).', 
    key: 'require_structural_trend', 
    category: 'signal_logic',
    purpose: 'Confirmação de força macro através da anatomia do preço.',
    onActive: 'Só opera se a inclinação da média for sustentada por topos e fundos reais.',
    onInactive: 'Baseia-se apenas na média móvel simples, ignorando a estrutura de braços do mercado.'
  },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('strategy'); // 'strategy', 'risk', 'connection'
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [hoveredRuleId, setHoveredRuleId] = useState<string | null>(null);
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
                        <input 
                          type="text"
                          placeholder="DIGITE O ATIVO..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const target = e.target as HTMLInputElement;
                              const val = target.value.trim().toUpperCase();
                              if (val && !settings.analysis?.symbols?.includes(val)) {
                                const newList = [...(settings.analysis?.symbols || []), val];
                                updateNested('analysis', 'symbols', newList);
                                target.value = "";
                              }
                            }
                          }}
                          className="bg-transparent text-[10px] font-bold text-gray-400 placeholder:text-gray-600 focus:text-white focus:outline-none border-b border-transparent focus:border-primary/30 w-28 transition-all"
                        />
                        <div className="w-px h-4 bg-white/10 mx-1" />
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
                          <option value="">+ POPULARES</option>
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
                <div className="space-y-2">
                   <label className="text-[10px] text-gray-400 font-bold uppercase ml-2">Triângulo Fimathe (M1 Velas)</label>
                   <input 
                      type="number"
                      value={settings.signal_logic?.triangle_m1_candles || 10}
                      onChange={(e) => updateNested('signal_logic', 'triangle_m1_candles', parseInt(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-accent"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] text-gray-400 font-bold uppercase ml-2">Modo Take Profit (Nível)</label>
                   <select 
                      value={settings.signal_logic?.target_level_mode || '80'}
                      onChange={(e) => updateNested('signal_logic', 'target_level_mode', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-accent appearance-none"
                   >
                      {['50','80','85','100'].map(lvl => <option key={lvl} value={lvl}>{lvl}%</option>)}
                   </select>
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
                  <InfoIcon className="w-3 h-3 text-secondary animate-pulse" />
                  <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Passe o mouse no ícone para detalhes</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {FIMATHE_RULES.map((rule) => (
                  <div 
                    key={rule.id} 
                    className={`glass p-5 rounded-[32px] border transition-all duration-300 relative group ${
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
                    
                    {rule.type === 'MANDATORY' && (
                      <div className="absolute top-4 right-4 p-2">
                         <HelpCircle className="w-3 h-3 text-primary/30" />
                      </div>
                    )}

                    {/* New Premium Tooltip attached to the (i) icon */}
                    <div className="absolute top-10 right-4">
                      <div 
                        onMouseEnter={() => setHoveredRuleId(rule.id)}
                        onMouseLeave={() => setHoveredRuleId(null)}
                        className="p-2 cursor-help text-gray-600 hover:text-secondary hover:bg-white/5 rounded-full transition-all"
                      >
                        <InfoIcon className="w-3.5 h-3.5" />
                      </div>
                      
                      <RuleTooltip 
                        rule={rule as any} 
                        isActive={(rule.isThreshold ? (settings[rule.category!]?.[rule.key!] > 0) : settings[rule.category!]?.[rule.key!]) || rule.type === 'MANDATORY'}
                        isVisible={hoveredRuleId === rule.id}
                      />
                    </div>
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
