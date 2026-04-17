'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, LineStyle } from 'lightweight-charts';

interface OHLCData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface FimatheData {
  pointA?: number | null;
  pointB?: number | null;
  channelMid?: number | null;
  channelHigh?: number | null;
  channelLow?: number | null;
  target50?: number | null;
  target100?: number | null;
  sl?: number | null;
  tp?: number | null;
  trendDirection?: string | null;
  currentPrice?: number | null;
}

interface LiveChartProps {
  data: OHLCData[];
  fimathe?: FimatheData;
}

export default function LiveChart({ data, fimathe }: LiveChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  // Price lines refs
  const linesRef = useRef<{ [key: string]: any }>({});

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#00000000' },
        textColor: '#9CA3AF', // Gray 400
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      crosshair: {
        mode: 0, // Normal crosshair
        vertLine: {
          color: 'rgba(0, 255, 170, 0.5)',
          width: 1,
          style: LineStyle.Dashed,
        },
        horzLine: {
          color: 'rgba(0, 255, 170, 0.5)',
          width: 1,
          style: LineStyle.Dashed,
        },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        autoScale: true,
      },
      autoSize: true,
    });

    // Add candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#00FFAA',
      downColor: '#EF4444',
      borderVisible: false,
      wickUpColor: '#00FFAA',
      wickDownColor: '#EF4444',
    });

    candlestickSeries.setData(data as any);

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    // Cleanup on unmount
    return () => {
      chart.remove();
    };
  }, []); // Initialize only ONCE

  // Update chart data when data prop changes without remounting the canvas
  useEffect(() => {
    if (seriesRef.current && data && data.length > 0) {
      seriesRef.current.setData(data as any);
    }
  }, [data]);

  // Update Fimathe price lines dynamically
  useEffect(() => {
    if (!seriesRef.current || !fimathe) return;
    const series = seriesRef.current;

    const setupLine = (key: string, price: number | null | undefined, options: any) => {
      // Remove existing line if it exists
      if (linesRef.current[key]) {
        series.removePriceLine(linesRef.current[key]);
        delete linesRef.current[key];
      }
      
      // If price is valid, add the new line
      if (price !== null && price !== undefined && price > 0) {
        linesRef.current[key] = series.createPriceLine({
          price: price,
          ...options,
        });
      }
    };

    // Ponto A (Azul)
    setupLine('pointA', fimathe.pointA, {
      color: '#3B82F6', // Blue 500
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: 'Ponto-A',
    });

    // Ponto B / Protection (Vermelho ou Laranja)
    setupLine('pointB', fimathe.pointB, {
      color: '#F97316', // Orange 500
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: 'Ponto-B',
    });

    // Zona Neutra Estrutural (Meio exato do Canal Macro A e B)
    const midAB = (fimathe.pointA && fimathe.pointB) 
      ? (fimathe.pointA + fimathe.pointB) / 2 : null;

    setupLine('midAB', midAB, {
      color: '#9CA3AF', // Gray 400
      lineWidth: 1,
      lineStyle: LineStyle.Dotted,
      axisLabelVisible: true,
      title: 'Zona-Neutra (50%)',
    });

    // Simulated Entry, Stop, and TP (Virtual lines for education when NO position is open)
    let virtualEntry = null;
    let virtualStop = null;
    let virtualTp = null;
    
    if (!fimathe.sl && fimathe.pointA && fimathe.pointB && fimathe.trendDirection) {
      if (fimathe.trendDirection === 'BUY') {
        virtualEntry = fimathe.pointA;
        virtualStop = fimathe.pointB; // Stop goes below the Neutral Zone (Ponto B)
        virtualTp = fimathe.target100; // TP at Alvo 100%
      } else if (fimathe.trendDirection === 'SELL') {
        virtualEntry = fimathe.pointB;
        virtualStop = fimathe.pointA; // Stop goes above Neutral Zone (Ponto A)
        virtualTp = fimathe.target100; // TP at Alvo 100%
      }
    }

    // Linha Virtual de Entrada
    setupLine('virtualEntry', virtualEntry, {
      color: '#38BDF8', // Light Sky Blue for potential entry
      lineWidth: 1,
      lineStyle: LineStyle.SparseDotted,
      axisLabelVisible: true,
      title: 'Possível Entrada',
    });

    // Linha Virtual de Stop
    setupLine('virtualStop', virtualStop, {
      color: '#FB7185', // Rose 400 for potential stop
      lineWidth: 1,
      lineStyle: LineStyle.SparseDotted,
      axisLabelVisible: true,
      title: 'Possível Stop',
    });

    // Linha Virtual de Take Profit
    setupLine('virtualTp', virtualTp, {
      color: '#34D399', // Emerald 400 for potential take profit
      lineWidth: 1,
      lineStyle: LineStyle.SparseDotted,
      axisLabelVisible: true,
      title: 'Possível TP',
    });

    // Alvos Fimathe (Neon Green)
    setupLine('target50', fimathe.target50, {
      color: '#00FFAA',
      lineWidth: 1,
      lineStyle: LineStyle.Solid,
      axisLabelVisible: true,
      title: 'Alvo 50%',
    });
    
    setupLine('target100', fimathe.target100, {
      color: '#00FFAA',
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
      axisLabelVisible: true,
      title: 'Alvo 100%',
    });

    // Stop Loss ativo
    setupLine('sl', fimathe.sl, {
      color: '#EF4444', // Red 500
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
      axisLabelVisible: true,
      title: 'SL',
    });

    // Take Profit ativo
    setupLine('tp', fimathe.tp, {
      color: '#10B981', // Emerald 500
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
      axisLabelVisible: true,
      title: 'TP',
    });

  }, [fimathe]);

  return (
    <div 
      ref={chartContainerRef} 
      className="w-full h-full min-h-[400px] border border-white/5 rounded-2xl overflow-hidden glass"
    />
  );
}
