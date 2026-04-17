"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  GraduationCap, 
  BookOpen, 
  Target, 
  ShieldCheck, 
  Zap, 
  AlertTriangle, 
  Info, 
  ChevronRight,
  Lightbulb,
  ExternalLink,
  ChevronDown,
  ArrowRight,
  RotateCcw,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ACADEMY_RULES = [
  {
    id: 'FIM-001',
    name: 'Coleta de Dados',
    category: 'Infraestrutura',
    theory: 'A Fimathe exige precisão absoluta nos dados. Sem uma conexão estável e histórico completo, qualquer marcação de canal é inválida.',
    logic: 'O robô verifica a conectividade simultânea com o terminal MT5 e valida se o histórico de candles do H1 e M15 está completo e sem "gaps".',
    danger: 'Operar com dados incompletos pode resultar em canais deslocados, levando a decisões baseadas em preços que não existem mais.',
    proTip: 'Sempre utilize uma VPS de baixa latência próxima ao servidor da sua corretora para garantir que a FIM-001 esteja sempre OK.',
    icon: Zap
  },
  {
    id: 'FIM-002',
    name: 'Tendência Principal',
    category: 'Análise de Mercado',
    theory: 'Segundo a Teoria de Dow, o preço se move em tendências. Operar contra a tendência principal é nadar contra a correnteza.',
    logic: 'Calculamos a inclinação (Slope) da média móvel no timeframe maior (H1/H4). A operação só é liberada se o Slope exceder o limite de pontos configurado.',
    danger: 'Desativar ou ignorar a tendência expõe o capital a mercados laterais ("caixotes"), onde a probabilidade de acerto cai drasticamente.',
    proTip: 'Ajuste o Slope Mínimo de acordo com a volatilidade do ativo. Pares mais "nervosos" exigem slopes maiores.',
    icon: Target
  },
  {
    id: 'FIM-003',
    name: 'Canais A/B',
    category: 'Análise de Mercado',
    theory: 'Os Canais de Referência e Zona Neutra são o coração da técnica. Eles definem a amplitude do ciclo atual.',
    logic: 'O robô identifica topos e fundos recentes para projetar os limites A (Referência) e B (Zona Neutra) com 100% de precisão matemática.',
    danger: 'Sem canais objetivos, o trader cai no erro do "achismo", marcando níveis por intuição e não por volatilidade real.',
    proTip: 'Observe as marcações do robô no terminal. Se os canais estiverem muito estreitos, o mercado está em baixa volatilidade.',
    icon: BookOpen
  },
  {
    id: 'FIM-004',
    name: 'Sincronia Temporal',
    category: 'Análise de Mercado',
    theory: 'A técnica Fimathe é multi-temporal. O movimento do M1 deve ser lido dentro do contexto do H1.',
    logic: 'O robô sincroniza os dados de múltiplos times antes de processar sinais, garantindo que a entrada não ocorra em dados obsoletos.',
    danger: 'Sem sincronia, você pode entrar em um sinal de M1 que já foi invalidado por uma mudança de tendência bruta no H1.',
    proTip: 'O robô gerencia isso automaticamente, mas certifique-se de que o MT5 tem os gráficos de M1 e H1 abertos no Market Watch.',
    icon: Zap
  },
  {
    id: 'FIM-005',
    name: 'Região Negociável',
    category: 'Lógica de Sinal',
    theory: 'Nem todo movimento de preço é operável. Existe uma "terra de ninguém" entre as projeções que deve ser evitada.',
    logic: 'O algoritmo bloqueia entradas se o preço estiver no meio de um canal de projeção, permitindo ordens apenas próximas às bordas de gatilho.',
    danger: 'Entrar no meio do canal prejudica o seu Risco:Retorno e te deixa exposto à volatilidade de ruído lateral.',
    proTip: 'Se o log mostrar "Fora da região negociável", o robô está te salvando de uma entrada sem vantagem estatística.',
    icon: Target
  },
  {
    id: 'FIM-006',
    name: 'Filtro de Agrupamento',
    category: 'Lógica de Sinal',
    theory: 'Rompimentos de um único candle (spikes) costumam ser armadilhas de liquidez. O agrupamento confirma a intenção do mercado.',
    logic: 'Exige que um número mínimo de velas feche em consoles estreitos no M1 antes do rompimento oficial.',
    danger: 'Sem o agrupamento, você entrará em "estilingadas" que podem retornar à zona neutra no candle seguinte.',
    proTip: 'Para o gráfico de XAUUSD (Ouro), manter o agrupamento ativo é vital devido à alta frequência de ruídos.',
    icon: ShieldCheck
  },
  {
    id: 'FIM-007',
    name: 'Rompimento Canal',
    category: 'Lógica de Sinal',
    theory: 'O corpo do candle deve provar que o preço superou a resistência/suporte do canal Fimathe.',
    logic: 'Valida se o fechamento (Close) da vela de entrada está efetivamente fora da borda do canal de referência/zona neutra.',
    danger: 'Ignorar o fechamento permite que você seja stopado por simples "violinos" (pavios que voltam para o canal).',
    proTip: 'Use o filtro de rompimento rigoroso para evitar entradas precipitadas em candles de muita volatilidade.',
    icon: Zap
  },
  {
    id: 'FIM-008',
    name: 'Regra Anti-Achômetro',
    category: 'Lógica de Sinal',
    theory: 'O mercado tem memória. Sinais próximos a Suportes ou Resistências (S/R) históricos são muito mais fortes.',
    logic: 'O robô compara o ponto de entrada com níveis de S/R detectados nos últimos 2 anos. O sinal é fortalecido se houver confluência.',
    danger: 'Entrar vendido logo acima de um suporte majoritário é uma receita para o desastre.',
    proTip: 'Ative esta regra se você opera ativos como EURUSD que respeitam muito níveis de preços redondos e históricos.',
    icon: ShieldCheck
  },
  {
    id: 'FIM-009',
    name: 'Filtro de Spread',
    category: 'Execução',
    theory: 'O custo operacional é o maior inimigo do trader. Entrar com spread alto é começar a operação com um prejuízo desproporcional.',
    logic: 'O sistema consulta o spread atual da corretora em milissegundos. Se o valor for superior ao teto, o sinal é abortado.',
    danger: 'Em notícias, o spread abre violentamente. Sem este filtro, sua ordem pode ser executada muito longe do ponto ideal.',
    proTip: 'Configure o Spread Máximo para coincidir com a média da sua corretora em horários de liquidez normal.',
    icon: AlertTriangle
  },
  {
    id: 'FIM-010',
    name: 'Ciclo de Proteção',
    category: 'Gestão de Risco',
    theory: 'A regra de proteção de capital nos 50% é o que separa amadores de profissionais na Fimathe.',
    logic: 'Move o Stop para o Break-even (Entrada) quando o preço atinge 50% da projeção de alvo.',
    danger: 'Ignorar o ciclo de proteção transforma trades vitoriosos em perdas em segundos por falta de blindagem.',
    proTip: 'Acompanhe a régua visual no Dashboard para ver quão perto o preço está do gatilho de 50%.',
    icon: ShieldCheck
  },
  {
    id: 'FIM-011',
    name: 'Reteste (Pullback)',
    category: 'Lógica de Sinal',
    theory: 'Muitas vezes o preço rompe e volta para "beijar" a borda do canal antes de seguir viagem. Esse é o Callback.',
    logic: 'Permite configurar o robô para aguardar o reteste da borda antes de disparar a ordem oficial (Entrada Conservadora).',
    danger: 'Ativar o reteste pode te fazer perder algumas entradas rápidas, mas aumenta drasticamente a precisão da operação.',
    proTip: 'Em dias de baixa volatilidade, o reteste é essencial para conseguir o melhor preço de execução.',
    icon: RotateCcw
  },
  {
    id: 'FIM-012',
    name: 'Limite de Risco (3%)',
    category: 'Gestão de Risco',
    theory: 'A regra de sobrevivência número 1: Nunca arrisque mais do que 3% da sua conta em uma única operação.',
    logic: 'O robô calcula o lote (Volume) automaticamente baseado no seu saldo e na distância do stop técnico Fimathe.',
    danger: 'Exceder o risco de 3% coloca sua conta em risco de "ruína" matemática, onde perdas seguidas se tornam irrecuperáveis.',
    proTip: 'Respeite a regra dos 3%. A consistência vem da proteção, não da ganância de lotes altos.',
    icon: ShieldCheck
  },
  {
    id: 'FIM-013',
    name: 'Gestão de Alvos',
    category: 'Gestão de Risco',
    theory: 'Saber onde sair é tão importante quanto saber onde entrar. Alvos Fimathe são baseados na expansão do canal.',
    logic: 'Calcula automaticamente os níveis de 80%, 85% ou 100% do canal subequente como pontos de Take Profit (TP).',
    danger: 'Mover o alvo aleatoriamente mata a sua razão Risco:Retorno. Deixe o robô gerenciar os sub-níveis de forma técnica.',
    proTip: 'Use o nível de 80% para garantir trades mais rápidos e reduzir a exposição a reversões de final de movimento.',
    icon: Target
  },
  {
    id: 'FIM-014',
    name: 'Auditoria de Estado',
    category: 'Infraestrutura',
    theory: 'A transparência total é fundamental. Você deve saber exatamente o que o robô está "pensando".',
    logic: 'Gera um rastro de auditoria (Rule Trace) em cada loop de análise, gravando o estado de todas as 16 regras Fimathe.',
    danger: 'Sem auditoria, o trader não entende por que uma ordem não abriu, gerando ansiedade e desconfiança do sistema.',
    proTip: 'Consulte a aba de Auditoria no Monitor de Execução para ver o Rule Trace em tempo real.',
    icon: Info
  },
  {
    id: 'FIM-015',
    name: 'Reversão Rigorosa',
    category: 'Lógica de Sinal',
    theory: 'Tentar adivinhar topos e fundos é erro fatal. A reversão só deve ser operada após prova de fraqueza da tendência.',
    logic: 'Exige que o preço caia (ou suba) 2 níveis inteiros e forme um triângulo de consolidação antes de permitir sinal contra a tendência.',
    danger: 'Tentar pegar o "topo" em uma tendência de alta sem a regra de reversão resultará em múltiplos stops seguidos.',
    proTip: 'A regra de reversão é sua maior proteção contra o viés psicológico de querer ir contra o fluxo.',
    icon: Info
  },
  {
    id: 'FIM-016',
    name: 'Tendência Estrutural',
    category: 'Análise de Mercado',
    theory: 'Não basta o Slope estar positivo, a estrutura de mercado (Topos e Fundos) deve confirmar o movimento.',
    logic: 'Analisa se houve o rompimento de topos/fundos anteriores (HH/LL) no H1 para confirmar a saúde da tendência.',
    danger: 'Média móvel com Slope positivo pode indicar apenas uma correção de curto prazo se não houver quebra de estrutura técnica.',
    proTip: 'Ative a FIM-016 para operações de longo prazo (Swing Trading) onde a estrutura é mais importante que o momentum.',
    icon: Layers
  },
  {
    id: 'FIM-017',
    name: 'Gestão Conservadora (0x0)',
    category: 'Gestão de Risco',
    theory: 'A prioridade absoluta é proteger o capital. Travar a operação no 0x0 retira o peso psicológico do risco.',
    logic: 'Move o stop para o Break-even assim que o gatilho percentual configurado é atingido e congela o arraste.',
    danger: 'Em mercados muito voláteis, travar no 0x0 cedo demais pode te tirar de um trade que ainda teria lucro.',
    proTip: 'Ideal para traders que preferem segurança máxima e alvos fixos bem definidos (80-100%).',
    icon: ShieldCheck
  },
  {
    id: 'FIM-018',
    name: 'Gestão Progressiva (Infinity)',
    category: 'Gestão de Risco',
    theory: 'O mercado pode entregar movimentos gigantes. Limitar o lucro a um nível fixo pode ser um custo de oportunidade.',
    logic: 'Remove o Take Profit fixo e move o Stop Loss nível a nível (arraste de 50/100%) seguindo a expansão infinita.',
    danger: 'Sem TP fixo, você depende da reversão do preço para fechar o trade, o que pode devolver parte do lucro no topo.',
    proTip: 'Use em ativos com tendência forte (XAUUSD, Índices) para capturar movimentos de múltiplos canais.',
    icon: Zap
  }
];

