/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Product, Sale } from '../types';
import { TrendingUp, AlertTriangle, ArrowRight, Layers } from 'lucide-react';

interface StatisticsProps {
  products: Product[];
  sales: Sale[];
  onNavigate: (tab: 'new-sale' | 'stock' | 'stock-entry' | 'dashboard' | 'statistics') => void;
}

export default function Statistics({ products, sales, onNavigate }: StatisticsProps) {
  // --- 1. Total revenue this month ---
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  const monthlySales = sales.filter(s => {
    const d = new Date(s.date);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });

  const totalMonthlyRevenue = monthlySales.reduce((sum, s) => sum + s.total, 0);

  // --- 2. Products below minimum stock threshold ---
  const belowMinStock = products.filter(p => p.stock < p.minStock);

  // --- 3. Top 5 Best-Selling Products for a horizontal bar chart ---
  const productSalesMap: Record<string, { id: string; name: string; category: string; qty: number; totalRev: number }> = {};
  
  // Make sure all products are represented so if no sales exist they show at 0
  products.forEach(p => {
    productSalesMap[p.id] = { id: p.id, name: p.name, category: p.category, qty: 0, totalRev: 0 };
  });

  sales.forEach(s => {
    s.items.forEach(item => {
      if (productSalesMap[item.productId]) {
        productSalesMap[item.productId].qty += item.quantity;
        productSalesMap[item.productId].totalRev += item.subtotal;
      }
    });
  });

  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const maxBestSellerQty = Math.max(...topProducts.map(p => p.qty), 1);

  // --- 4. Daily Sales Over the Last 30 Days (for 30-day Line Chart) ---
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d;
  });

  const daily30ChartData = last30Days.map(date => {
    const dateStr = date.toISOString().split('T')[0];
    const dailyAmount = sales
      .filter(s => s.date.startsWith(dateStr))
      .reduce((sum, s) => sum + s.total, 0);

    return {
      dateLabel: `${date.getDate()}/${date.getMonth() + 1}`,
      rawDate: dateStr,
      amount: dailyAmount
    };
  });

  // Calculate coordinates for 30-day SVG Line Chart
  const lineWidth = 640;
  const lineHeight = 240;
  const paddingX = 40;
  const paddingY = 45;

  const max30DayAmount = Math.max(...daily30ChartData.map(d => d.amount), 500);

  const points30 = daily30ChartData.map((d, i) => {
    const x = paddingX + (i / 29) * (lineWidth - paddingX * 2);
    const y = lineHeight - paddingY - (d.amount / max30DayAmount) * (lineHeight - paddingY * 2);
    return { x, y, amount: d.amount, label: d.dateLabel, rawDate: d.rawDate };
  });

  let path30Str = '';
  if (points30.length > 0) {
    path30Str = `M ${points30[0].x} ${points30[0].y}`;
    for (let i = 1; i < points30.length; i++) {
      path30Str += ` L ${points30[i].x} ${points30[i].y}`;
    }
  }

  let fill30Str = '';
  if (points30.length > 0) {
    fill30Str = `${path30Str} L ${points30[points30.length - 1].x} ${lineHeight - paddingY} L ${points30[0].x} ${lineHeight - paddingY} Z`;
  }

  const [hovered30Idx, setHovered30Idx] = useState<number | null>(null);

  // Month formatting helper (Portuguese)
  const currentMonthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(now);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto fade-in font-sans text-left">
      
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-medium text-brand-foreground tracking-tight">
          Painel de Estatísticas
        </h1>
        <p className="text-xs text-brand-muted-foreground mt-1 font-sans">
          Análise comercial profunda da atividade comercial da floricultura.
        </p>
      </div>

      {/* Monthly Finance Summary and Stock Danger Box */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Metric 1: Monthly Total Revenue */}
        <div className="md:col-span-1 bg-brand-card border border-brand-border rounded-[6px] shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-6">
          <span className="text-[10px] uppercase font-bold tracking-wider text-brand-muted-foreground block font-sans">
            Faturamento Mensal
          </span>
          <span className="text-[11px] uppercase tracking-wider text-brand-primary block font-medium mt-1">
            Mês de {currentMonthLabel}
          </span>
          
          <div className="mt-6">
            <span className="font-serif text-4xl font-medium text-brand-foreground">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalMonthlyRevenue)}
            </span>
            <p className="text-[10px] text-brand-muted-foreground mt-3 font-sans">
              Base de {monthlySales.length} transações comerciais no faturamento atual.
            </p>
          </div>
        </div>

        {/* Metric 2: Inventory low warning list representation (Col Span 2) */}
        <div className="md:col-span-2 bg-brand-rose-light border border-brand-secondary/35 rounded-[6px] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-brand-secondary mb-3">
              <span className="text-[10px] uppercase font-bold tracking-wider font-sans">Alerta: Níveis de Estoque Abaixo do Mínimo</span>
              <AlertTriangle size={15} />
            </div>
            
            {belowMinStock.length === 0 ? (
              <p className="text-xs text-brand-secondary/80 font-sans p-2">
                Excelente! Todas as suas flores de estoque estão no patamar saudável recomendado.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[80px] overflow-y-auto pr-2">
                {belowMinStock.map((p) => (
                  <div 
                    key={p.id} 
                    className="bg-[#FFFEFB] border border-brand-secondary/20 p-2 rounded-[4px] flex justify-between items-center text-[11px]"
                  >
                    <span className="font-medium text-brand-foreground truncate max-w-[140px]">{p.name}</span>
                    <span className="font-mono text-brand-secondary font-bold">
                      {p.stock} / {p.minStock} un
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-brand-secondary/15 flex justify-between items-center">
            <p className="text-[10px] text-brand-secondary/80 font-medium">
              Há {belowMinStock.length} produtos necessitando reposição urgente
            </p>
            <button 
              onClick={() => onNavigate('stock-entry')}
              className="text-[10px] uppercase tracking-wider font-bold text-brand-secondary hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Repor agora</span>
              <ArrowRight size={10} />
            </button>
          </div>
        </div>

      </div>

      {/* Main Charts area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: 30 Days Line Chart (Takes 2 span) */}
        <div className="lg:col-span-2 bg-brand-card border border-brand-border rounded-[6px] shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-8">
          <div>
            <h3 className="font-serif text-xl font-normal text-brand-foreground">Faturamento Comercial Diário (Últimos 30 Dias)</h3>
            <p className="text-xs text-brand-muted-foreground mt-1">Navegue pelas coordenadas e visualize os picos sazonais de transações.</p>
          </div>

          {/* SVG 30 Day Line Chart */}
          <div className="relative mt-8 w-full overflow-x-auto">
            <svg 
              viewBox={`0 0 ${lineWidth} ${lineHeight}`} 
              className="w-full min-w-[550px]"
            >
              {/* Grid Horizontal Indicators */}
              {Array.from({ length: 4 }).map((_, i) => {
                const y = paddingY + (i / 3) * (lineHeight - paddingY * 2);
                const val = Math.round(max30DayAmount - (i / 3) * max30DayAmount);
                return (
                  <g key={i}>
                    <line 
                      x1={paddingX} 
                      y1={y} 
                      x2={lineWidth - paddingX} 
                      y2={y} 
                      stroke="rgba(0, 0, 0, 0.04)" 
                      strokeWidth="1" 
                    />
                    <text 
                      x={paddingX - 10} 
                      y={y + 3} 
                      className="font-mono text-[8px] fill-brand-muted-foreground"
                      textAnchor="end"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Area path fill */}
              {fill30Str && (
                <path 
                  d={fill30Str} 
                  fill="url(#gradient30)" 
                  opacity="0.12" 
                />
              )}

              {/* Graph definition */}
              <defs>
                <linearGradient id="gradient30" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7a9b8e" />
                  <stop offset="100%" stopColor="#FAF8F4" />
                </linearGradient>
              </defs>

              {/* Main Line */}
              {path30Str && (
                <path 
                  d={path30Str} 
                  fill="none" 
                  stroke="#7a9b8e" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
              )}

              {/* Coordinates hover dots mapping list */}
              {points30.map((p, i) => {
                const isHovered = hovered30Idx === i;
                const showLabel = i === 0 || i === 7 || i === 14 || i === 21 || i === 29;
                
                return (
                  <g 
                    key={i} 
                    onMouseEnter={() => setHovered30Idx(i)} 
                    onMouseLeave={() => setHovered30Idx(null)}
                    className="cursor-pointer"
                  >
                    <circle 
                      cx={p.x} 
                      cy={p.y} 
                      r={isHovered ? 5 : 2} 
                      fill={isHovered ? '#d4a5a5' : '#7a9b8e'} 
                      stroke="#FFFEFB" 
                      strokeWidth={isHovered ? 1.5 : 0.5} 
                    />
                    
                    {/* Tick date labeling selectively */}
                    {showLabel && (
                      <text 
                        x={p.x} 
                        y={lineHeight - 15} 
                        className="font-sans text-[8px] fill-brand-muted-foreground"
                        textAnchor="middle"
                      >
                        {p.label}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Detailed float coordinates pointer indicator */}
              {hovered30Idx !== null && (
                <g transform={`translate(${points30[hovered30Idx].x < lineWidth / 2 ? points30[hovered30Idx].x + 12 : points30[hovered30Idx].x - 112}, ${points30[hovered30Idx].y - 20})`}>
                  <rect 
                    width="100" 
                    height="32" 
                    rx="3" 
                    fill="#FFFEFB" 
                    stroke="rgba(0, 0, 0, 0.08)" 
                    strokeWidth="1" 
                  />
                  <text x="8" y="14" className="font-sans text-[8px] uppercase tracking-wider fill-brand-muted-foreground font-semibold">
                    {daily30ChartData[hovered30Idx].rawDate}
                  </text>
                  <text x="8" y="24" className="font-mono text-[9px] fill-brand-foreground font-bold">
                    R$ {daily30ChartData[hovered30Idx].amount.toFixed(2)}
                  </text>
                </g>
              )}
            </svg>
          </div>
        </div>

        {/* Right Col: Top 5 Best Sellers Bar Chart (Takes 1 span) */}
        <div className="bg-brand-card border border-brand-border rounded-[6px] shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-8">
          <div>
            <h3 className="font-serif text-xl font-normal text-brand-foreground mb-1">
              Top 5 Mais Vendidos
            </h3>
            <p className="text-xs text-brand-muted-foreground mb-6">
              Distribuição por unidades de plantas vendidas no PDV.
            </p>
          </div>

          <div className="space-y-5">
            {topProducts.map((p, idx) => {
              const percentage = p.qty > 0 ? (p.qty / maxBestSellerQty) * 100 : 0;
              
              return (
                <div key={p.id} className="space-y-1.5 text-left">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-brand-foreground truncate max-w-[150px]">
                      {idx + 1}. {p.name}
                    </span>
                    <span className="font-mono font-bold text-brand-primary">
                      {p.qty} un
                    </span>
                  </div>
                  
                  {/* Gray background track bar */}
                  <div className="w-full bg-brand-muted h-2 rounded-[2px] overflow-hidden">
                    {/* Primary Sage Fill */}
                    <div 
                      className="bg-brand-primary h-full rounded-[2px] transition-all duration-500 ease-out" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between text-[9px] text-brand-muted-foreground font-semibold uppercase tracking-wider font-sans">
                    <span>{p.category}</span>
                    <span>Total: R$ {p.totalRev.toFixed(0)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
