/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Product, StockEntry } from '../types';
import { CheckCircle, ArrowDownCircle } from 'lucide-react';

interface StockEntryProps {
  products: Product[];
  onAddEntry: (entry: StockEntry) => void;
}

export default function StockEntryScreen({ products, onAddEntry }: StockEntryProps) {
  // Form fields
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [employee, setEmployee] = useState('');
  const [observations, setObservations] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dropdown options
  const sortedProducts = [...products].sort((a, b) => a.name.localeCompare(b.name));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');
    setError('');

    // Field audits
    if (!productId) {
      setError('Selecione o produto de destino.');
      return;
    }
    const qtyNum = parseInt(quantity, 10);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      setError('Por favor, defina uma quantidade de entrada maior que zero.');
      return;
    }
    if (!employee.trim()) {
      setError('Insira o nome do funcionário responsável pela conferência.');
      return;
    }

    const selectedProduct = products.find(p => p.id === productId);
    if (!selectedProduct) {
      setError('O produto selecionado não foi localizado.');
      return;
    }

    const costNum = costPrice ? parseFloat(costPrice) : undefined;
    if (costNum !== undefined && (isNaN(costNum) || costNum < 0)) {
      setError('Preço de custo deve ser um número positivo.');
      return;
    }

    // Assemble new database logging entry
    const newEntry: StockEntry = {
      id: `entry-${Date.now()}`,
      productId,
      productName: selectedProduct.name,
      quantity: qtyNum,
      costPrice: costNum,
      employee: employee.trim(),
      date: new Date().toISOString(),
      observations: observations.trim() || undefined
    };

    // Upstream update triggers
    onAddEntry(newEntry);

    // Prompt user on successful registration
    setSuccess(`Abastecimento concluído! Foram adicionadas ${qtyNum} unidades ao estoque de '${selectedProduct.name}'.`);
    
    // Clear state
    setProductId('');
    setQuantity('');
    setCostPrice('');
    setEmployee('');
    setObservations('');
  };

  return (
    <div className="p-8 space-y-8 max-w-2xl mx-auto fade-in font-sans text-left">
      
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-medium text-brand-foreground tracking-tight">
          Entrada de Mercadoria
        </h1>
        <p className="text-xs text-brand-muted-foreground mt-1 font-sans">
          Registre a chegada de lote de flores e incremente a disponibilidade no estoque de vendas.
        </p>
      </div>

      {/* Success banner */}
      {success && (
        <div className="p-4 bg-[#e6f4ea] text-emerald-800 border border-emerald-500/25 rounded-[6px] text-xs flex items-center gap-3 font-sans">
          <CheckCircle size={16} className="text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="p-4 bg-brand-rose-light text-brand-secondary border border-brand-secondary/25 rounded-[6px] text-xs font-sans">
          {error}
        </div>
      )}

      {/* Single-column Minimalist Form Layout */}
      <div className="bg-brand-card border border-brand-border rounded-[6px] shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-8">
        
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Target Product Dropping Selector */}
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-brand-muted-foreground font-semibold mb-2 font-sans">
              Produto Recebido *
            </label>
            <select
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value);
                setError('');
              }}
              className="w-full bg-brand-card text-brand-foreground border border-brand-border rounded-[6px] px-4 py-3 text-xs font-sans focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/25 cursor-pointer"
            >
              <option value="">-- Escolha um produto floral cadastrado --</option>
              {sortedProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} [{p.category}] (Estoque: {p.stock} un)
                </option>
              ))}
            </select>
          </div>

          {/* Grid of Quantity and Cost */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Quantity received input */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-brand-muted-foreground font-semibold mb-2 font-sans">
                Quantidade Recebida *
              </label>
              <input
                type="number"
                min="1"
                placeholder="Exemplo: 12"
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  setError('');
                }}
                className="w-full bg-brand-card text-brand-foreground border border-brand-border rounded-[6px] px-4 py-3 text-xs font-sans focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/25"
                required
              />
            </div>

            {/* Cost price input (optional) */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-brand-muted-foreground font-semibold mb-2 font-sans">
                Preço de Custo Unitário (R$ - Opcional)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Exemplo: 45.00"
                value={costPrice}
                onChange={(e) => {
                  setCostPrice(e.target.value);
                  setError('');
                }}
                className="w-full bg-brand-card text-brand-foreground border border-brand-border rounded-[6px] px-4 py-3 text-xs font-sans focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/25"
              />
            </div>

          </div>

          {/* Employee responsible input */}
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-brand-muted-foreground font-semibold mb-2 font-sans">
              Funcionário Responsável *
            </label>
            <input
              type="text"
              placeholder="Digite o nome de quem está conferindo o lote..."
              value={employee}
              onChange={(e) => {
                setEmployee(e.target.value);
                setError('');
              }}
              className="w-full bg-brand-card text-brand-foreground border border-brand-border rounded-[6px] px-4 py-3 text-xs font-sans focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/25"
              required
            />
          </div>

          {/* Observations and detailed logs */}
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-brand-muted-foreground font-semibold mb-2 font-sans">
              Observações do Abastecimento
            </label>
            <textarea
              rows={4}
              placeholder="Informações sobre conservação, fornecedor ou integridade do lote de flores..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              className="w-full bg-brand-card text-brand-foreground border border-brand-border rounded-[6px] px-4 py-3 text-xs font-sans focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/25 resize-none"
            />
          </div>

          {/* Form triggering confirmation button */}
          <button
            type="submit"
            className="w-full bg-brand-primary text-white text-xs font-sans font-bold uppercase tracking-widest py-3.5 px-4 rounded-[6px] text-center cursor-pointer transition-all hover:bg-brand-primary/95 flex items-center justify-center gap-2"
          >
            <ArrowDownCircle size={14} />
            <span>Confirmar Entrada</span>
          </button>

        </form>

      </div>

    </div>
  );
}