export function AcademyContent() {
  const searchParams = useSearchParams();
  const ruleParam = searchParams.get('rule');
  const [activeRuleId, setActiveRuleId] = useState('FIM-001');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (ruleParam && ACADEMY_RULES.some(r => r.id === ruleParam)) {
      setActiveRuleId(ruleParam);
    }
  }, [ruleParam]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const activeRule = ACADEMY_RULES.find(r => r.id === activeRuleId) || ACADEMY_RULES[0];

  return (
    <div className="flex flex-col lg:flex-row gap-8 pb-20 animate-in fade-in duration-700">
      
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-72 shrink-0">
        <div className="sticky top-24 space-y-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white">Manual Fimathe</h2>
          </div>

          <div className="space-y-1 bg-white/5 p-2 rounded-[32px] border border-white/5">
            {ACADEMY_RULES.map((rule) => (
              <button
                key={rule.id}
                onClick={() => setActiveRuleId(rule.id)}
                className={`w-full flex items-center justify-between px-5 py-3 rounded-2xl text-[11px] font-bold transition-all ${
                  activeRuleId === rule.id 
                    ? 'bg-primary text-black shadow-lg shadow-primary/20' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${activeRuleId === rule.id ? 'bg-black/20' : 'bg-white/5'}`}>
                    {rule.id}
                  </span>
                  {rule.name}
                </div>
                <ChevronRight className={`w-3 h-3 transition-transform ${activeRuleId === rule.id ? 'rotate-90' : ''}`} />
              </button>
            ))}
            
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 space-y-8">
        
        {/* Header Hero */}
        <section className="glass p-10 rounded-[48px] border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] -mr-32 -mt-32 rounded-full" />
          
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-2">
              <span className="text-primary text-[10px] font-black uppercase tracking-[0.3em]">Knowledge Base</span>
              <div className="w-12 h-px bg-primary/30" />
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="text-4xl font-black text-white tracking-tighter mb-2">
                  EXPLICAÇÃO: <span className="text-primary uppercase">{activeRule.name}</span>
                </h1>
                <p className="text-gray-500 text-sm max-w-xl">
                  Fundamentação teórica, lógica de código e diretrizes de configuração para a regra {activeRule.id}.
                </p>
              </div>
              <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                activeRuleId.startsWith('FIM-00') ? 'bg-secondary/10 border-secondary/20 text-secondary' : 'bg-primary/10 border-primary/20 text-primary'
              }`}>
                {activeRule.category}
              </div>
            </div>
          </div>
        </section>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Theory Block */}
          <motion.div 
            key={`${activeRuleId}-theory`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass p-8 rounded-[40px] border border-white/5 space-y-4"
          >
            <div className="flex items-center gap-3 text-secondary">
              <BookOpen className="w-5 h-5" />
              <h3 className="text-sm font-black uppercase tracking-widest">Fundamento Fimathe</h3>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed">
              {activeRule.theory}
            </p>
          </motion.div>

          {/* Logic Block */}
          <motion.div 
            key={`${activeRuleId}-logic`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass p-8 rounded-[40px] border border-white/5 space-y-4"
          >
            <div className="flex items-center gap-3 text-primary">
              <Zap className="w-5 h-5" />
              <h3 className="text-sm font-black uppercase tracking-widest">Lógica do Robô</h3>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed italic">
              "{activeRule.logic}"
            </p>
          </motion.div>

          {/* Danger Block */}
          <motion.div 
            key={`${activeRuleId}-danger`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass p-8 rounded-[40px] border border-red-500/10 space-y-4 lg:col-span-2"
          >
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-sm font-black uppercase tracking-widest">Risco da Ausência</h3>
            </div>
            <div className="p-4 bg-red-500/5 rounded-2xl border border-red-500/10">
              <p className="text-red-200/60 text-xs leading-relaxed font-medium">
                {activeRule.danger}
              </p>
            </div>
          </motion.div>

          {/* Pro Tip Block */}
          <motion.div 
            key={`${activeRuleId}-tip`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="col-span-1 md:col-span-2 relative overflow-hidden p-8 rounded-[40px] bg-primary text-black"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Lightbulb className="w-24 h-24" />
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
              <div className="bg-black/10 p-4 rounded-3xl">
                <Lightbulb className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-black uppercase tracking-tighter">Dica do Especialista</h3>
                <p className="text-sm font-bold opacity-80 leading-snug max-w-2xl">
                  {activeRule.proTip}
                </p>
              </div>
              <button className="md:ml-auto flex items-center gap-2 bg-black px-6 py-3 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest hover:bg-black/80 transition-all">
                Ir para Settings <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </motion.div>

        </div>

        {/* Generic Help Card */}
        <section className="glass p-10 rounded-[48px] border border-white/5 flex flex-col md:flex-row items-center gap-8">
          <div className="p-10 rounded-full bg-white/5 border border-white/10">
            <Info className="w-12 h-12 text-gray-500" />
          </div>
          <div className="space-y-4 text-center md:text-left">
            <h3 className="text-xl font-bold text-white">Não encontrou o que procurava?</h3>
            <p className="text-gray-500 text-xs max-w-xl">
              Nossa documentação é atualizada constantemente com base no feedback da comunidade e mudanças no motor original MetaTrader 5.
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <button className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest hover:underline">
                Suporte VIP <ExternalLink className="w-3 h-3" />
              </button>
              <button className="flex items-center gap-2 text-gray-400 font-bold text-[10px] uppercase tracking-widest hover:underline">
                Portal Fimathe Oficial
              </button>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}

export default function AcademyPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AcademyContent />
    </Suspense>
  );
}
