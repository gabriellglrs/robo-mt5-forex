"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
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
import { InfoTooltip } from '@/components/InfoTooltip';
import { motion } from 'framer-motion';

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
    onActive: 'Exige que o candle feche com o corpo fora da borda, ignorando pavios ignorosos.',
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

const TRADING_PROFILES: Record<string, { name: string, trend: string, entry: string, color: string }> = {
  manual: { name: 'Personalizado (Manual)', trend: '', entry: '', color: 'text-gray-400' },
  scalper: { name: 'Scalper (M15/M1)', trend: 'M15', entry: 'M1', color: 'text-primary' },
  day_trader: { name: 'Day Trader (H1/M15)', trend: 'H1', entry: 'M15', color: 'text-green-400' },
  position_trader: { name: 'Position Trader (H4/H1)', trend: 'H4', entry: 'H1', color: 'text-yellow-400' },
  swing_trader: { name: 'Swing Trader (D1/H4)', trend: 'D1', entry: 'H4', color: 'text-purple-400' },
};

const CHANNEL_PRESETS: Record<string, { label: string; ab: number; trend: number }> = {
  micro: { label: 'Micro', ab: 7, trend: 40 },
  intraday: { label: 'Intraday', ab: 40, trend: 120 },
  trend: { label: 'Trend', ab: 150, trend: 200 },
  macro: { label: 'Macro', ab: 200, trend: 300 },
};

const FACTORY_STRATEGY_SETTINGS = {
  running_state: true,
  analysis: {
    symbols: ["BTCUSD", "ETHUSD"],
    history_years: 2,
    wick_sensitivity: 0.3,
    trend_candles: 120,
    ab_lookback_candles: 40,
  },
  signal_logic: {
    trend_timeframe: "H1",
    entry_timeframe: "M15",
    breakout_buffer_points: 10,
    pullback_tolerance_points: 20,
    trend_min_slope_points: 0.2,
    sr_tolerance_points: 35,
    require_grouping: true,
    require_channel_break: true,
    require_sr_touch: true,
    max_spread_points: 30,
    require_pullback_retest: true,
    strict_reversal_logic: true,
    require_structural_trend: true,
    triangle_m1_candles: 5,
    target_level_mode: "80",
    trading_type: "day_trader",
    max_slippage_points: 30,
    fimathe_cycle_top_level: "80",
  },
  risk_management: {
    risk_percent: 1.0,
    max_open_positions: 1,
    magic_number: 202404,
    symbol_cooldown_seconds: 300,
    use_breakeven: true,
    breakeven_trigger_points: 120,
    breakeven_offset_points: 5,
    fimathe_cycle_enabled: true,
    fimathe_management_mode: "standard",
    fimathe_be_trigger_percent: 50,
    fimathe_cycle_breakeven_offset_points: 10,
    fimathe_trail_step_percent: 100,
  },
  ui_settings: {
    analysis_flow_interval_seconds: 5,
    theme: "dark",
    log_cleanup_minutes: 15,
  },
  log_management: {
    mode: "quantity",
    value: 50,
  },
  notifications: {
    enabled: true,
    min_priority: "P2",
    categories: {
      execution: true,
      risk: true,
      health: true,
      setup: false,
    },
    telegram: {
      bot_token: "",
      chat_id: "",
      timeout_seconds: 2.5,
      retries: 2,
    },
  },
};

const SETTINGS_HELP = {
  // Analysis
  history_years: { title: "Lookback Histórico", content: "Define quantos anos de dados o robô analisa. Mais dados ajudam a identificar suportes históricos, mas aumentam o processamento." },
  wick_sensitivity: { title: "Sensibilidade ao Pavio", content: "Controla quão rigoroso o robô é ao considerar pontas de pavios fora do canal principal na marcação técnica." },
  trend_candles: { title: "Velas de Tendência", content: "Quantidade de velas recentes observadas para definir a direção principal e inclinação dos canais Fimathe." },
  
  // Signal Logic
  trading_type: { title: "Perfil de Operação", content: "Presets otimizados da Fimathe. Configura automaticamente os tempos gráficos ideais para cada estilo operacional." },
  trend_timeframe: { title: "Timeframe Tendência", content: "O gráfico de tempo maior usado para a 'Tendência de Referência'. É a direção primária que o robô segue." },
  entry_timeframe: { title: "Timeframe Entrada", content: "Gráfico menor usado para achar o gatilho. Onde os rompimentos e agrupamentos são validados antes da ordem." },
  breakout_buffer: { title: "Breakout Buffer", content: "Filtro de segurança (em pontos). O preço deve romper a linha por esta distância para evitar sinais falsos (violinos)." },
  pullback_tolerance: { title: "Pullback Tolerance", content: "Distância máxima em pontos para validar o reteste da borda após rompimento. Muito baixo pode bloquear entradas." },
  slope_min: { title: "Inclinação Mínima", content: "Impede o robô de operar em mercados laterais ou com tendências fracas demais para serem confiáveis." },
  sr_tolerance: { title: "Tolerância S/R", content: "Margem de erro (em pontos) para validar o toque em níveis históricos de Suporte e Resistência." },
  require_grouping: { title: "Exigir Agrupamento", content: "Obrigatório na Fimathe Purista: o preço deve consolidar antes de romper o canal para validar a entrada." },
  target_level: { title: "Modo Take Profit", content: "Seu alvo de lucro. 80-85% são alvos conservadores (pré-briga); 100% busca a expansão técnica completa." },
  max_spread: { title: "Spread Máximo", content: "Filtro de custo. Bloqueia entradas se a corretora estiver cobrando uma taxa (spread) maior que o definido aqui." },

  // Risk
  risk_percent: { title: "Risco por Operação", content: "Quanto do seu saldo você aceita arriscar nesta configuração. O robô calcula o tamanho da entrada automaticamente para te proteger." },
  max_positions: { title: "Limite de Operações", content: "Máximo de apostas abertas ao mesmo tempo. Ajuda a não colocar todos os ovos na mesma cesta." },
  magic_number: { title: "Identificador (ID)", content: "Número de registro das ordens. Permite que você saiba quais trades foram do robô e quais foram seus." },
  cooldown: { title: "Tempo de Pausa", content: "Intervalo obrigatório entre uma operação e outra para evitar que o robô opere demais em momentos ruins." },
  fimathe_cycle: { title: "Proteção Automática", content: "Define como o robô protege seu dinheiro. Ele trava o lucro à medida que o preço caminha a seu favor para você não devolver o ganho." },
  be_automativo: { title: "Break-even Automático", content: "Ao atingir o 1º nível de expansão, o robô move seu Stop para o preço de entrada (0x0). Risco zero garantido." },
  be_offset: { title: "Gordurinha de Lucro", content: "Define quantos pontos acima da entrada o robô deve travar o lucro. Ideal para cobrir custos de comissão e sair sempre no positivo." },
  
  // Management Modes
  mode_standard: { title: "Modo Padrão", content: "O clássico Fimathe: move para o 0x0 no primeiro nível e trava 50% de lucro quando atinge o alvo cheio." },
  mode_conservative: { title: "Modo Conservador", content: "Foco total em segurança. Trava no 0x0 o mais rápido possível e não aceita devolver lucro." },
  mode_infinity: { title: "Modo Infinity", content: "O perseguidor de tendências. O Stop segue o preço nível a nível, buscando capturar movimentos explosivos sem limite de ganho." },
  
  // Connection
  server: { title: "Servidor Corretora", content: "O endereço digital da sua corretora (ex: XP-Investimentos). Necessário para o robô saber onde operar." },
  login: { title: "ID da Conta", content: "Seu número de usuário no MetaTrader 5." },
  
  // Misc
  triangle_m1: { title: "Triângulo de Segurança", content: "O robô espera o preço 'descansar' um pouco antes de entrar, para confirmar que o movimento de rompimento é real." },
  management_mode: { 
    title: "Modo de Proteção (FIM-017/018)", 
    content: "Escolha como o lucro será travado: Padrão (trava metade), Conservador (só protege o que já ganhou) ou Infinity (persegue o preço sem limite)." 
  },
  be_trigger: { 
    title: "Gatilho de Break-even (%)", 
    content: "Define a porcentagem do primeiro canal que o preço deve atingir para o robô mover o Stop para o preço de entrada (0x0). Recomendado: 50%." 
  },
  trail_step: { 
    title: "Passo do Infinity (%)", 
    content: "No modo Infinity, define a cada quantos % do canal o Stop deve avançar. Ex: 100% significa que o SL segue 1 nível atrás do preço atual." 
  },
};

