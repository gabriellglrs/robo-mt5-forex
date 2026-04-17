'use client';

import { useEffect, useState } from 'react';
import { Settings, RefreshCw, ArrowLeft, Activity, Target, ShieldAlert, Crosshair } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import LiveChart from '@/components/LiveChart';

export default function AssetMonitorPage() {
  const params = useParams();
  const symbol = typeof params?.symbol === 'string' ? params.symbol.toUpperCase() : '';
  const [tf, setTf] = useState('M15');
  const [chartData, setChartData] = useState<any[]>([]);
  const [fimatheData, setFimatheData] = useState<any>({});
  const [snapshot, setSnapshot] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Fetch initial OHLC history
  useEffect(() => {
    let active = true;
    const fetchHistory = async () => {
      if (!symbol) return;
      
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${apiUrl}/api/chart/${symbol}?tf=${tf}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        
        if (!res.ok) {
          throw new Error('Falha ao carregar gráfico. Verifique o MetaTrader 5 e a conexão.');
        }
        const data = await res.json();
        if (active) {
          setChartData(data);
        }
      } catch (err: any) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchHistory();
    return () => { active = false; };
  }, [symbol, tf, apiUrl]);

  // Fetch Runtime for live lines
  useEffect(() => {
    if (!symbol) return;
    
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${apiUrl}/runtime`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!response.ok) return;
        const data = await response.json();
        setSnapshot(data);
        
        // Extract Fimathe config for this symbol
        const assetRuntime = data.symbols && data.symbols[symbol];
        if (assetRuntime) {
          setFimatheData({
            pointA: assetRuntime.point_a,
            pointB: assetRuntime.point_b,
            channelMid: assetRuntime.channel_mid,
            channelHigh: assetRuntime.channel_high,
            channelLow: assetRuntime.channel_low,
            target50: assetRuntime.projection_50,
            target100: assetRuntime.projection_100,
            sl: assetRuntime.sl,  // May be undefined if no position
            tp: assetRuntime.tp,  // May be undefined if no position
            trendDirection: assetRuntime.trend_direction,
            currentPrice: assetRuntime.price
          });

          // Inject current tick to the end of chartData to move the final candle
          if (assetRuntime.price) {
            const price = assetRuntime.price;
            setChartData(prevChartData => {
                if (prevChartData.length === 0) return prevChartData;
                const lastCandle = prevChartData[prevChartData.length - 1];
                const updated = [...prevChartData];
                // Simplify updating the current active candle high/low/close
                updated[updated.length - 1] = {
                  ...lastCandle,
                  close: price,
                  high: Math.max(lastCandle.high, price),
                  low: Math.min(lastCandle.low, price)
                };
                return updated;
            });
          }
        }
      } catch (error) {
         // silently ignore polling errors
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, [symbol, apiUrl]);

  const assetRuntime = snapshot?.symbols?.[symbol];
  const isRunning = snapshot?.status === 'running';

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1400px] mx-auto p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 glass p-6 rounded-[32px] border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -mr-32 -mt-32" />
        
        <div className="flex items-center gap-6 relative z-10">
          <Link href="/">
            <button className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors group">
              <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-white" />
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight text-white">{symbol}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${isRunning ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-red-500/20 text-red-500 border border-red-500/30'}`}>
                {isRunning ? 'AO VIVO' : 'OFFLINE'}
              </span>
            </div>
            <p className="text-gray-400 text-sm mt-1 uppercase tracking-widest font-bold">Terminal de Batalha (Live)</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-full border border-white/5 relative z-10">
          {['M1', 'M5', 'M15', 'H1'].map((timeframe) => (
            <button
              key={timeframe}
              onClick={() => setTf(timeframe)}
              className={`px-4 py-2 rounded-full text-xs font-black transition-all ${tf === timeframe ? 'bg-white/10 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {timeframe}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        
        {/* Gráfico Gigante */}
        <div className="xl:col-span-3 glass rounded-[40px] border border-white/5 p-4 md:p-8 flex flex-col h-[700px] relative overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" /> Ação do Preço ({tf})
            </h2>
            <div className="text-right">
              <p className="text-2xl font-black text-white">{assetRuntime?.price?.toFixed(5) || '0.00000'}</p>
              <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Preço Atual</p>
            </div>
          </div>
          
          <div className="flex-1 w-full bg-black/50 rounded-2xl border border-white/5 relative">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : error ? (
              <div className="absolute inset-0 flex items-center justify-center flex-col gap-4 p-8 text-center">
                <ShieldAlert className="w-12 h-12 text-red-500" />
                <p className="text-red-400 font-bold">{error}</p>
              </div>
            ) : (
              <LiveChart data={chartData} fimathe={fimatheData} />
            )}
          </div>
        </div>

        {/* Sidebar Fimathe / Caixa Preta */}
        <div className="xl:col-span-1 flex flex-col gap-8">
          
          <div className="glass p-8 rounded-[40px] border border-white/5 relative overflow-hidden flex-1">
             <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/5">
                <Target className="w-6 h-6 text-primary" />
                <h3 className="text-lg font-black text-white uppercase tracking-tight">Decisão Fimathe</h3>
             </div>
             
             <div className="space-y-6">
                <div>
                   <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-2">Ponto A</p>
                   <p className="font-mono text-lg text-blue-400 font-bold">{fimatheData?.pointA?.toFixed(5) || '--'}</p>
                </div>
                <div>
                   <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-2">Ponto B / Proteção</p>
                   <p className="font-mono text-lg text-orange-400 font-bold">{fimatheData?.pointB?.toFixed(5) || '--'}</p>
                </div>
                <div className="pt-6 border-t border-white/5">
                   <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-2">Alvos (TP)</p>
                   <p className="font-mono text-2xl text-primary font-black animate-pulse shadow-primary/20 drop-shadow-lg">{fimatheData?.target100?.toFixed(5) || '--'}</p>
                </div>
             </div>
          </div>

          <div className="glass p-8 rounded-[40px] border border-white/5 bg-gradient-to-b from-transparent to-red-500/5">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/5">
                <Crosshair className="w-6 h-6 text-red-400" />
                <h3 className="text-lg font-black text-white uppercase tracking-tight">Posição Live</h3>
             </div>
             <div className="space-y-4">
               <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-1">Stop Loss Ativo</p>
                  <p className="font-mono text-xl text-red-500 font-bold">{fimatheData?.sl?.toFixed(5) || '---'}</p>
               </div>
               <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-xs text-gray-300 font-bold">PNL Flutuante</p>
                  <p className={`text-2xl font-black mt-1 ${assetRuntime?.current_pnl > 0 ? 'text-primary' : assetRuntime?.current_pnl < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                    ${assetRuntime?.current_pnl?.toFixed(2) || '0.00'}
                  </p>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
