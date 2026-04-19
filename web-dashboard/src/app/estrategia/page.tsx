"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpenCheck,
  Route,
  Shield,
  SlidersHorizontal,
  Radar,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

type AnalysisSettings = {
  symbols?: string[];
  ab_lookback_candles?: number;
  trend_candles?: number;
};

type SignalSettings = {
  trading_type?: string;
  trend_timeframe?: string;
  entry_timeframe?: string;
  require_grouping?: boolean;
  require_channel_break?: boolean;
  require_sr_touch?: boolean;
  require_pullback_retest?: boolean;
  strict_reversal_logic?: boolean;
  require_structural_trend?: boolean;
  breakout_buffer_points?: number;
  pullback_tolerance_points?: number;
  sr_tolerance_points?: number;
  trend_min_slope_points?: number;
  max_spread_points?: number;
};

type RiskSettings = {
  risk_percent?: number;
  max_open_positions?: number;
  symbol_cooldown_seconds?: number;
  fimathe_cycle_enabled?: boolean;
  fimathe_management_mode?: string;
  fimathe_be_trigger_percent?: number;
  fimathe_trail_step_percent?: number;
};

type SettingsPayload = {
  analysis?: AnalysisSettings;
  signal_logic?: SignalSettings;
  risk_management?: RiskSettings;
};

type GuardrailIssue = {
  title: string;
  detail: string;
};

function tradingTypeLabel(tradingType?: string): string {
  const map: Record<string, string> = {
    scalper: "Scalper",
    day_trader: "Day Trader",
    position_trader: "Position Trader",
    swing_trader: "Swing Trader",
    manual: "Manual",
  };
  return map[String(tradingType || "manual")] || "Manual";
}

function channelPresetHint(abLookback: number, trendCandles: number): string {
  if (abLookback <= 10 && trendCandles <= 50) return "Micro";
  if (abLookback <= 60 && trendCandles <= 150) return "Intraday";
  if (abLookback <= 170 && trendCandles <= 240) return "Trend";
  return "Macro";
}

function computeGuardrails(settings: SettingsPayload): GuardrailIssue[] {
  const signal = settings.signal_logic || {};
  const analysis = settings.analysis || {};

  const trendTf = String(signal.trend_timeframe || "H1").toUpperCase();
  const entryTf = String(signal.entry_timeframe || "M15").toUpperCase();
  const breakoutBuffer = Number(signal.breakout_buffer_points ?? 10);
  const pullbackTolerance = Number(signal.pullback_tolerance_points ?? 20);
  const srTolerance = Number(signal.sr_tolerance_points ?? 35);
  const maxSpread = Number(signal.max_spread_points ?? 30);
  const slopeMin = Number(signal.trend_min_slope_points ?? 0.2);

  const requireGrouping = !!signal.require_grouping;
  const requirePullback = !!signal.require_pullback_retest;
  const requireSrTouch = !!signal.require_sr_touch;
  const strictReversal = !!signal.strict_reversal_logic;
  const requireStructural = !!signal.require_structural_trend;
  const requireBreakout = !!signal.require_channel_break;

  const symbols = Array.isArray(analysis.symbols)
    ? analysis.symbols.map((s) => String(s).toUpperCase())
    : [];
  const hasCrypto = symbols.some(
    (sym) => (sym.startsWith("BTC") || sym.startsWith("ETH")) && sym.endsWith("USD")
  );

  const issues: GuardrailIssue[] = [];

  if (
    trendTf === "M15" &&
    entryTf === "M1" &&
    requireGrouping &&
    requirePullback &&
    requireSrTouch &&
    strictReversal &&
    requireStructural
  ) {
    issues.push({
      title: "Confluência excessiva no Scalper",
      detail:
        "M15/M1 com muitos filtros rígidos juntos tende a bloquear quase todos os sinais.",
    });
  }

  if (pullbackTolerance < breakoutBuffer) {
    issues.push({
      title: "Pullback menor que breakout",
      detail: "O reteste pode ficar mais curto que o rompimento exigido e travar entradas.",
    });
  }

  if (requireSrTouch && srTolerance < 10) {
    issues.push({
      title: "S/R muito apertado",
      detail: "Com FIM-008 ativo, tolerância abaixo de 10 costuma barrar setups válidos.",
    });
  }

  if (requireBreakout && breakoutBuffer > srTolerance) {
    issues.push({
      title: "Conflito FIM-007 x FIM-008",
      detail:
        "Breakout buffer maior que tolerância de S/R cria gatilhos contraditórios.",
    });
  }

  if (strictReversal && requireStructural && slopeMin > 1.5) {
    issues.push({
      title: "Slope muito alto",
      detail:
        "FIM-015 e FIM-016 com inclinação alta superfiltram e reduzem entradas de forma extrema.",
    });
  }

  if (hasCrypto && maxSpread < 20) {
    issues.push({
      title: "Spread baixo para cripto",
      detail: "BTC/ETH com spread máximo menor que 20 pode bloquear operação por custo.",
    });
  }

  return issues;
}