type GuardrailIssue = {
  key: string;
  message: string;
  fields: string[];
  rules?: string[];
};

function getGuardrailIssues(settings: any): GuardrailIssue[] {
  if (!settings) return [];
  const signal = settings.signal_logic || {};
  const analysis = settings.analysis || {};

  const requireGrouping = !!signal.require_grouping;
  const requirePullback = !!signal.require_pullback_retest;
  const requireSrTouch = !!signal.require_sr_touch;
  const strictReversal = !!signal.strict_reversal_logic;
  const requireStructural = !!signal.require_structural_trend;
  const requireBreakout = !!signal.require_channel_break;
  const trendTf = String(signal.trend_timeframe || 'H1').toUpperCase();
  const entryTf = String(signal.entry_timeframe || 'M15').toUpperCase();
  const breakoutBuffer = Number(signal.breakout_buffer_points ?? 10);
  const pullbackTolerance = Number(signal.pullback_tolerance_points ?? 20);
  const srTolerance = Number(signal.sr_tolerance_points ?? 35);
  const maxSpread = Number(signal.max_spread_points ?? 30);
  const slopeMin = Number(signal.trend_min_slope_points ?? 0.2);

  const rawSymbols = analysis.symbols || [];
  const symbols = Array.isArray(rawSymbols)
    ? rawSymbols.map((v: any) => String(v).toUpperCase())
    : String(rawSymbols).split(',').map((v) => v.trim().toUpperCase()).filter(Boolean);
  const hasCrypto = symbols.some((sym) => (sym.startsWith('BTC') || sym.startsWith('ETH')) && sym.endsWith('USD'));

  const issues: GuardrailIssue[] = [];

  if (
    trendTf === 'M15' &&
    entryTf === 'M1' &&
    requireGrouping &&
    requirePullback &&
    requireSrTouch &&
    strictReversal &&
    requireStructural
  ) {
    issues.push({
      key: 'ultra_restrictive_scalper',
      message: 'Scalper M15/M1 com FIM-006/008/011/015/016 todos ativos tende a bloquear quase todos os sinais.',
      fields: [
        'trend_timeframe',
        'entry_timeframe',
        'require_grouping',
        'require_pullback_retest',
        'require_sr_touch',
        'strict_reversal_logic',
        'require_structural_trend',
      ],
      rules: [
        'require_grouping',
        'require_pullback_retest',
        'require_sr_touch',
        'strict_reversal_logic',
        'require_structural_trend',
      ],
    });
  }

  if (pullbackTolerance < breakoutBuffer) {
    issues.push({
      key: 'pullback_vs_breakout',
      message: 'Pullback tolerance menor que breakout buffer pode invalidar retestes válidos.',
      fields: ['pullback_tolerance_points', 'breakout_buffer_points'],
    });
  }

  if (requireSrTouch && srTolerance < 10) {
    issues.push({
      key: 'sr_too_tight',
      message: 'FIM-008 ativo com tolerância S/R abaixo de 10 pontos costuma bloquear entradas.',
      fields: ['require_sr_touch', 'sr_tolerance_points'],
      rules: ['require_sr_touch'],
    });
  }

  if (requireBreakout && breakoutBuffer > srTolerance) {
    issues.push({
      key: 'breakout_sr_conflict',
      message: 'Breakout buffer maior que tolerância S/R cria conflito de gatilho entre FIM-007 e FIM-008.',
      fields: ['require_channel_break', 'breakout_buffer_points', 'sr_tolerance_points'],
      rules: ['require_channel_break', 'require_sr_touch'],
    });
  }

  if (strictReversal && requireStructural && slopeMin > 1.5) {
    issues.push({
      key: 'slope_overfilter',
      message: 'Inclinação mínima muito alta com FIM-015/FIM-016 ativos superfiltra o mercado.',
      fields: ['strict_reversal_logic', 'require_structural_trend', 'trend_min_slope_points'],
      rules: ['strict_reversal_logic', 'require_structural_trend'],
    });
  }

  if (hasCrypto && maxSpread < 20) {
    issues.push({
      key: 'crypto_spread_low',
      message: 'Para BTC/ETH, spread máximo abaixo de 20 costuma bloquear operações por custo.',
      fields: ['symbols', 'max_spread_points'],
      rules: ['max_spread_points'],
    });
  }

  return issues;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('strategy'); // 'strategy', 'risk', 'connection'
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [hoveredRuleId, setHoveredRuleId] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);
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

  const saveSettingsAndRestart = async (targetSettings: any, successMessage: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const guardrailIssues = getGuardrailIssues(targetSettings);
    if (guardrailIssues.length > 0) {
      setNotification({
        message: `CONFIGURAÇÃO BLOQUEADA: ${guardrailIssues[0].message}`,
        type: 'error',
      });
      return;
    }

    setSaving(true);
    setNotification({ message: '💾 SALVANDO CONFIGURAÇÕES...', type: 'success' });
    
    try {
      // 1. Salva as configurações
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/settings`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ settings: targetSettings }),
      });
      
      const savePayload = await res.json().catch(() => ({}));
      if (!res.ok) {
        const apiErrors = Array.isArray(savePayload?.detail?.errors) ? savePayload.detail.errors.join(' | ') : '';
        const apiMessage = savePayload?.detail?.message || savePayload?.detail || 'Falha ao salvar';
        throw new Error(`${apiMessage}${apiErrors ? `: ${apiErrors}` : ''}`);
      }
      if (savePayload?.settings) {
        setSettings(savePayload.settings);
      }

      // 2. Comanda a Parada do Robô
      setNotification({ message: '🛑 REINICIANDO MOTOR: Parando processo atual...', type: 'success' });
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/stop`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // 3. Delay curto com contagem regressiva visual (2, 1, 0)
      for (let secondsLeft = 2; secondsLeft >= 0; secondsLeft -= 1) {
        setNotification({ message: `⏳ SINCRONIZANDO: ${secondsLeft}...`, type: 'success' });
        if (secondsLeft > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // 4. Comanda o Início do Robô
      setNotification({ message: '🚀 MOTORIZANDO: Ligando com novos presets...', type: 'success' });
      const startRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/start`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (startRes.ok) {
        setNotification({ message: successMessage, type: 'success' });
      } else {
        setNotification({ message: '⚠️ AVISO: Configurações salvas, mas o robô não iniciou sozinho.', type: 'error' });
      }

    } catch (e: any) {
      setNotification({ message: `ERRO CRITICO: ${e?.message || 'Nao foi possivel completar a sincronizacao.'}`, type: 'error' });
    } finally {
      setSaving(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleSave = async () => {
    await saveSettingsAndRestart(settings, '✅ SINCRO CONCLUÍDA: Robô operando com novos parâmetros.');
  };

  const handleFactoryReset = async () => {
    if (!settings) return;
    const confirmed = window.confirm(
      'Restaurar padrão de fábrica Fimathe? Isso vai sobrescrever estratégia, risco, filtros e presets para o padrão oficial.'
    );
    if (!confirmed) return;

    const factorySettings = {
      ...FACTORY_STRATEGY_SETTINGS,
      mt5_connection: settings.mt5_connection || {},
    };
    await saveSettingsAndRestart(
      factorySettings,
      '✅ PADRÃO DE FÁBRICA APLICADO: Estratégia Fimathe oficial restaurada.'
    );
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

  const applyTradingProfile = (profileKey: string) => {
    const profile = TRADING_PROFILES[profileKey];
    if (!profile) return;

    setSettings((prev: any) => {
      const newSignalLogic = { ...prev.signal_logic, trading_type: profileKey };
      if (profileKey !== 'manual') {
        newSignalLogic.trend_timeframe = profile.trend;
        newSignalLogic.entry_timeframe = profile.entry;
      }
      return {
        ...prev,
        signal_logic: newSignalLogic
      };
    });
  };

  const applyManagementStrategy = (mode: string) => {
    setSettings((prev: any) => {
      const risk = { 
        ...prev.risk_management, 
        fimathe_management_mode: mode, 
        fimathe_cycle_enabled: true 
      };

      const signal = {
        ...prev.signal_logic
      };
      
      // Presets recomendados baseado no modo
      if (mode === 'standard') {
        risk.fimathe_be_trigger_percent = 50;
        signal.fimathe_cycle_top_level = '80';
        signal.target_level_mode = '80';
      } else if (mode === 'conservative') {
        risk.fimathe_be_trigger_percent = 50;
        signal.fimathe_cycle_top_level = '80';
        signal.target_level_mode = '80';
      } else if (mode === 'infinity') {
        risk.fimathe_be_trigger_percent = 50;
        risk.fimathe_trail_step_percent = 100;
        signal.fimathe_cycle_top_level = '100';
        signal.target_level_mode = '100';
      }
      
      return { ...prev, risk_management: risk, signal_logic: signal };
    });
    
    setNotification({ 
      message: `ESTRATÉGIA ATUALIZADA: Modo ${mode.toUpperCase()} configurado com presets oficiais.`, 
      type: 'success' 
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const applyChannelPreset = (presetKey: string) => {
    const preset = CHANNEL_PRESETS[presetKey];
    if (!preset) return;

    setSettings((prev: any) => ({
      ...prev,
      analysis: {
        ...prev.analysis,
        ab_lookback_candles: preset.ab,
        trend_candles: preset.trend,
      }
    }));
  };

  const handleResetData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setResetting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/maintenance/reset-data`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        setNotification({ message: 'RESET CONCLUÍDO: Todos os dados de histórico foram apagados.', type: 'success' });
        setShowResetModal(false);
        // Pequeno delay para usuário ler o toast antes de recarregar
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setNotification({ message: 'ERRO NO RESET: Não foi possível limpar os dados.', type: 'error' });
      }
    } catch (e: any) {
      setNotification({ message: `ERRO CRITICO: ${e?.message || 'Nao foi possivel completar a sincronizacao.'}`, type: 'error' });
    }
    setResetting(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center p-20">
      <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );
  
  if (!settings) return <div className="p-8 text-white">Erro ao carregar configurações.</div>;
  const guardrailIssues = getGuardrailIssues(settings);
  const hasGuardrailConflict = guardrailIssues.length > 0;
  const conflictedFields = new Set(guardrailIssues.flatMap((issue) => issue.fields || []));
  const conflictedRules = new Set(guardrailIssues.flatMap((issue) => issue.rules || []));
  const isFieldConflicted = (...keys: string[]) => keys.some((k) => conflictedFields.has(k));
  const isRuleConflicted = (ruleKey?: string) => !!ruleKey && conflictedRules.has(ruleKey);

  return (
    <div className={`relative space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 ${hasGuardrailConflict ? 'critical-screen-active' : ''}`}>
      {hasGuardrailConflict && (
        <div className="fixed inset-0 pointer-events-none z-[40] overflow-hidden">
          <div className="absolute inset-0 critical-red-pulse-bg" />
          <div className="absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full bg-red-500/30 blur-[130px] critical-red-orb-1" />
          <div className="absolute -bottom-32 -right-24 w-[380px] h-[380px] rounded-full bg-red-600/30 blur-[130px] critical-red-orb-2" />
        </div>
      )}
      <style jsx global>{`
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
        .premium-input:focus {
           box-shadow: 0 0 15px rgba(0, 212, 255, 0.15);
           border-color: rgba(0, 212, 255, 0.4);
        }
        .critical-red-pulse-bg {
          background: radial-gradient(circle at 25% 20%, rgba(239, 68, 68, 0.20), transparent 45%),
                      radial-gradient(circle at 80% 78%, rgba(220, 38, 38, 0.22), transparent 48%);
          animation: criticalRedBgPulse 1.2s ease-in-out infinite alternate;
        }
        .critical-red-orb-1 { animation: criticalOrbDriftA 2.2s ease-in-out infinite; }
        .critical-red-orb-2 { animation: criticalOrbDriftB 2.6s ease-in-out infinite; }
        .critical-guardrail-card {
          box-shadow: 0 0 45px rgba(239, 68, 68, 0.28), inset 0 0 32px rgba(239, 68, 68, 0.12);
          animation: criticalCardPulse 1s ease-in-out infinite alternate;
        }
        .critical-field-wrap {
          border-color: rgba(239, 68, 68, 0.75) !important;
          background: rgba(127, 29, 29, 0.24) !important;
          box-shadow: 0 0 0 1px rgba(248, 113, 113, 0.45), 0 0 30px rgba(239, 68, 68, 0.25);
          animation: criticalCardPulse 0.75s ease-in-out infinite alternate;
        }
        .critical-input-conflict {
          border-color: rgba(239, 68, 68, 0.95) !important;
          background: rgba(127, 29, 29, 0.42) !important;
          box-shadow: 0 0 0 1px rgba(248, 113, 113, 0.55), 0 0 24px rgba(239, 68, 68, 0.36);
          animation: criticalFieldPulse 0.55s ease-in-out infinite alternate;
        }
        .critical-label-conflict {
          color: rgb(254 202 202) !important;
          text-shadow: 0 0 10px rgba(239, 68, 68, 0.45);
        }
        @keyframes criticalRedBgPulse {
          0% { opacity: 0.45; filter: saturate(100%); }
          100% { opacity: 0.92; filter: saturate(150%); }
        }
        @keyframes criticalCardPulse {
          0% { transform: scale(1); border-color: rgba(248, 113, 113, 0.45); }
          100% { transform: scale(1.004); border-color: rgba(239, 68, 68, 0.95); }
        }
        @keyframes criticalOrbDriftA {
          0% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.45; }
          100% { transform: translate3d(18px, -12px, 0) scale(1.08); opacity: 0.8; }
        }
        @keyframes criticalOrbDriftB {
          0% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.4; }
          100% { transform: translate3d(-16px, 10px, 0) scale(1.1); opacity: 0.78; }
        }
        @keyframes criticalFieldPulse {
          0% { transform: scale(1); filter: brightness(1); }
          100% { transform: scale(1.01); filter: brightness(1.25); }
        }
      `}</style>
      
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
          <Link
            href="/estrategia"
            className="glass px-6 py-2.5 rounded-2xl text-[10px] font-bold text-primary hover:text-white transition-all flex items-center gap-2"
          >
            <Info className="w-4 h-4" /> COMO VAI OPERAR
          </Link>
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
            onClick={handleFactoryReset}
            disabled={saving}
            className="glass px-6 py-2.5 rounded-2xl text-[10px] font-bold text-amber-300 hover:text-amber-200 transition-all flex items-center gap-2 disabled:opacity-60"
          >
            <ShieldAlert className="w-4 h-4" /> PADRÃO FÁBRICA
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

      <section className={`glass relative z-[61] p-6 rounded-[32px] border ${guardrailIssues.length > 0 ? 'critical-guardrail-card border-red-500/40 bg-red-950/35' : 'border-primary/20 bg-primary/5'}`}>
        <div className="flex items-center gap-3 mb-3">
          <ShieldAlert className={`w-5 h-5 ${guardrailIssues.length > 0 ? 'text-red-300 animate-pulse' : 'text-primary'}`} />
          <h2 className="text-sm font-black tracking-widest uppercase text-white">Guardrails de Configuração</h2>
        </div>
        {guardrailIssues.length > 0 ? (
          <div className="space-y-2">
            {guardrailIssues.map((issue) => (
              <p key={issue.key} className="text-xs text-red-200 leading-relaxed font-semibold">• {issue.message}</p>
            ))}
            <p className="text-[10px] text-red-100 uppercase tracking-[0.16em] font-black mt-2">ALERTA CRÍTICO: AJUSTE OS CAMPOS PARA LIBERAR O SALVAR.</p>
          </div>
        ) : (
          <p className="text-xs text-primary/90 leading-relaxed">Configuração coerente. Nenhum conflito crítico detectado.</p>
        )}
      </section>

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

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass max-w-md w-full p-10 rounded-[48px] border border-red-500/20 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-500/10 blur-[100px] rounded-full" />
            
            <div className="flex flex-col items-center text-center space-y-6 relative z-10">
              <div className="p-5 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-500">
                <Trash2 className="w-10 h-10 animate-bounce" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic">Atenção Crítica!</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Você está prestes a <span className="text-red-400 font-bold uppercase">apagar permanentemente</span> todo o histórico de trades e eventos do monitor. Esta ação não pode ser desfeita.
                </p>
              </div>

              <div className="flex flex-col w-full gap-3 pt-4">
                <button 
                  onClick={handleResetData}
                  disabled={resetting}
                  className="w-full py-4 bg-red-500 text-black text-xs font-black rounded-2xl hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                >
                  {resetting ? <Activity className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {resetting ? 'LIMPANDO...' : 'SIM, APAGAR TUDO AGORA'}
                </button>
                <button 
                  onClick={() => setShowResetModal(false)}
                  disabled={resetting}
                  className="w-full py-4 bg-white/5 text-gray-400 text-xs font-bold rounded-2xl hover:text-white transition-all"
                >
                  CANCELAR E VOLTAR
                </button>
              </div>
            </div>
          </motion.div>
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
                    
                    <div className={`flex flex-wrap gap-2 p-4 bg-white/[0.02] border border-white/5 rounded-[32px] ${isFieldConflicted('symbols') ? 'critical-field-wrap' : ''}`}>
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
                 
                 <div className="space-y-3">
                   <label className="text-[10px] font-bold text-gray-500 uppercase ml-2 tracking-widest">Presets de Janela (Canal + Tendencia)</label>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                     {Object.entries(CHANNEL_PRESETS).map(([key, preset]) => (
                       <button
                         key={key}
                         onClick={() => applyChannelPreset(key)}
                         className="py-2 rounded-xl text-[10px] font-black bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                       >
                         {preset.label} ({preset.ab}/{preset.trend})
                       </button>
                     ))}
                   </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-gray-500 uppercase ml-2 tracking-widest flex items-center">
                        Largura do Canal (Velas)
                        <InfoTooltip title="Lookback do Canal Fimathe" content="Define a quantidade de velas no Timeframe de Tendência para pescar a Máxima (A) e Mínima (B). Diminua para canais mais justos." />
                      </label>
                       <input 
                          type="number"
                          min={7}
                          max={300}
                          value={settings.analysis?.ab_lookback_candles || 80}
                          onChange={(e) => updateNested('analysis', 'ab_lookback_candles', parseInt(e.target.value || '80', 10))}
                          title="Faixa permitida: 5 a 300"
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-secondary transition-all"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-gray-500 uppercase ml-2 tracking-widest flex items-center">
                        Confirmação de Tendência (Velas)
                        <InfoTooltip title={SETTINGS_HELP.trend_candles.title} content={SETTINGS_HELP.trend_candles.content} />
                      </label>
                       <input 
                          type="number"
                          min={5}
                          max={300}
                          value={settings.analysis?.trend_candles || 200}
                          onChange={(e) => updateNested('analysis', 'trend_candles', parseInt(e.target.value || '200', 10))}
                          title="Faixa permitida: 5 a 300"
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-secondary transition-all"
                       />
                    </div>
                    <div className={`space-y-2 ${isFieldConflicted('trend_min_slope_points') ? 'critical-field-wrap p-3 rounded-2xl' : ''}`}>
                       <label className={`text-[10px] font-bold text-gray-500 uppercase ml-2 tracking-widest flex items-center ${isFieldConflicted('trend_min_slope_points') ? 'critical-label-conflict' : ''}`}>
                         Slope Mínimo (Pontos)
                         <InfoTooltip title={SETTINGS_HELP.slope_min.title} content={SETTINGS_HELP.slope_min.content} />
                       </label>
                       <input 
                          type="number" step="0.01"
                          value={settings.signal_logic?.trend_min_slope_points || 0.20}
                          onChange={(e) => updateNested('signal_logic', 'trend_min_slope_points', parseFloat(e.target.value))}
                          className={`w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-secondary transition-all ${isFieldConflicted('trend_min_slope_points') ? 'critical-input-conflict' : ''}`}
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

              <div className="space-y-6">
                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[32px] space-y-4">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Target className="w-3 h-3 text-primary" /> Perfil de Operação (Fimathe)
                    <InfoTooltip title={SETTINGS_HELP.trading_type.title} content={SETTINGS_HELP.trading_type.content} />
                  </label>
                  <select 
                    value={settings.signal_logic?.trading_type || 'manual'}
                    onChange={(e) => applyTradingProfile(e.target.value)}
                    className={`w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-primary appearance-none ${
                        TRADING_PROFILES[settings.signal_logic?.trading_type || 'manual']?.color
                    }`}
                  >
                    {Object.entries(TRADING_PROFILES).map(([key, p]) => (
                      <option key={key} value={key} className="bg-slate-900 text-white">{p.name}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-gray-500 italic px-2">
                    {settings.signal_logic?.trading_type === 'manual' 
                      ? '* Modo manual ativo: você tem liberdade total para definir os tempos.' 
                      : `* Perfil ${TRADING_PROFILES[settings.signal_logic?.trading_type]?.name} selecionado: tempos gráficos otimizados automaticamente.`}
                  </p>
                </div>

                  <div className="grid grid-cols-2 gap-6">
                  <div className={`space-y-2 ${isFieldConflicted('trend_timeframe') ? 'critical-field-wrap p-3 rounded-2xl' : ''}`}>
                    <label className={`text-[10px] text-gray-400 font-bold uppercase ml-2 flex items-center ${isFieldConflicted('trend_timeframe') ? 'critical-label-conflict' : ''}`}>
                        Timeframe Tendência
                        <InfoTooltip title={SETTINGS_HELP.trend_timeframe.title} content={SETTINGS_HELP.trend_timeframe.content} />
                    </label>
                    <select 
                        value={settings.signal_logic?.trend_timeframe || 'H1'}
                        onChange={(e) => updateNested('signal_logic', 'trend_timeframe', e.target.value)}
                        className={`w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-accent appearance-none ${isFieldConflicted('trend_timeframe') ? 'critical-input-conflict' : ''}`}
                    >
                        {['W1', 'D1', 'H4','H1','M30','M15'].map(tf => <option key={tf} value={tf}>{tf}</option>)}
                    </select>
                  </div>
                  <div className={`space-y-2 ${isFieldConflicted('entry_timeframe') ? 'critical-field-wrap p-3 rounded-2xl' : ''}`}>
                    <label className={`text-[10px] text-gray-400 font-bold uppercase ml-2 flex items-center ${isFieldConflicted('entry_timeframe') ? 'critical-label-conflict' : ''}`}>
                        Timeframe Entrada
                        <InfoTooltip title={SETTINGS_HELP.entry_timeframe.title} content={SETTINGS_HELP.entry_timeframe.content} />
                    </label>
                    <select 
                        value={settings.signal_logic?.entry_timeframe || 'M15'}
                        onChange={(e) => updateNested('signal_logic', 'entry_timeframe', e.target.value)}
                        className={`w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-accent appearance-none ${isFieldConflicted('entry_timeframe') ? 'critical-input-conflict' : ''}`}
                    >
                        {['M30','M15','M5','M1'].map(tf => <option key={tf} value={tf}>{tf}</option>)}
                    </select>
                  </div>
                  <div className={`space-y-2 ${isFieldConflicted('breakout_buffer_points') ? 'critical-field-wrap p-3 rounded-2xl' : ''}`}>
                    <label className={`text-[10px] text-gray-400 font-bold uppercase ml-2 flex items-center ${isFieldConflicted('breakout_buffer_points') ? 'critical-label-conflict' : ''}`}>
                      Breakout Buffer (Pts)
                      <InfoTooltip title={SETTINGS_HELP.breakout_buffer.title} content={SETTINGS_HELP.breakout_buffer.content} />
                    </label>
                    <input 
                        type="number"
                        value={settings.signal_logic?.breakout_buffer_points || 10}
                        onChange={(e) => updateNested('signal_logic', 'breakout_buffer_points', parseInt(e.target.value))}
                        className={`w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-accent ${isFieldConflicted('breakout_buffer_points') ? 'critical-input-conflict' : ''}`}
                    />
                  </div>
                  <div className={`space-y-2 ${isFieldConflicted('pullback_tolerance_points') ? 'critical-field-wrap p-3 rounded-2xl' : ''}`}>
                    <label className={`text-[10px] text-gray-400 font-bold uppercase ml-2 flex items-center ${isFieldConflicted('pullback_tolerance_points') ? 'critical-label-conflict' : ''}`}>
                      Pullback Tolerance (Pts)
                      <InfoTooltip title={SETTINGS_HELP.pullback_tolerance.title} content={SETTINGS_HELP.pullback_tolerance.content} />
                    </label>
                    <input 
                        type="number"
                        value={settings.signal_logic?.pullback_tolerance_points || 20}
                        onChange={(e) => updateNested('signal_logic', 'pullback_tolerance_points', parseInt(e.target.value))}
                        className={`w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-accent ${isFieldConflicted('pullback_tolerance_points') ? 'critical-input-conflict' : ''}`}
                    />
                  </div>
                  <div className={`space-y-2 ${isFieldConflicted('sr_tolerance_points') ? 'critical-field-wrap p-3 rounded-2xl' : ''}`}>
                    <label className={`text-[10px] text-gray-400 font-bold uppercase ml-2 flex items-center ${isFieldConflicted('sr_tolerance_points') ? 'critical-label-conflict' : ''}`}>
                      S/R Tolerance (Pts)
                      <InfoTooltip title={SETTINGS_HELP.sr_tolerance.title} content={SETTINGS_HELP.sr_tolerance.content} />
                    </label>
                    <input 
                        type="number"
                        value={settings.signal_logic?.sr_tolerance_points || 35}
                        onChange={(e) => updateNested('signal_logic', 'sr_tolerance_points', parseInt(e.target.value))}
                        className={`w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-accent ${isFieldConflicted('sr_tolerance_points') ? 'critical-input-conflict' : ''}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-gray-400 font-bold uppercase ml-2 flex items-center">
                      Triângulo Fimathe (M1 Velas)
                      <InfoTooltip title={SETTINGS_HELP.triangle_m1.title} content={SETTINGS_HELP.triangle_m1.content} />
                    </label>
                    <input 
                        type="number"
                        value={settings.signal_logic?.triangle_m1_candles || 10}
                        onChange={(e) => updateNested('signal_logic', 'triangle_m1_candles', parseInt(e.target.value))}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-accent"
                    />
                  </div>
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
                    } ${
                      isRuleConflicted(rule.key) ? 'critical-field-wrap' : ''
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
                            } ${isRuleConflicted(rule.key) ? 'critical-input-conflict' : ''}`}
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
                <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  Gestão de Exposição e Risco
                  <InfoTooltip title="Escudo da Conta" content="Define quanto do seu dinheiro o robô pode usar e como ele protege seus ganhos. É o coração da segurança da sua operação." />
                </h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Proteção do capital e limites</p>
              </div>
            </div>

            {/* SELETOR RÁPIDO DE ESTRATÉGIA */}
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-gray-500 uppercase ml-2 tracking-[0.2em] flex items-center gap-2">
                 Seleção Rápida de Estratégia
                 <span className="text-[8px] bg-white/5 px-2 py-0.5 rounded text-gray-600 font-black">PRESETS OFICIAIS</span>
              </label>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: 'standard', name: 'Padrão (FIM-010)', desc: 'BE aos 50%', icon: ShieldCheck, help: SETTINGS_HELP.mode_standard },
                  { id: 'conservative', name: 'Conservador', desc: 'FIM-017 (B.E Fixo)', icon: Shield, help: SETTINGS_HELP.mode_conservative },
                  { id: 'infinity', name: 'Infinity', desc: 'FIM-018 (Arraste)', icon: Zap, help: SETTINGS_HELP.mode_infinity }
                ].map((mode) => (
                  <motion.button
                    key={mode.id}
                    onClick={() => applyManagementStrategy(mode.id)}
                    whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(0,212,255,0.1)' }}
                    whileTap={{ scale: 0.98 }}
                    className={`glass p-6 rounded-[32px] border transition-all text-left group relative ${
                      settings.risk_management?.fimathe_management_mode === mode.id
                        ? 'border-primary shadow-[0_0_20px_rgba(34,211,238,0.15)] bg-primary/[0.03]'
                        : 'border-white/5 hover:border-primary/20 hover:bg-white/[0.02]'
                    }`}
                  >
                    {/* Contêiner para Brilho Animado (Overflow isolado para permitir tooltips externos) */}
                    <div className="absolute inset-0 overflow-hidden rounded-[32px] pointer-events-none">
                      {settings.risk_management?.fimathe_management_mode === mode.id && (
                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/15 blur-3xl rounded-full animate-pulse" />
                      )}
                    </div>

                    <div className="absolute top-4 right-4 z-50">
                       <InfoTooltip title={mode.help.title} content={mode.help.content} direction="down" />
                    </div>
                    
                    <div className={`p-3 rounded-2xl w-fit mb-4 transition-all ${
                      settings.risk_management?.fimathe_management_mode === mode.id 
                        ? 'bg-primary shadow-[0_0_15px_rgba(34,211,238,0.4)] text-black' 
                        : 'bg-white/5 text-gray-500'
                    }`}>
                      <mode.icon className="w-5 h-5" />
                    </div>
                    
                    <h4 className={`text-xs font-black uppercase tracking-tighter mb-1 ${
                      settings.risk_management?.fimathe_management_mode === mode.id ? 'text-white' : 'text-gray-400 font-bold'
                    }`}>
                      {mode.name}
                    </h4>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-none">
                      {mode.desc}
                    </p>
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-8">
                 <div className="space-y-3">
                    <div className="flex justify-between items-center group">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center">
                        Risco por Trade
                        <InfoTooltip title={SETTINGS_HELP.risk_percent.title} content={SETTINGS_HELP.risk_percent.content} />
                      </label>
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
                          <span className="text-sm font-bold text-white flex items-center">
                            Ciclo Fimathe Ativo
                            <InfoTooltip title={SETTINGS_HELP.fimathe_cycle.title} content={SETTINGS_HELP.fimathe_cycle.content} />
                          </span>
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                            Trava Atual: {settings.signal_logic?.fimathe_cycle_top_level || '80'}% do Ciclo
                          </span>
                       </div>
                       <input 
                        type="checkbox" 
                        checked={settings.risk_management?.fimathe_cycle_enabled || false} 
                        onChange={(e) => updateNested('risk_management', 'fimathe_cycle_enabled', e.target.checked)} 
                        className="w-10 h-10 accent-primary cursor-pointer" 
                      />
                    </div>

                    {settings.risk_management?.fimathe_cycle_enabled && (
                       <motion.div 
                         initial={{ opacity: 0, height: 0 }}
                         animate={{ opacity: 1, height: 'auto' }}
                         className="p-6 bg-primary/5 rounded-[40px] border border-primary/10 space-y-6 mt-4"
                       >
                          <div className="space-y-3">
                             <label className="text-[10px] font-bold text-primary uppercase ml-1 flex items-center gap-1.5 tracking-widest">
                               <Target className="w-3.5 h-3.5" />
                               Alvo de Travamento (%)
                               <InfoTooltip title={SETTINGS_HELP.target_level.title} content={SETTINGS_HELP.target_level.content} />
                             </label>
                             <div className="grid grid-cols-6 gap-2 bg-black/40 p-1.5 rounded-[24px] border border-white/5">
                               {['50', '80', '85', '90', '95', '100'].map((lvl) => (
                                 <button
                                   key={lvl}
                                   onClick={() => setSettings((prev: any) => ({
                                     ...prev,
                                     signal_logic: {
                                       ...prev.signal_logic,
                                       fimathe_cycle_top_level: lvl,
                                       target_level_mode: lvl,
                                     },
                                   }))}
                                   className={`py-2.5 rounded-2xl text-[10px] font-black transition-all duration-300 ${
                                     (settings.signal_logic?.fimathe_cycle_top_level || '80') === lvl
                                       ? 'bg-primary text-black shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                                       : 'text-gray-500 hover:text-white hover:bg-white/5'
                                   }`}
                                 >
                                   {lvl}%
                                 </button>
                               ))}
                             </div>
                          </div>

                          <div className="space-y-2">
                             <label className="text-[10px] font-bold text-primary uppercase ml-1 flex items-center gap-1.5 tracking-widest">
                               <Zap className="w-3.5 h-3.5" />
                               Modo de Arraste (FIM-017/018)
                               <InfoTooltip title={SETTINGS_HELP.management_mode.title} content={SETTINGS_HELP.management_mode.content} />
                             </label>
                             <select 
                               value={settings.risk_management?.fimathe_management_mode || 'standard'}
                               onChange={(e) => updateNested('risk_management', 'fimathe_management_mode', e.target.value)}
                               className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white focus:outline-none focus:border-primary appearance-none cursor-pointer hover:border-primary/50 transition-colors"
                             >
                               <option value="standard">Padrão: BE 50% + Lock 50%</option>
                               <option value="conservative">Conservador: FIM-017 (BE Fixo)</option>
                               <option value="infinity">Infinity: FIM-018 (Arraste)</option>
                             </select>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                               <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 flex items-center">
                                 Gatilho 0x0 (%)
                                 <InfoTooltip title={SETTINGS_HELP.be_trigger.title} content={SETTINGS_HELP.be_trigger.content} />
                               </label>
                               <input 
                                 type="number"
                                 value={settings.risk_management?.fimathe_be_trigger_percent || 50}
                                 onChange={(e) => updateNested('risk_management', 'fimathe_be_trigger_percent', parseInt(e.target.value))}
                                 className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-primary"
                               />
                             </div>

                             {settings.risk_management?.fimathe_management_mode === 'infinity' && (
                               <div className="space-y-2">
                                 <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 flex items-center">
                                   Passo Arraste (%)
                                   <InfoTooltip title={SETTINGS_HELP.trail_step.title} content={SETTINGS_HELP.trail_step.content} />
                                 </label>
                                 <input 
                                   type="number"
                                   value={settings.risk_management?.fimathe_trail_step_percent || 100}
                                   onChange={(e) => updateNested('risk_management', 'fimathe_trail_step_percent', parseInt(e.target.value))}
                                   className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-primary"
                                 />
                               </div>
                             )}
                          </div>
                       </motion.div>
                    )}
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                       <div className="flex flex-col">
                          <span className="text-sm font-bold text-white flex items-center">
                            Break-even Automático
                            <InfoTooltip title={SETTINGS_HELP.be_automativo.title} content={SETTINGS_HELP.be_automativo.content} />
                          </span>
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Entrada Protegida (0x0)</span>
                       </div>
                       <input 
                        type="checkbox" 
                        checked={settings.risk_management?.use_breakeven || false} 
                        onChange={(e) => updateNested('risk_management', 'use_breakeven', e.target.checked)} 
                        className="w-10 h-10 accent-primary cursor-pointer" 
                      />
                    </div>

                    {settings.risk_management?.use_breakeven && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="p-5 bg-secondary/5 rounded-[32px] border border-secondary/10 space-y-4"
                        >
                            <label className="text-[10px] font-bold text-secondary uppercase ml-1 flex items-center gap-1.5 tracking-widest">
                               <ShieldCheck className="w-3.5 h-3.5" />
                               Gordurinha de Lucro (Pontos)
                               <InfoTooltip title={SETTINGS_HELP.be_offset.title} content={SETTINGS_HELP.be_offset.content} />
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                               {[5, 10, 15, 20, 25, 30, 35, 40].map((pts) => (
                                   <button
                                     key={pts}
                                     onClick={() => updateNested('risk_management', 'fimathe_cycle_breakeven_offset_points', pts)}
                                     className={`py-2 rounded-xl text-[10px] font-black transition-all ${
                                       (settings.risk_management?.fimathe_cycle_breakeven_offset_points || 0) === pts
                                         ? 'bg-secondary text-black shadow-[0_0_10px_rgba(244,114,182,0.3)]'
                                         : 'bg-white/5 text-gray-500 hover:text-white'
                                     }`}
                                   >
                                     +{pts}
                                   </button>
                               ))}
                            </div>
                        </motion.div>
                    )}
                 </div>
              </div>

              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase ml-2 tracking-widest flex items-center">
                      Max. Posições Simultâneas
                      <InfoTooltip title={SETTINGS_HELP.max_positions.title} content={SETTINGS_HELP.max_positions.content} />
                    </label>
                    <input 
                       type="number"
                       value={settings.risk_management?.max_open_positions || 3}
                       onChange={(e) => updateNested('risk_management', 'max_open_positions', parseInt(e.target.value))}
                       className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-primary transition-all"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-2 tracking-widest flex items-center">
                      Magic Number (Identificador)
                      <InfoTooltip title={SETTINGS_HELP.magic_number.title} content={SETTINGS_HELP.magic_number.content} />
                    </label>
                    <input type="number" value={settings.risk_management?.magic_number || 202404} onChange={(e) => updateNested('risk_management', 'magic_number', parseInt(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-2 tracking-widest flex items-center">
                      Cooldown entre Ordens (Segundos)
                      <InfoTooltip title={SETTINGS_HELP.cooldown.title} content={SETTINGS_HELP.cooldown.content} />
                    </label>
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
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-2 tracking-widest flex items-center">
                    Servidor Corretora
                    <InfoTooltip title={SETTINGS_HELP.server.title} content={SETTINGS_HELP.server.content} />
                  </label>
                  <input 
                    type="text"
                    value={settings.mt5_connection?.server || 'Alpari-MT5-Demo'}
                    onChange={(e) => updateNested('mt5_connection', 'server', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-2 tracking-widest flex items-center">
                      Login (ID)
                      <InfoTooltip title={SETTINGS_HELP.login.title} content={SETTINGS_HELP.login.content} />
                    </label>
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
                <div className={`space-y-2 ${isFieldConflicted('max_spread_points') ? 'critical-field-wrap p-3 rounded-2xl' : ''}`}>
                   <label className={`text-[10px] font-bold text-gray-400 uppercase ml-2 tracking-widest flex items-center ${isFieldConflicted('max_spread_points') ? 'critical-label-conflict' : ''}`}>
                     Spread Máximo (Pontos)
                     <InfoTooltip title={SETTINGS_HELP.max_spread.title} content={SETTINGS_HELP.max_spread.content} />
                   </label>
                   <div className="relative">
                    <input 
                      type="number"
                      value={settings.signal_logic?.max_spread_points || 30}
                      onChange={(e) => updateNested('signal_logic', 'max_spread_points', parseInt(e.target.value))}
                      className={`w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-orange-500 ${isFieldConflicted('max_spread_points') ? 'critical-input-conflict' : ''}`}
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
                <div className="flex p-1.5 bg-black/40 rounded-2xl border border-white/5">
                   <button 
                     onClick={() => updateNested('log_management', 'mode', 'minutes')}
                     className={`flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all ${
                       (settings.log_management?.mode || 'minutes') === 'minutes' 
                         ? 'bg-red-500 text-black shadow-[0_0_20px_rgba(239,68,68,0.3)]' 
                         : 'text-gray-500 hover:text-white'
                     }`}
                   >
                     Por Tempo
                   </button>
                   <button 
                     onClick={() => updateNested('log_management', 'mode', 'quantity')}
                     className={`flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all ${
                       (settings.log_management?.mode === 'quantity') 
                         ? 'bg-red-500 text-black shadow-[0_0_20px_rgba(239,68,68,0.3)]' 
                         : 'text-gray-500 hover:text-white'
                     }`}
                   >
                     Por Quantidade
                   </button>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-2 tracking-widest">
                    {settings.log_management?.mode === 'quantity' ? 'Manter os últimos (Quantidade)' : 'Janela de Limpeza (Minutos)'}
                  </label>
                  <div className="relative">
                    <input 
                      type="number"
                      value={settings.log_management?.value || 0}
                      onChange={(e) => updateNested('log_management', 'value', parseInt(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-red-500"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-600 tracking-tighter uppercase">
                      {settings.log_management?.mode === 'quantity' ? 'Log' : 'Min'}
                    </span>
                  </div>
                  <p className="text-[9px] text-gray-500 ml-2 italic leading-relaxed">
                    {settings.log_management?.mode === 'quantity' 
                      ? `* Serão preservados apenas os ${settings.log_management?.value || 0} registros mais recentes no banco de dados.` 
                      : `* Logs anteriores a ${settings.log_management?.value || 0} minutos serão removidos automaticamente.`}
                    {" "}Use 0 para desativar.
                  </p>
                </div>
              </div>
            </section>

            {/* NEW: DANGER ZONE SECTION */}
            <section className="glass p-10 rounded-[48px] border border-red-500/10 bg-red-500/[0.01] space-y-8 lg:col-span-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight italic">ZONA DE RISCO</h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Operações críticas e destrutivas</p>
                  </div>
                </div>

                <div className="flex flex-col md:items-end gap-2">
                  <button 
                    onClick={() => setShowResetModal(true)}
                    className="px-8 py-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl text-xs font-black hover:bg-red-500 hover:text-black transition-all group overflow-hidden relative"
                  >
                    <div className="flex items-center gap-2 relative z-10">
                      <Trash2 className="w-4 h-4 group-hover:animate-bounce" /> RESET TOTAL DE DADOS 
                    </div>
                    <div className="absolute inset-0 bg-red-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  </button>
                  <span className="text-[9px] text-gray-600 font-bold uppercase tracking-wider text-right">Esta ação é irreversível</span>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}


