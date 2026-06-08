/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Product } from '../types';
import { Search, Filter, AlertCircle, Plus, X, Check, Pause, Play } from 'lucide-react';

interface StockProps {
  products: Product[];
  onAddProduct: (productData: { name: string; category: string; price: number; stock: number; minStock: number }, onSuccess?: () => void) => void;
  onToggleProductActive: (productId: string) => void;
}

export default function Stock({ products, onAddProduct, onToggleProductActive }: StockProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form states to add new products/plants
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formStock, setFormStock] = useState('0');
  const [formMinStock, setFormMinStock] = useState('5');

  // Obtain unique categories from the product list
  const categories = ['Todas', ...Array.from(new Set(products.map(p => p.category)))];

  // Filter products based on search term, category and state
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'Todas' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const resetForm = () => {
    setFormName('');
    setFormCategory('');
    setFormPrice('');
    setFormStock('0');
    setFormMinStock('5');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCategory.trim() || !formPrice) return;

    onAddProduct({
      name: formName.trim(),
      category: formCategory.trim(),
      price: parseFloat(formPrice),
      stock: parseInt(formStock || '0', 10),
      minStock: parseInt(formMinStock || '0', 10)
    }, () => {
      setIsFormOpen(false);
      resetForm();
    });
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto fade-in font-sans text-left">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-serif text-3xl font-medium text-brand-foreground tracking-tight">
            Produtos e Plantas
          </h1>
          <p className="text-xs text-brand-muted-foreground mt-1 font-sans">
            Gerencie o catálogo de plantas e flores, acompanhe os níveis de estoque e pause ou ative vendas de produtos.
          </p>
        </div>
        {!isFormOpen && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-semibold rounded-[6px] shadow-sm transition-all duration-150 cursor-pointer hover:translate-y-[-1px]"
          >
            <Plus size={14} />
            Cadastrar Novo Produto
          </button>
        )}
      </div>

      {/* Embedded sleek form to create news crops/plants */}
      {isFormOpen && (
        <div className="bg-brand-card border border-brand-border rounded-[6px] p-6 shadow-sm max-w-2xl text-left scale-in">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex justify-between items-center border-b border-brand-border/60 pb-3">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-foreground">
                  Novo Cadastro de Produto ou Planta
                </h2>
                <p className="text-[10px] text-brand-muted-foreground mt-0.5 font-sans">
                  Insira as especificações da planta para exibi-la imediatamente no catálogo de vendas.
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => {
                  setIsFormOpen(false);
                  resetForm();
                }} 
                className="p-1 text-brand-muted-foreground hover:text-brand-foreground cursor-pointer transition-colors"
                title="Fechar formulário"
              >
                <X size={15} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-brand-muted-foreground mb-1.5">
                  Nome do Produto / Planta *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Orquídea Cymbidium, Costela de Adão Variegata, Vaso de Cerâmica Terracota"
                  className="w-full bg-brand-bg/20 text-brand-foreground border border-brand-border rounded-[6px] px-3.5 py-2 text-xs focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/25 transition-all text-left placeholder:text-brand-muted-foreground/50"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-brand-muted-foreground mb-1.5">
                  Categoria *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    list="stock-categories-list"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="Selecione ou crie uma categoria..."
                    className="w-full bg-brand-bg/20 text-brand-foreground border border-brand-border rounded-[6px] px-3.5 py-2 text-xs focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/25 transition-all text-left"
                  />
                  <datalist id="stock-categories-list">
                    {Array.from(new Set(products.map(p => p.category))).map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-brand-muted-foreground mb-1.5">
                  Preço de Venda Unitário *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs text-brand-muted-foreground font-mono">
                    R$
                  </span>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0.01"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="0,00"
                    className="w-full bg-brand-bg/20 text-brand-foreground border border-brand-border rounded-[6px] pl-9 pr-3.5 py-2 text-xs focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/25 transition-all text-left font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-brand-muted-foreground mb-1.5">
                  Estoque Inicial
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formStock}
                  onChange={(e) => setFormStock(e.target.value)}
                  placeholder="0"
                  className="w-full bg-brand-bg/20 text-brand-foreground border border-brand-border rounded-[6px] px-3.5 py-2 text-xs focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/25 transition-all text-left font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-brand-muted-foreground mb-1.5">
                  Mínimo de Alerta (Crítico)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formMinStock}
                  onChange={(e) => setFormMinStock(e.target.value)}
                  placeholder="5"
                  className="w-full bg-brand-bg/20 text-brand-foreground border border-brand-border rounded-[6px] px-3.5 py-2 text-xs focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/25 transition-all text-left font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-brand-border/40">
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
                  resetForm();
                }}
                className="px-4.5 py-2 text-xs text-brand-muted-foreground hover:text-brand-foreground hover:bg-brand-muted/20 border border-brand-border rounded-[6px] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4.5 py-2 text-xs text-white bg-brand-primary hover:bg-brand-primary-hover font-semibold rounded-[6px] transition-colors cursor-pointer flex items-center gap-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
              >
                <Check size={14} /> Unidade de Planta
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter and Search Bar Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-brand-card p-4 border border-brand-border rounded-[6px] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        
        {/* Search input */}
        <div className="sm:col-span-2 relative">
          <Search className="absolute left-3.5 top-3 text-brand-muted-foreground" size={14} />
          <input
            type="text"
            placeholder="Qual planta ou flor deseja pesquisar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-brand-card text-brand-foreground border border-brand-border rounded-[6px] pl-10 pr-4 py-2.5 text-xs font-sans focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/25 transition-all text-left"
          />
        </div>

        {/* Category Choice */}
        <div className="relative">
          <Filter className="absolute left-3.5 top-3 text-brand-muted-foreground" size={14} />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-brand-card text-brand-foreground border border-brand-border rounded-[6px] pl-10 pr-4 py-2.5 text-xs font-sans focus:outline-none focus:border-brand-primary cursor-pointer appearance-none text-left"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* Products Table */}
      <div className="bg-brand-card border border-brand-border rounded-[6px] shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
        
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse text-left">
            <thead>
              <tr className="bg-brand-muted text-brand-muted-foreground border-b border-brand-border text-[10px] uppercase tracking-wider font-bold">
                <th className="px-6 py-4">Nome do Produto</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4 text-right">Estoque Atual</th>
                <th className="px-6 py-4 text-right">Mínimo Crítico</th>
                <th className="px-6 py-4 text-right">Preço Unitário</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            
            <tbody className="text-xs text-brand-foreground divide-y divide-brand-border/40 font-sans">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-brand-muted-foreground">
                    Nenhum produto cadastrado corresponde a esta pesquisa.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p, idx) => {
                  const isLowStock = p.stock < p.minStock;
                  const isActive = p.ativo !== false;
                  
                  // Row styling definitions
                  // Par: #FAF8F4, Ímpar: rgba(243, 241, 237, 0.3)
                  // Low stock rows: #f5ebe8
                  // Inactive/Paused rows: slightly dimmed and grey
                  let rowBg = idx % 2 === 0 ? 'bg-[#FAF8F4]' : 'bg-[rgba(243,241,237,0.3)]';
                  if (!isActive) {
                    rowBg = 'bg-brand-muted/20 opacity-60 transition-opacity duration-150 grayscale-[15%]';
                  } else if (isLowStock) {
                    rowBg = 'bg-brand-rose-light';
                  }

                  return (
                    <tr 
                      key={p.id}
                      className={`${rowBg} transition-all duration-150 hover:bg-black/[0.015]`}
                    >
                      {/* Name */}
                      <td className="px-6 py-4 font-medium font-sans">
                        <div className="flex flex-col text-left">
                          <span className={isActive ? 'text-brand-foreground' : 'text-brand-muted-foreground line-through'}>
                            {p.name}
                          </span>
                          {!isActive && (
                            <span className="text-[8px] text-brand-secondary font-semibold font-mono mt-0.5">
                              Exibição suspensa no caixa de vendas
                            </span>
                          )}
                          {isActive && isLowStock && (
                            <span className="text-[9px] text-brand-secondary font-semibold font-mono mt-0.5 flex items-center gap-1">
                              <AlertCircle size={10} />
                              Repor produto urgentemente
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4 text-brand-muted-foreground">
                        {p.category}
                      </td>

                      {/* Current Stock */}
                      <td className="px-6 py-4 text-right font-mono font-semibold">
                        {p.stock} un
                      </td>

                      {/* Minimum Stock */}
                      <td className="px-6 py-4 text-right font-mono text-brand-muted-foreground">
                        {p.minStock} un
                      </td>

                      {/* Unit Price */}
                      <td className="px-6 py-4 text-right font-mono font-medium">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.price)}
                      </td>

                      {/* Status indicator */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          {isActive ? (
                            <>
                              <span className="inline-block text-[8px] font-sans font-bold uppercase tracking-wider py-0.5 px-2 rounded-[3px] bg-brand-primary/15 text-brand-primary">
                                Ativo
                              </span>
                              <span 
                                className={`inline-block text-[8px] font-sans font-medium uppercase tracking-wider py-0.2 px-1.5 rounded-[2px] ${
                                  isLowStock 
                                    ? 'bg-brand-secondary/15 text-brand-secondary' 
                                    : 'bg-emerald-600/10 text-emerald-600'
                                }`}
                              >
                                {isLowStock ? 'Min Crítico' : 'Estoque OK'}
                              </span>
                            </>
                          ) : (
                            <span className="inline-block text-[8px] font-sans font-bold uppercase tracking-wider py-0.5 px-2 rounded-[3px] bg-brand-border text-brand-muted-foreground">
                              Pausado
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Play/Pause toggle action - NO delete button as requested */}
                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => onToggleProductActive(p.id)}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium rounded-[4px] transition-all duration-150 cursor-pointer ${
                            isActive 
                              ? 'text-brand-secondary hover:bg-brand-secondary/10 bg-brand-secondary/5 border border-brand-secondary/20 hover:scale-[1.02]' 
                              : 'text-brand-primary hover:bg-brand-primary/10 bg-brand-primary/5 border border-brand-primary/20 hover:scale-[1.02]'
                          }`}
                          title={isActive ? "Pausar vendas deste produto" : "Ativar vendas para o caixa"}
                        >
                          {isActive ? (
                            <>
                              <Pause size={12} />
                              Pausar
                            </>
                          ) : (
                            <>
                              <Play size={12} />
                              Ativar
                            </>
                          )}
                        </button>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Dynamic inventory statistics footer info */}
        <div className="p-4 bg-brand-muted/20 border-t border-brand-border flex flex-col sm:flex-row justify-between items-center text-[10px] uppercase tracking-wider text-brand-muted-foreground font-semibold gap-3">
          <div>
            Total de espécies cadastradas: <span className="text-brand-foreground font-mono font-bold">{filteredProducts.length}</span>
          </div>
          <div>
            Pausados no momento: <span className="text-brand-muted-foreground font-mono font-bold">{products.filter(p => p.ativo === false).length} itens</span>
          </div>
          <div>
            Estoque crítico ativo: <span className="text-brand-secondary font-mono font-bold">{products.filter(p => p.ativo !== false && p.stock < p.minStock).length} itens</span>
          </div>
        </div>

      </div>

    </div>
  );
}
