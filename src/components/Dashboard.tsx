/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Product, Sale, LowStockProduct } from '../types';
import { TrendingUp, AlertTriangle, Clock, Award, PackageX } from 'lucide-react';

interface DashboardProps {
  products: Product[];
  sales: Sale[];
  lowStockProducts: LowStockProduct[];
  onNavigate: (tab: 'new-sale' | 'stock' | 'stock-entry' | 'dashboard' | 'statistics') => void;
}

export default function Dashboard({ products, sales, lowStockProducts, onNavigate }: DashboardProps) {
  // 1. Calculate metrics dynamically
  const todayStr = new Date().toISOString().split('T')[0];
  
  const salesToday = sales.filter(s => {
    return s.date.startsWith(todayStr);
  });
  
  const totalSalesTodaySum = salesToday.reduce((sum, s) => sum + s.total, 0);

  // Last sale details
  const sortedSales = [...sales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const lastSale = sortedSales[0];

  // Best selling product
  const productQuantities: Record<string, { name: string; qty: number }> = {};
  sales.forEach(s => {
    s.items.forEach(item => {
      if (!productQuantities[item.productId]) {
        productQuantities[item.productId] = { name: item.name, qty: 0 };
      }
      productQuantities[item.productId].qty += item.quantity;
    });
  });

  let bestSellingName = 'Nenhum item';
  let bestSellingQty = 0;
  Object.values(productQuantities).forEach(p => {
    if (p.qty > bestSellingQty) {
      bestSellingQty = p.qty;
      bestSellingName = p.name;
    }
  });

  // 2. Process last 7 days sales for the line chart
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  const chartData = last7Days.map(date => {
    const dateStr = date.toISOString().split('T')[0];
    const dailyAmount = sales
      .filter(s => s.date.startsWith(dateStr))
      .reduce((sum, s) => sum + s.total, 0);

    const formatter = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: 'numeric' });
    return {
      label: formatter.format(date),
      amount: dailyAmount,
      rawDate: dateStr
    };
  });

  // Calculate coordinates for custom SVG chart
  const maxAmount = Math.max(...chartData.map(d => d.amount), 500); // minimum scale limit
  const chartHeight = 220;
  const chartWidth = 560;
  const padding = 40;

  const points = chartData.map((d, i) => {
    const x = padding + (i / 6) * (chartWidth - padding * 2);
    // Invert Y coordinate so 0 is at bottom
    const y = chartHeight - padding - (d.amount / maxAmount) * (chartHeight - padding * 2);
    return { x, y, amount: d.amount, label: d.label };
  });

  // Create SVG path string
  let linePath = '';
  if (points.length > 0) {
    linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      // Smooth curve calculation or simple lines
      linePath += ` L ${points[i].x} ${points[i].y}`;
    }
  }

  // Create filled SVG path string
  let fillPath = '';
  if (points.length > 0) {
    fillPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight - padding} L ${points[0].x} ${chartHeight - padding} Z`;
  }

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto fade-in font-sans">
      
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-medium text-brand-foreground tracking-tight">
          Visão Geral
        </h1>
        <p className="text-xs text-brand-muted-foreground mt-1 font-sans">
          Resumo diário da floricultura e estado de operação.
        </p>
      </div>

      {/* Primary Metrics Section (4 Summary Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Total Sales Today */}
        <div className="bg-brand-card border border-brand-border rounded-[6px] shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-6 flex flex-col justify-between min-h-[140px] transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
          <div className="flex justify-between items-start text-brand-muted-foreground">
            <span className="text-[11px] uppercase tracking-wider font-semibold font-sans">Vendas Hoje</span>
            <TrendingUp size={16} className="text-brand-primary" />
          </div>
          <div className="mt-4">
            <span className="font-serif text-3xl font-medium text-brand-foreground">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalSalesTodaySum)}
            </span>
            <p className="text-[10px] text-brand-muted-foreground mt-2">
              {salesToday.length} transações registradas hoje
            </p>
          </div>
        </div>

        {/* Card 2: Products Low on Stock (PINK ALERT) */}
        <div 
          onClick={() => onNavigate('stock')}
          className="bg-brand-rose-light border border-brand-secondary/30 rounded-[6px] p-6 flex flex-col justify-between min-h-[140px] cursor-pointer hover:bg-[#f6e2df] transition-all shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
        >
          <div className="flex justify-between items-start text-brand-secondary">
            <span className="text-[11px] uppercase tracking-wider font-semibold font-sans">Produtos em Falta</span>
            <AlertTriangle size={16} className="text-brand-secondary" />
          </div>
          <div className="mt-4">
            <span className="font-serif text-3xl font-medium text-brand-secondary">
              {lowStockProducts.length}
            </span>
            <p className="text-[10px] text-brand-secondary/80 mt-2 font-medium">
              Clique para repor produtos em nível crítico
            </p>
          </div>
        </div>

        {/* Card 3: Last Sale */}
        <div className="bg-brand-card border border-brand-border rounded-[6px] shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-6 flex flex-col justify-between min-h-[140px] transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
          <div className="flex justify-between items-start text-brand-muted-foreground">
            <span className="text-[11px] uppercase tracking-wider font-semibold font-sans">Última Venda</span>
            <Clock size={16} className="text-brand-muted-foreground/80" />
          </div>
          <div className="mt-4">
            <span className="font-serif text-2xl font-medium text-brand-foreground truncate block">
              {lastSale 
                ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lastSale.total)
                : 'R$ 0,00'
              }
            </span>
            <p className="text-[10px] text-brand-muted-foreground mt-2 truncate">
              {lastSale 
                ? `Método: ${lastSale.paymentMethod} • ${new Date(lastSale.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                : 'Nenhuma venda registrada'
              }
            </p>
          </div>
        </div>

        {/* Card 4: Best Seller */}
        <div className="bg-brand-card border border-brand-border rounded-[6px] shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-6 flex flex-col justify-between min-h-[140px] transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
          <div className="flex justify-between items-start text-brand-muted-foreground">
            <span className="text-[11px] uppercase tracking-wider font-semibold font-sans">Destaque de Vendas</span>
            <Award size={16} className="text-brand-primary" />
          </div>
          <div className="mt-4">
            <span className="font-serif text-lg font-medium text-brand-foreground block leading-tight truncate">
              {bestSellingName}
            </span>
            <p className="text-[10px] text-brand-muted-foreground mt-2">
              {bestSellingQty > 0 ? `${bestSellingQty} unidades comercializadas` : 'Nenhuma unidade vendida'}
            </p>
          </div>
        </div>

      </div>

      {/* Replenishment Alerts */}
      {lowStockProducts.length > 0 && (
        <div className="bg-brand-rose-light border border-brand-secondary/30 rounded-[6px] p-6">
          <div className="flex items-center gap-2 mb-4">
            <PackageX size={16} className="text-brand-secondary" />
            <h3 className="font-serif text-lg font-normal text-brand-secondary">
              Alerta de Reposição
            </h3>
            <span className="ml-auto text-[10px] uppercase tracking-wider font-semibold text-brand-secondary/70 font-sans">
              {lowStockProducts.length} produto{lowStockProducts.length !== 1 ? 's' : ''} abaixo do mínimo
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {lowStockProducts.map(p => (
              <div
                key={p.idproduto}
                onClick={() => onNavigate('stock-entry')}
                className="bg-white/60 border border-brand-secondary/20 rounded-[4px] px-4 py-3 cursor-pointer hover:bg-white/90 transition-all"
              >
                <p className="text-xs font-semibold text-brand-foreground truncate">{p.nome}</p>
                <p className="text-[10px] text-brand-muted-foreground mt-0.5">{p.categoria}</p>
                <div className="flex items-end justify-between mt-2">
                  <div>
                    <p className="text-[10px] text-brand-secondary/80 font-sans">Atual: <span className="font-semibold">{p.estoqueatual}</span></p>
                    <p className="text-[10px] text-brand-secondary/80 font-sans">Mínimo: <span className="font-semibold">{p.estoqueminimo}</span></p>
                  </div>
                  <span className="text-[11px] font-bold font-mono text-brand-secondary">
                    -{p.quantidadefaltante}un
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Area & 7 Days Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Chart Column (2 cols wide on large screens) */}
        <div className="lg:col-span-2 bg-brand-card border border-brand-border rounded-[6px] shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div>
              <h3 className="font-serif text-xl font-normal text-brand-foreground text-left">
                Faturamento nos Últimos 7 Dias
              </h3>
              <p className="text-xs text-brand-muted-foreground mt-1 text-left">
                Indicadores de receita comercial incremental diária.
              </p>
            </div>
            
            {/* Legend */}
            <div className="flex gap-4 text-[10px] font-sans uppercase tracking-wider text-brand-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-primary"></span>
                <span>Receita (R$)</span>
              </div>
            </div>
          </div>

          {/* SVG Custom Line Chart */}
          <div className="relative w-full overflow-x-auto">
            <svg 
              viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
              className="w-full min-w-[500px]"
            >
              {/* Grid Lines */}
              {Array.from({ length: 4 }).map((_, i) => {
                const y = padding + (i / 3) * (chartHeight - padding * 2);
                const value = Math.round(maxAmount - (i / 3) * maxAmount);
                return (
                  <g key={i}>
                    <line 
                      x1={padding} 
                      y1={y} 
                      x2={chartWidth - padding} 
                      y2={y} 
                      stroke="rgba(0, 0, 0, 0.05)" 
                      strokeWidth="1" 
                    />
                    <text 
                      x={padding - 10} 
                      y={y + 4} 
                      className="font-mono text-[9px] fill-brand-muted-foreground"
                      textAnchor="end"
                    >
                      {value}
                    </text>
                  </g>
                );
              })}

              {/* Chart area fill (dusty rose/sec filled area with low opacity) */}
              {fillPath && (
                <path 
                  d={fillPath} 
                  fill="url(#chartGradient)" 
                  opacity="0.15" 
                />
              )}

              {/* Grid Gradient */}
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d4a5a5" />
                  <stop offset="100%" stopColor="#FAF8F4" />
                </linearGradient>
              </defs>

              {/* Line path */}
              {linePath && (
                <path 
                  d={linePath} 
                  fill="none" 
                  stroke="#7a9b8e" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
              )}

              {/* Dots & Interactivity */}
              {points.map((p, i) => (
                <g 
                  key={i} 
                  onMouseEnter={() => setHoveredIndex(i)} 
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="cursor-pointer"
                >
                  <circle 
                    cx={p.x} 
                    cy={p.y} 
                    r={hoveredIndex === i ? 6 : 4} 
                    fill={hoveredIndex === i ? '#d4a5a5' : '#7a9b8e'} 
                    stroke="#FFFEFB" 
                    strokeWidth="1.5" 
                    transition="all 0.15s"
                  />
                  {/* Outer glow ring */}
                  {hoveredIndex === i && (
                    <circle 
                      cx={p.x} 
                      cy={p.y} 
                      r={10} 
                      fill="none" 
                      stroke="#d4a5a5" 
                      strokeWidth="1" 
                      opacity="0.4"
                    />
                  )}
                  {/* Date labels on bottom */}
                  <text 
                    x={p.x} 
                    y={chartHeight - 15} 
                    className="font-sans text-[9px] fill-brand-muted-foreground tracking-tight"
                    textAnchor="middle"
                  >
                    {p.label}
                  </text>
                </g>
              ))}

              {/* Tooltip implementation inside SVG */}
              {hoveredIndex !== null && (
                <g transform={`translate(${points[hoveredIndex].x < chartWidth / 2 ? points[hoveredIndex].x + 15 : points[hoveredIndex].x - 115}, ${points[hoveredIndex].y - 20})`}>
                  <rect 
                    width="100" 
                    height="32" 
                    rx="3" 
                    fill="#FFFEFB" 
                    stroke="rgba(0, 0, 0, 0.08)" 
                    strokeWidth="1" 
                    className="filter drop-shadow-sm"
                  />
                  <text x="8" y="14" className="font-sans text-[8px] uppercase tracking-wider fill-brand-muted-foreground font-semibold">
                    {chartData[hoveredIndex].rawDate}
                  </text>
                  <text x="8" y="24" className="font-mono text-[10px] fill-brand-foreground font-bold">
                    R$ {chartData[hoveredIndex].amount.toFixed(2)}
                  </text>
                </g>
              )}
            </svg>
          </div>
        </div>

        {/* Sidebar Mini Help / Activities section */}
        <div className="bg-brand-card border border-brand-border rounded-[6px] shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-8">
          <h3 className="font-serif text-xl font-normal text-brand-foreground mb-6 text-left">
            Histórico Recente
          </h3>
          <div className="flow-root text-left">
            <ul className="-mb-8">
              {sortedSales.slice(0, 5).map((sale, idx) => (
                <li key={sale.id}>
                  <div className="relative pb-8">
                    {idx !== 4 && (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-brand-border" aria-hidden="true" />
                    )}
                    <div className="relative flex space-x-3 text-left">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center text-xs">
                          {sale.paymentMethod.substring(0, 2)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 pt-1.5">
                        <p className="text-xs text-brand-foreground font-sans font-medium">
                          Venda de{' '}
                          <span className="font-mono font-semibold text-brand-primary">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.total)}
                          </span>
                        </p>
                        <div className="text-[10px] text-brand-muted-foreground font-sans mt-0.5">
                          {sale.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                        </div>
                        <div className="text-[10px] text-brand-muted-foreground font-sans mt-1">
                          {new Date(sale.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} &bull; {new Date(sale.date).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>

    </div>
  );
}
