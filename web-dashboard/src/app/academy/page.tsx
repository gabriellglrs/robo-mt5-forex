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
import { motion } from 'framer-motion';

const ACADEMY_RULES = [
  {
    id: 'FIM-001',
    name: 'Coleta de Dados',
    category: 'Infraestrutura',
    theory: 'A precisão matemática da Fimathe depende 100% da integridade dos dados. Diferente de indicadores baseados em médias, o Price Action exige que cada candle do H1 e M15 esteja perfeitamente alinhado e sem "gaps". Se houver falha na coleta, toda a estrutura de canais colapsa.',
    logic: 'O robô executa uma verificação atômica de conectividade com o terminal MetaTrader 5 e valida o histórico das últimas 500 velas em múltiplos timeframes. Ele busca por lacunas temporais (gaps de conectividade) e sincroniza o relógio do servidor com o do terminal em milissegundos.',
    danger: 'Operar com dados corrompidos ou incompletos resulta em canais "falsos" que não existem na realidade do mercado, levando você a comprar ou vender em níveis técnicos inexistentes.',
    proTip: 'Utilize uma VPS (Virtual Private Server) com latência inferior a 10ms em relação à sua corretora para garantir que a FIM-001 esteja sempre verde.',
    icon: Zap
  },
  {
    id: 'FIM-002',
    name: 'Tendência Principal',
    category: 'Análise de Mercado',
    theory: 'Baseado no primeiro princípio da Teoria de Dow: o mercado se move em tendências. No Fimathe, operar a favor do fluxo do timeframe maior (H1) reduz drasticamente a taxa de erro e protege contra a volatilidade errática de curto prazo.',
    logic: 'Implementamos um motor de Regressão Linear (Polyfit) que analisa as últimas 200 velas de H1. O robô calcula a inclinação (Slope) dessa linha: se for superior ao limite configurado (ex: 0.20 pontos/vela), a tendência é validada como COMPRA ou VENDA.',
    danger: 'Ignorar a tendência principal expõe o capital aos "caixotes" de lateralidade, onde o preço oscila sem direção e aciona ordens apenas para retornar à zona neutra no próximo candle.',
    proTip: 'Aumente o "Min Slope Points" em ativos com alto spread ou volatilidade (como Ouro) para filtrar movimentos fracos.',
    icon: Target
  },
  {
    id: 'FIM-003',
    name: 'Canais A/B',
    category: 'Análise de Mercado',
    theory: 'Os canais de Referência e Zona Neutra são o "quartel-general" do robô. Eles definem os limites do volume de negociação atual e onde a tendência será confirmada ou revertida.',
    logic: 'Utilizamos uma combinação de Histogramas de Densidade de Preço e algoritmos de identificação de Pivôs Técnicos. O robô mapeia onde o preço mais consolidou nas últimas semanas (W1) para traçar as bordas A e B com precisão cirúrgica.',
    danger: 'Traçar canais de forma subjetiva ("no olho") leva ao viés psicológico de querer ver um rompimento onde existe apenas ruído. O motor matemático remove esse erro humano.',
    proTip: 'Se o "Canal Size" estiver muito pequeno em relação ao histórico do ativo, o mercado está em exaustão ou pré-notícia. Evite operar.',
    icon: BookOpen
  },
  {
    id: 'FIM-004',
    name: 'Sincronia Temporal',
    category: 'Infraestrutura',
    theory: 'A estratégia Fimathe é intrinsecamente multitemporal. O sinal de gatilho no M15 ou M1 só tem valor real se o cenário de H1 ainda for válido no exato momento da execução.',
    logic: 'O algoritmo realiza um "Health Check" contínuo comparando os timestamps de fechamento do último candle de todos os timeframes ativos. Se houver um atraso superior a 5 segundos nas informações, o sinal é abortado por desatualização.',
    danger: 'Sem sincronia, você pode entrar em uma ordem baseada em um rompimento de M15 que já foi invalidado por uma reversão brutal no H1 que o seu robô ainda não processou.',
    proTip: 'Certifique-se de que os pares de moedas estão abertos no "Market Watch" (Observação de Mercado) do seu MT5 para garantir atualização instantânea.',
    icon: Zap
  },
  {
    id: 'FIM-005',
    name: 'Região Negociável',
    category: 'Lógica de Sinal',
    theory: 'Nem todo movimento é uma oportunidade. Segundo o Marcelo Ferreira, existe uma "terra de ninguém" entre as zonas de gatilho. Entrar nessa região mata a sua vantagem estatística.',
    logic: 'O robô cria um "mapeamento geográfico" em torno dos níveis A/B e das projeções de 50%, 80% e 100%. Ele só permite o sinal se o preço atual estiver a uma distância técnica segura (buffer) desses níveis críticos.',
    danger: 'Entrar no "meio do caminho" prejudica severamente sua relação Risco:Retorno. Se o Stop Loss estiver distante e o Take Profit próximo, você perderá dinheiro a longo prazo mesmo com alta assertividade.',
    proTip: 'Se o log mostrar "Fora da região negociável", é o robô protegendo seu capital de uma entrada impulsiva tardia.',
    icon: Target
  },
  {
    id: 'FIM-006',
    name: 'Filtro de Agrupamento',
    category: 'Lógica de Sinal',
    theory: 'Rompimentos de um único candle explosivo costumam ser armadilhas de grandes players. O verdadeiro rompimento Fimathe nasce de uma consolidação (agrupamento) que prova o domínio de uma das pontas.',
    logic: 'O sistema analisa o Desvio Padrão e o Tamanho Médio do Corpo das últimas 12 velas de M1. Exige-se que o "Range" total dessas velas seja estreito (ex: < 180 pontos) antes de permitir que o rompimento principal seja válido.',
    danger: 'Sem este filtro, o robô entraria em "estilingadas" ou "picos de volatilidade" (spikes) que tendem a retornar à média segundos depois, acionando seu stop evitável.',
    proTip: 'Essencial para o par XAUUSD (Ouro), onde rompimentos sem agrupamento têm taxa de falha superior a 60%.',
    icon: ShieldCheck
  },
  {
    id: 'FIM-007',
    name: 'Rompimento Canal',
    category: 'Lógica de Sinal',
    theory: 'Não basta o preço "tocar" na linha. O corpo do candle deve provar que houve força compradora ou vendedora suficiente para superar a resistência técnica e fechar fora do canal.',
    logic: 'O robô monitora o fechamento (Close) da vela no timeframe de entrada. Ele aplica um "Breakout Buffer" (configurável em pontos) para garantir que o fechamento não foi apenas um "beijo" na linha, mas uma superação real.',
    danger: 'Ignorar o fechamento permite que você seja pego pelo "violino" (pavio), onde o preço fura a linha mas retorna no mesmo candle, invalidando o setup e parando a sua ordem imediatamente.',
    proTip: 'Em ativos muito voláteis, aumente o buffer de rompimento para pelo menos 15 pontos para evitar falsos sinais.',
    icon: Zap
  },
  {
    id: 'FIM-008',
    name: 'Regra Anti-Achômetro',
    category: 'Lógica de Sinal',
    theory: 'O mercado tem memória institucional. Níveis de Suporte e Resistência (S/R) históricos de longo prazo (W1) tendem a segurar o preço com muito mais força do que qualquer padrão de curto prazo.',
    logic: 'O motor de níveis mapeia as últimas 52 semanas de dados em busca de "Clusters" de preço. O sinal de entrada é fortalecido e liberado apenas se houver uma convergência entre o rompimento Fimathe e um desses níveis históricos de S/R.',
    danger: 'Entrar em um sinal de venda logo acima de um suporte semanal majoritário é ignorar uma muralha de ordens de compra institucionais que podem reverter o preço contra você em segundos.',
    proTip: 'Ative esta regra para operar moedas majoritárias (como EURUSD) que respeitam muito números redondos e zonas de oferta/demanda históricas.',
    icon: ShieldCheck
  },
  {
    id: 'FIM-009',
    name: 'Filtro de Spread',
    category: 'Execução',
    theory: 'O custo operacional pode destruir uma estratégia lucrativa. Entrar em uma operação com o spread aberto é como começar uma corrida 100 metros atrás dos adversários.',
    logic: 'O sistema consulta o spread do TICK atual diretamente do terminal MetaTrader 5 em milissegundos. Se o spread for superior ao limite definido pelo usuário (ex: 2.0 pips), o robô aborta o envio da ordem.',
    danger: 'Durante notícias de alto impacto, o spread pode abrir 10x ou 20x. Sem esse filtro, sua ordem seria executada em um preço absurdamente pior do que o planejado, anulando o seu lucro.',
    proTip: 'Verifique o spread médio da sua corretora em horários normais e configure o limite ligeiramente acima dessa média.',
    icon: AlertTriangle
  },
  {
    id: 'FIM-010',
    name: 'Ciclo de Proteção',
    category: 'Gestão de Risco',
    theory: 'A proteção de capital é a prioridade #1 da Fimathe. Aos 50% do caminho para o alvo, a operação deve tornar-se "grátis" (risk-free).',
    logic: 'Assim que o preço toca o nível de 50% da projeção de alvo, o robô move automaticamente o Stop Loss para o ponto de entrada (Break-even). Isso blinda o capital principal.',
    danger: 'Ignorar o ciclo de proteção permite que operações que estavam quase no alvo retornem e virem prejuízo total. No trading profissional, lucro no bolso é regra, mas capital protegido é lei.',
    proTip: 'Acompanhe a régua visual no seu Dashboard para ver o quão próximo o preço está do nível de "travamento" de 50%.',
    icon: ShieldCheck
  },
  {
    id: 'FIM-011',
    name: 'Reteste (Pullback)',
    category: 'Lógica de Sinal',
    theory: 'O mercado frequentemente "respira" após um rompimento. O reteste da borda do canal é a confirmação final de que a antiga resistência virou suporte (ou vice-versa).',
    logic: 'Nesta configuração, o robô não entra no rompimento seco. Ele aguarda o preço retornar à borda rompida dentro de uma tolerância de pontos e, apenas após esse "beijo", dispara a ordem de execução.',
    danger: 'Entrar sem o reteste pode te deixar exposto a correções rápidas que buscam liquidez na borda do canal antes do movimento seguir viagem.',
    proTip: 'Use a entrada com reteste se você busca uma taxa de assertividade maior sacrificando algumas entradas explosivas de tiro único.',
    icon: RotateCcw
  },
  {
    id: 'FIM-012',
    name: 'Limite de Risco (3%)',
    category: 'Gestão de Risco',
    theory: 'A matemática da ruína é implacável. Arriscar fatias grandes do capital leva ao desespero psicológico e à perda total da conta em sequências curtas de perda.',
    logic: 'O algoritmo calcula o volume da ordem (Lot Size) em tempo real. Ele lê o saldo da sua conta e a distância exata até o Stop Loss técnico Fimathe, garantindo que a perda máxima em caso de STOP seja de exatamente 3% (ou o valor que você definir).',
    danger: 'Operar com lotes fixos ou aleatórios é ignorar a volatilidade. Se o canal for grande e o seu lote for alto, um único stop pode tirar meses de lucro da sua conta.',
    proTip: 'Mantenha o risco entre 1% e 3%. A consistência vem de sobreviver tempo suficiente para que a estatística positiva trabalhe a seu favor.',
    icon: ShieldCheck
  },
  {
    id: 'FIM-013',
    name: 'Gestão de Alvos',
    category: 'Gestão de Risco',
    theory: 'Saber onde sair é tão importante quanto saber onde entrar. Os alvos Fimathe não são "chutes", são expansões matemáticas da volatilidade do canal original.',
    logic: 'O robô projeta os níveis de 80%, 85%, 90% ou 100% do canal seguinte. Ele permite que você escolha o "alvão" ou garantias menores conforme o seu perfil de risco e o contexto da tendência.',
    danger: 'Mover o alvo para cima por pura ganância quando o preço está chegando perto mata a sua vantagem probabilística. O mercado tende a reverter após atingir os níveis de 100% da expansão.',
    proTip: 'Use o nível de 80% como Take Profit padrão para garantir a saída antes de uma possível exaustão do movimento.',
    icon: Target
  },
  {
    id: 'FIM-014',
    name: 'Auditoria de Estado',
    category: 'Infraestrutura',
    theory: 'A transparência total é a única forma de auditar a performance do seu robô. No trading algorítmico, o "Porquê" é mais importante que o o resultado de uma única operação.',
    logic: 'O motor de estados gera um rastro (Rule Trace) em cada ciclo de 1 segundo. Ele registra exatamente qual regra bloqueou a entrada e quais foram os valores técnicos (spread, slope, range) naquele momento.',
    danger: 'Sem auditoria, você fica cego. Se o robô não abrir uma ordem que você "achou" que deveria, você não saberá se foi um erro de conexão ou um filtro de segurança genuíno.',
    proTip: 'Consulte os logs em tempo real na aba "Auditoria" para entender a "mente" do robô durante o pregão.',
    icon: Info
  },
  {
    id: 'FIM-015',
    name: 'Reversão Rigorosa',
    category: 'Lógica de Sinal',
    theory: 'Tentar adivinhar o "fim" de uma tendência é um erro de amador. A reversão técnica só é confirmada quando o preço prova exaustão total e quebra da estrutura anterior.',
    logic: 'Exige-se que o preço percorra pelo menos 2 níveis inteiros contra a tendência original e forme uma base de consolidação (Triângulo M1) antes de liberar um sinal de contra-tendência.',
    danger: 'Entrar contra a tendência principal sem a Regra de Reversão ativa fará com que você seja estopado repetidamente em cada correção curta do mercado.',
    proTip: 'Esta é a sua regra de segurança máxima. Mantenha-a ativa para evitar o viés psicológico de "comprar topo ou vender fundo".',
    icon: Info
  },
  {
    id: 'FIM-016',
    name: 'Tendência Estrutural',
    category: 'Análise de Mercado',
    theory: 'O preço pode estar subindo no curto prazo mas ainda estar em uma estrutura de baixa no longo prazo. A estrutura de Topos e Fundos (HH/LL) é o mapa definitivo.',
    logic: 'O robô analisa os últimos pivôs de H1 para garantir que a tendência confirmada pelo Slope também possui uma estrutura de Higher Highs (Topos Maiores) ou Lower Lows (Fundos Menores).',
    danger: 'Operar baseando-se apenas em médias móveis ou inclinação pode te levar a comprar em um "rali de alívio" dentro de uma tendência de baixa macro.',
    proTip: 'Ative para operações de Swing Trading (posição por vários dias) onde a estrutura macro manda no preço.',
    icon: Layers
  },
  {
    id: 'FIM-017',
    name: 'Gestão Conservadora (0x0)',
    category: 'Gestão de Risco',
    theory: 'Muitos traders preferem a paz de espírito de uma operação protegida do que o risco de buscar alvos gigantes. O modo 0x0 foca na preservação.',
    logic: 'Assim que o primeiro gatilho de alvo é atingido, o robô trava o Stop Loss no ponto de entrada e encerra o arraste automático, focando apenas no Take Profit fixo.',
    danger: 'Em mercados com alta volatilidade de "pavio", ser tirado no 0x0 pode acontecer com frequência, te deixando de fora de movimentos que ainda iriam para o alvo.',
    proTip: 'Ideal para capital pequeno onde a prioridade máxima é não perder o que já foi ganho.',
    icon: ShieldCheck
  },
  {
    id: 'FIM-018',
    name: 'Gestão Progressiva (Infinity)',
    category: 'Gestão de Risco',
    theory: 'O mercado financeiro pode entregar ondas que duram centenas de pontos. Limitar o lucro a um canal é um custo de oportunidade alto em tendências fortes.',
    logic: 'Neste modo, o Take Profit é removido. O robô utiliza um Trailing Stop agressivo nível-a-nível (50/100%) que persegue o preço até que ocorra uma reversão técnica real.',
    danger: 'Você depende da reversão do preço para sair, o que significa que sempre devolverá uma pequena parte do lucro do topo absoluto do trade.',
    proTip: 'Use em ativos com tendência clara e direcional como o Ouro ou Índices Mundiais.',
    icon: Zap
  }
];

