/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Product, SaleItem, PaymentMethod, Sale } from '../types';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash, 
  ShoppingBag, 
  CheckCircle,
  UserCheck, 
  UserPlus, 
  X 
} from 'lucide-react';
import { Language, getTranslations } from '../utils/translations';

interface Customer {
  id: number;
  nome: string;
  cpf?: string;
  email?: string;
  telefone?: string;
  ativo: boolean;
}

interface NewSaleProps {
  products: Product[];
  onAddSale: (sale: Sale) => void;
  currentLanguage?: Language;
}

export default function NewSale({ products, onAddSale, currentLanguage = 'pt' }: NewSaleProps) {
  const t = getTranslations(currentLanguage);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Pix');
  const [successMessage, setSuccessMessage] = useState('');

  // Customer identification states
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  // Fetch customers on load
  useEffect(() => {
    fetch('/api/config/customers')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCustomers(data.customers || []);
        }
      })
      .catch(err => console.error("Error loading customers for sales screen:", err));
  }, []);

  // Filter available products based on search term and active status
  const filteredProducts = products.filter(p => p.ativo !== false).filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Add item to cart
  const addToCart = (product: Product) => {
    setSuccessMessage('');
    
    // Check if product is out of stock in database
    const availableStock = product.stock;
    
    setCart(prevCart => {
      const existing = prevCart.find(item => item.productId === product.id);
      
      if (existing) {
        // Prevent adding more than available stock
        if (existing.quantity >= availableStock) {
          alert(`Estoque insuficiente! Apenas ${availableStock} unidades disponíveis no estoque.`);
          return prevCart;
        }
        return prevCart.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price }
            : item
        );
      } else {
        if (availableStock < 1) {
          alert('Este produto está totalmente sem estoque!');
          return prevCart;
        }
        return [...prevCart, {
          productId: product.id,
          name: product.name,
          quantity: 1,
          price: product.price,
          subtotal: product.price
        }];
      }
    });
  };

  // Adjust item quantity in cart
  const updateQuantity = (productId: string, delta: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.productId === productId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          
          // Check stock limit
          if (delta > 0 && newQty > product.stock) {
            alert(`Estoque insuficiente! Apenas ${product.stock} unidades disponíveis.`);
            return item;
          }
          
          return {
            ...item,
            quantity: newQty,
            subtotal: newQty * item.price
          };
        }
        return item;
      }).filter(Boolean) as SaleItem[];
    });
  };

  // Remove item from cart completely
  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.productId !== productId));
  };

  const totalCart = cart.reduce((sum, item) => sum + item.subtotal, 0);

  // Filter customers for search dropdown
  const filteredCustomers = customers.filter(c => {
    if (!customerSearch) return true;
    const term = customerSearch.toLowerCase();
    return (
      c.nome.toLowerCase().includes(term) ||
      (c.cpf && c.cpf.includes(term)) ||
      (c.telefone && c.telefone.includes(term))
    );
  });

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  // Finalize Sale handler
  const handleFinalize = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert('Seu carrinho está vazio.');
      return;
    }

    // Double check stock elements before final commit
    let stockValid = true;
    for (const item of cart) {
      const originalProduct = products.find(p => p.id === item.productId);
      if (!originalProduct || originalProduct.stock < item.quantity) {
        alert(`Falha ao registrar: '${item.name}' não possui mais as ${item.quantity} unidades em estoque.`);
        stockValid = false;
        break;
      }
    }

    if (!stockValid) return;

    const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

    // Build sale payload
    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      items: cart,
      paymentMethod,
      total: totalCart,
      date: new Date().toISOString(),
      clienteId: selectedCustomerId || undefined,
      clienteNome: selectedCustomer?.nome || undefined
    };

    // Commit
    onAddSale(newSale);
    
    // Success feedback
    setSuccessMessage(`Venda de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCart)} finalizada com sucesso!`);
    
    // Clear state
    setCart([]);
    setSelectedCustomerId(null);
    setCustomerSearch('');
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto fade-in font-sans">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-serif text-3xl font-medium text-brand-foreground tracking-tight">
            Nova Venda
          </h1>
          <p className="text-xs text-brand-muted-foreground mt-1 font-sans">
            Registre pedidos e processe pagamentos do PDV em tempo real.
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-[#e6f4ea] text-emerald-800 border border-emerald-500/20 rounded-[6px] text-sm flex items-center gap-3 font-sans animate-pulse">
          <CheckCircle size={18} className="text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        
        {/* Left Side: Product Catalogue (3 columns wide) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-4 top-3.5 text-brand-muted-foreground" size={16} />
            <input
              type="text"
              placeholder="Buscar flores e arranjos pelo nome ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-brand-card text-brand-foreground border border-brand-border rounded-[6px] pl-11 pr-4 py-3.5 text-xs font-sans focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/25 transition-all"
            />
          </div>

          {/* Product Cards Grid / Minimalist List */}
          <div className="bg-brand-card border border-brand-border rounded-[6px] shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="p-4 bg-brand-muted/40 border-b border-brand-border text-left">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-brand-muted-foreground font-sans">
                Flores &amp; Arranjos Cadastrados ({filteredProducts.length})
              </h3>
            </div>
            
            <ul className="divide-y divide-brand-border/60 text-left">
              {filteredProducts.length === 0 ? (
                <li className="p-8 text-center text-xs text-brand-muted-foreground font-sans">
                  Nenhum produto encontrado com este termo.
                </li>
              ) : (
                filteredProducts.map((product) => {
                  const isLowStock = product.stock <= 0;
                  const warningStock = product.stock < product.minStock;
                  
                  return (
                    <li 
                      key={product.id}
                      className={`p-4 sm:px-6 transition-colors flex items-center justify-between gap-4 font-sans ${
                        isLowStock ? 'bg-brand-muted/20 opacity-60' : 'hover:bg-brand-sidebar-accent/15'
                      }`}
                    >
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-semibold text-brand-primary tracking-wide block mb-0.5">
                          {product.category}
                        </span>
                        <h4 className="text-xs font-medium text-brand-foreground truncate">
                          {product.name}
                        </h4>
                        
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-semibold text-brand-foreground/90 font-mono">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                          </span>
                          <span className="text-[9px] text-brand-muted-foreground font-mono">&bull;</span>
                          <span className={`text-[9px] font-mono ${
                            isLowStock 
                              ? 'text-brand-secondary font-bold' 
                              : warningStock 
                                ? 'text-brand-secondary/90 font-semibold' 
                                : 'text-brand-muted-foreground'
                          }`}>
                            Estoque: {product.stock} un {warningStock && '(Crítico)'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => addToCart(product)}
                        disabled={isLowStock}
                        className={`flex items-center gap-1 bg-brand-primary text-white font-sans text-[11px] uppercase tracking-wider font-medium py-2 px-4 rounded-[4px] cursor-pointer hover:bg-brand-primary/90 transition-all ${
                          isLowStock ? 'bg-brand-muted/70 text-brand-muted-foreground cursor-not-allowed opacity-40' : ''
                        }`}
                      >
                        <Plus size={12} />
                        <span>Adicionar</span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        </div>

        {/* Right Side: Virtual Active Cart Pane (2 columns wide) */}
        <div className="lg:col-span-2">
          <div className="bg-brand-card border border-brand-border rounded-[6px] shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col min-h-[500px]">
            
            {/* Cart Header */}
            <div className="p-4 bg-brand-muted/30 border-b border-brand-border flex justify-between items-center">
              <div className="flex items-center gap-2 text-brand-foreground font-sans">
                <ShoppingBag size={15} className="text-brand-primary" />
                <h3 className="text-xs uppercase tracking-wider font-bold">
                  Carrinho Ativo
                </h3>
              </div>
              <span className="font-mono text-[10px] bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full font-bold">
                {cart.reduce((sum, item) => sum + item.quantity, 0)} itens
              </span>
            </div>

            {/* Cliente Identificado (Customer Selection Block) */}
            <div className="p-4 border-b border-brand-border/60 bg-brand-bg/15 relative">
              <label className="block text-[10px] uppercase tracking-wider font-semibold text-brand-muted-foreground mb-2 font-sans text-left">
                Cliente do Pedido
              </label>

              {selectedCustomer ? (
                <div className="flex items-center justify-between p-3 bg-brand-primary/5 border border-brand-primary/30 rounded-[6px] text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary border border-brand-primary/20 shrink-0">
                      <UserCheck size={14} />
                    </div>
                    <div className="min-w-0 text-left">
                      <div className="font-semibold text-brand-foreground truncate">{selectedCustomer.nome}</div>
                      <div className="text-[9px] text-brand-muted-foreground font-mono flex items-center gap-2 mt-0.5 whitespace-nowrap">
                        {selectedCustomer.cpf && <span>CPF: {selectedCustomer.cpf}</span>}
                        {selectedCustomer.telefone && <span>Tel: {selectedCustomer.telefone}</span>}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCustomerId(null);
                      setCustomerSearch('');
                    }}
                    className="p-1 text-brand-muted-foreground hover:text-brand-secondary transition-colors cursor-pointer shrink-0 ml-1"
                    title="Remover cliente"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative z-10">
                    <UserPlus size={14} className="absolute left-3 top-2.5 text-brand-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Selecionar cliente (nome, CPF ou tel...)"
                      value={customerSearch}
                      onFocus={() => setIsCustomerDropdownOpen(true)}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        setIsCustomerDropdownOpen(true);
                      }}
                      className="w-full bg-brand-card text-brand-foreground border border-brand-border rounded-[6px] pl-8.5 pr-8 py-2 text-xs font-sans focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/25 transition-all text-left"
                    />
                    {customerSearch && (
                      <button
                        type="button"
                        onClick={() => setCustomerSearch('')}
                        className="absolute right-3 top-2 text-brand-muted-foreground hover:text-brand-foreground cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  {/* Dropdown Popover */}
                  {isCustomerDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10 cursor-default" onClick={() => setIsCustomerDropdownOpen(false)} />
                      <div className="absolute left-0 right-0 z-20 mt-1.5 bg-brand-card border border-brand-border rounded-[6px] shadow-lg max-h-48 overflow-y-auto divide-y divide-brand-border/40">
                        {filteredCustomers.length === 0 ? (
                          <div className="p-3 text-center text-[11px] text-brand-muted-foreground">
                            Nenhum cliente encontrado.
                          </div>
                        ) : (
                          filteredCustomers.map(c => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setSelectedCustomerId(c.id);
                                setIsCustomerDropdownOpen(false);
                              }}
                              className="w-full text-left p-2.5 hover:bg-brand-primary/5 transition-colors flex flex-col cursor-pointer"
                            >
                              <span className="text-xs font-medium text-brand-foreground truncate">{c.nome}</span>
                              <div className="flex gap-2 text-[9px] text-brand-muted-foreground font-mono mt-0.5">
                                {c.cpf && <span>CPF: {c.cpf}</span>}
                                {c.telefone && <span>Tel: {c.telefone}</span>}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Cart items list */}
            <div className="flex-1 overflow-y-auto max-h-[300px]">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-brand-muted-foreground">
                  <ShoppingBag size={32} className="opacity-20 mb-3" />
                  <p className="text-xs font-sans">O carrinho de compras está vazio.</p>
                  <p className="text-[10px] text-brand-muted-foreground/80 mt-1 font-sans">Busque e adicione flores ao lado.</p>
                </div>
              ) : (
                <ul className="divide-y divide-brand-border/40 text-left">
                  {cart.map((item) => (
                    <li key={item.productId} className="p-4 flex flex-col sm:flex-row gap-3 sm:items-center justify-between text-left">
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-medium text-brand-foreground block truncate">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-brand-muted-foreground font-mono">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)} cada
                        </span>
                      </div>

                      {/* Quantity control */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border border-brand-border rounded-[4px] bg-brand-bg">
                          <button 
                            onClick={() => updateQuantity(item.productId, -1)}
                            className="p-1 px-2 hover:bg-brand-sidebar-accent cursor-pointer text-brand-muted-foreground transition-all"
                          >
                            <Minus size={10} />
                          </button>
                          <span className="text-xs font-semibold px-2 font-mono text-brand-foreground">
                            {item.quantity}
                          </span>
                          <button 
                            onClick={() => updateQuantity(item.productId, 1)}
                            className="p-1 px-2 hover:bg-brand-sidebar-accent cursor-pointer text-brand-muted-foreground transition-all"
                          >
                            <Plus size={10} />
                          </button>
                        </div>

                        {/* Subtotal */}
                        <span className="text-xs font-bold text-brand-foreground font-mono w-16 text-right">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.subtotal)}
                        </span>

                        {/* Remove */}
                        <button 
                          onClick={() => removeFromCart(item.productId)}
                          className="p-1 text-brand-muted-foreground hover:text-brand-secondary cursor-pointer transition-colors"
                        >
                          <Trash size={12} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Payment & Action box */}
            <div className="p-4 bg-brand-muted/20 border-t border-brand-border text-left mt-auto">
              
              <label className="block text-[10px] uppercase tracking-wider font-semibold text-brand-muted-foreground mb-2 font-sans">
                Forma de Pagamento
              </label>
              
              {/* Checkout payment option radio grid */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {(['Pix', 'Débito', 'Crédito', 'Dinheiro'] as PaymentMethod[]).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`p-2.5 rounded-[4px] text-[11px] font-sans font-medium uppercase tracking-wide border transition-all cursor-pointer text-center ${
                      paymentMethod === method 
                        ? 'bg-brand-primary/10 border-brand-primary text-brand-primary font-bold' 
                        : 'bg-brand-card border-brand-border text-brand-muted-foreground hover:bg-brand-sidebar-accent/50'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>

              {/* Total Summary */}
              <div className="py-3 border-t border-brand-border/60 flex justify-between items-center mb-4">
                <span className="text-xs uppercase tracking-wider font-semibold text-brand-muted-foreground font-sans">
                  Total da Venda
                </span>
                <span className="font-serif text-2xl font-bold text-brand-foreground font-mono">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCart)}
                </span>
              </div>

              {/* Action Button */}
              <button
                onClick={handleFinalize}
                disabled={cart.length === 0}
                className={`w-full bg-brand-primary text-white text-xs font-sans font-bold uppercase tracking-widest py-3.5 px-4 rounded-[6px] text-center cursor-pointer transition-all hover:bg-brand-primary/95 shadow-sm flex items-center justify-center gap-2 ${
                  cart.length === 0 ? 'bg-brand-muted text-brand-muted-foreground border-brand-border cursor-not-allowed hover:bg-brand-muted opacity-40' : ''
                }`}
              >
                Finalizar Venda
              </button>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