export default function EstrategiaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<SettingsPayload | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/settings`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.status === 401) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }
        const data = (await response.json()) as SettingsPayload;
        setSettings(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [router]);

  const summary = useMemo(() => {
    const analysis = settings?.analysis || {};
    const signal = settings?.signal_logic || {};
    const risk = settings?.risk_management || {};

    const trendTf = String(signal.trend_timeframe || "H1").toUpperCase();
    const entryTf = String(signal.entry_timeframe || "M15").toUpperCase();
    const tradingType = tradingTypeLabel(signal.trading_type);
    const symbols = Array.isArray(analysis.symbols) ? analysis.symbols : [];
    const abLookback = Number(analysis.ab_lookback_candles ?? 80);
    const trendCandles = Number(analysis.trend_candles ?? 200);
    const preset = channelPresetHint(abLookback, trendCandles);
    const guardrails = computeGuardrails(settings || {});

    const activeFilters = [
      signal.require_grouping ? "Agrupamento (FIM-006)" : "",
      signal.require_channel_break ? "Rompimento de canal (FIM-007)" : "",
      signal.require_sr_touch ? "Toque em S/R (FIM-008)" : "",
      signal.require_pullback_retest ? "Pullback (FIM-011)" : "",
      signal.strict_reversal_logic ? "Reversão rigorosa (FIM-015)" : "",
      signal.require_structural_trend ? "Tendência estrutural (FIM-016)" : "",
    ].filter(Boolean);

    return {
      trendTf,
      entryTf,
      tradingType,
      symbols,
      abLookback,
      trendCandles,
      preset,
      guardrails,
      activeFilters,
      riskPercent: Number(risk.risk_percent ?? 1),
      maxPositions: Number(risk.max_open_positions ?? 1),
      cooldown: Number(risk.symbol_cooldown_seconds ?? 300),
      cycleEnabled: !!risk.fimathe_cycle_enabled,
      cycleMode: String(risk.fimathe_management_mode || "standard"),
      beTrigger: Number(risk.fimathe_be_trigger_percent ?? 50),
      trailStep: Number(risk.fimathe_trail_step_percent ?? 100),
      breakoutBuffer: Number(signal.breakout_buffer_points ?? 10),
      pullbackTolerance: Number(signal.pullback_tolerance_points ?? 20),
      srTolerance: Number(signal.sr_tolerance_points ?? 35),
      spread: Number(signal.max_spread_points ?? 30),
      slope: Number(signal.trend_min_slope_points ?? 0.2),
    };
  }, [settings]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <BookOpenCheck className="w-5 h-5 text-primary" />
          <span className="text-primary text-[10px] font-black uppercase tracking-[0.2em]">
            Explicação para Leigo
          </span>
        </div>
        <h1 className="text-4xl font-black text-white tracking-tighter">
          COMO O ROBÔ VAI <span className="text-primary">OPERAR</span>
        </h1>
        <p className="text-gray-500 text-sm mt-1 max-w-3xl">
          Esta tela traduz sua configuração em português simples. Aqui você entende o comportamento
          do robô antes de colocar dinheiro em risco.
        </p>
      </div>

      <section className="glass p-8 rounded-[32px] border border-primary/20 bg-primary/5">
        <div className="flex items-start gap-3">
          <Route className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <h2 className="text-sm font-black tracking-widest uppercase text-white">
              Resumo Executivo
            </h2>
            <p className="text-sm text-gray-200 leading-relaxed mt-3">
              O robô está no perfil <b>{summary.tradingType}</b>, lendo tendência em <b>{summary.trendTf}</b> e
              buscando entrada em <b>{summary.entryTf}</b>. Ele monitora <b>{summary.symbols.length}</b> ativos
              ({summary.symbols.join(", ") || "nenhum ativo configurado"}), com janela de canal{" "}
              <b>{summary.preset}</b> ({summary.abLookback}/{summary.trendCandles} velas).
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="glass p-8 rounded-[32px] border border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <SlidersHorizontal className="w-4 h-4 text-secondary" />
            <h3 className="text-xs font-black uppercase tracking-widest text-white">Como a Entrada Acontece</h3>
          </div>
          <div className="space-y-3 text-sm text-gray-300 leading-relaxed">
            <p>
              1. O robô decide a direção no <b>{summary.trendTf}</b> para evitar operar contra o fluxo principal.
            </p>
            <p>
              2. No <b>{summary.entryTf}</b>, ele espera rompimento com buffer de <b>{summary.breakoutBuffer}</b> pontos.
            </p>
            <p>
              3. Se pullback estiver ativo, ele aceita reteste até <b>{summary.pullbackTolerance}</b> pontos.
            </p>
            <p>
              4. Se S/R estiver ativo, busca confluência com tolerância de <b>{summary.srTolerance}</b> pontos.
            </p>
            <p>
              5. Só executa se spread estiver até <b>{summary.spread}</b> e inclinação mínima em <b>{summary.slope}</b>.
            </p>
          </div>
        </section>

        <section className="glass p-8 rounded-[32px] border border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-black uppercase tracking-widest text-white">Como o Risco é Controlado</h3>
          </div>
          <div className="space-y-3 text-sm text-gray-300 leading-relaxed">
            <p>
              O risco por operação está em <b>{summary.riskPercent}%</b> (trava sistêmica até 3%).
            </p>
            <p>
              Máximo de posições simultâneas: <b>{summary.maxPositions}</b>.
            </p>
            <p>
              Cooldown entre ordens: <b>{summary.cooldown}</b> segundos.
            </p>
            <p>
              Ciclo Fimathe: <b>{summary.cycleEnabled ? "Ativo" : "Inativo"}</b>.
            </p>
            <p>
              Modo atual: <b>{summary.cycleMode}</b>, BE em <b>{summary.beTrigger}%</b>
              {summary.cycleMode === "infinity" ? `, passo de arraste ${summary.trailStep}%.` : "."}
            </p>
          </div>
        </section>
      </div>

      <section className="glass p-8 rounded-[32px] border border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <Radar className="w-4 h-4 text-accent" />
          <h3 className="text-xs font-black uppercase tracking-widest text-white">
            Filtros Ativos na Estratégia
          </h3>
        </div>
        {summary.activeFilters.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {summary.activeFilters.map((filterName) => (
              <span
                key={filterName}
                className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-white/5 border border-white/10 text-gray-200"
              >
                {filterName}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Nenhum filtro opcional ativo.</p>
        )}
      </section>

      <section
        className={`glass p-8 rounded-[32px] border ${
          summary.guardrails.length > 0 ? "border-red-500/30 bg-red-950/30" : "border-green-500/30 bg-green-950/20"
        }`}
      >
        <div className="flex items-center gap-2 mb-4">
          {summary.guardrails.length > 0 ? (
            <AlertTriangle className="w-4 h-4 text-red-300" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-green-300" />
          )}
          <h3 className="text-xs font-black uppercase tracking-widest text-white">Status de Coerência</h3>
        </div>
        {summary.guardrails.length > 0 ? (
          <div className="space-y-3">
            {summary.guardrails.map((issue) => (
              <div key={issue.title}>
                <p className="text-sm text-red-200 font-bold">{issue.title}</p>
                <p className="text-xs text-red-100">{issue.detail}</p>
              </div>
            ))}
            <p className="text-[11px] text-red-200 mt-2">
              Resultado: com esses conflitos o robô pode operar pouco ou quase nada.
            </p>
          </div>
        ) : (
          <p className="text-sm text-green-200">
            Configuração coerente. O robô está pronto para operar conforme a estratégia definida.
          </p>
        )}
      </section>

      <section className="glass p-8 rounded-[32px] border border-primary/20 bg-primary/5">
        <div className="flex items-center gap-2 mb-3">
          <RefreshCw className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-black uppercase tracking-widest text-white">Em palavras simples</h3>
        </div>
        <p className="text-sm text-gray-200 leading-relaxed">
          Pense que o robô funciona como um piloto com checklist: ele só decola quando tendência,
          gatilho, risco e custo da operação estão dentro do plano. Quando tudo bate, ele entra.
          Quando algo sai do padrão, ele espera e protege o capital.
        </p>
      </section>
    </div>
  );
}