function AcademyContent() {
  const searchParams = useSearchParams();
  const ruleParam = searchParams.get('rule');
  const [activeRuleId, setActiveRuleId] = useState('FIM-001');

  useEffect(() => {
    if (ruleParam && ACADEMY_RULES.some(r => r.id === ruleParam)) {
      setActiveRuleId(ruleParam);
    }
  }, [ruleParam]);

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
                className={`w-full flex items-center justify-between px-5 py-3 rounded-2xl text-[11px] font-bold transition-all ` + 
                  (activeRuleId === rule.id 
                    ? 'bg-primary text-black shadow-lg shadow-primary/20' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5')
                }
              >
                <div className="flex items-center gap-3">
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ` + (activeRuleId === rule.id ? 'bg-black/20' : 'bg-white/5')}>
                    {rule.id}
                  </span>
                  {rule.name}
                </div>
                <ChevronRight className={`w-3 h-3 transition-transform ` + (activeRuleId === rule.id ? 'rotate-90' : '')} />
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 space-y-8">
        
        {/* Header Hero */}
        <section className="glass p-10 rounded-[48px] border border-white/5 relative overflow-hidden">
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
              <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ` + 
                (activeRuleId.startsWith('FIM-00') ? 'bg-secondary/10 border-secondary/20 text-secondary' : 'bg-primary/10 border-primary/20 text-primary')}>
                {activeRule.category}
              </div>
            </div>
          </div>
        </section>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div 
            key={activeRuleId + "-theory"}
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

          <motion.div 
            key={activeRuleId + "-logic"}
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

          <motion.div 
            key={activeRuleId + "-danger"}
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

          <motion.div 
            key={activeRuleId + "-tip"}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="col-span-1 md:col-span-2 relative overflow-hidden p-8 rounded-[40px] bg-primary text-black"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Lightbulb className="w-24 h-24" />
            </div>
            
            <div className="relative flex flex-col md:flex-row md:items-center gap-6">
              <div className="bg-black/10 p-4 rounded-3xl">
                <Lightbulb className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-black uppercase tracking-tighter">Dica do Especialista</h3>
                <p className="text-sm font-bold opacity-80 leading-snug max-w-2xl">
                  {activeRule.proTip}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Support Block */}
        <section className="glass p-10 rounded-[48px] border border-white/5 flex flex-col md:flex-row items-center gap-8">
          <div className="p-10 rounded-full bg-white/5 border border-white/10">
            <Info className="w-12 h-12 text-gray-500" />
          </div>
          <div className="space-y-4 text-center md:text-left">
            <h3 className="text-xl font-bold text-white">Não encontrou o que procurava?</h3>
            <p className="text-gray-500 text-xs max-w-xl">
              Nossa documentação é atualizada constantemente com base no feedback da comunidade e mudanças no motor original MT5.
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
    <div className="min-h-screen pt-24 pb-20 px-4 md:px-8">
       <div className="max-w-7xl mx-auto">
          <Suspense fallback={<div className="text-white">Carregando...</div>}>
            <AcademyContent />
          </Suspense>
       </div>
    </div>
  );
}
