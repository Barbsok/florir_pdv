/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Product, Sale, StockEntry, LowStockProduct } from './types';

import LoginPage from './components/LoginPage';
import Sidebar, { ActiveTab } from './components/Sidebar';
import Dashboard from './components/Dashboard';
import NewSale from './components/NewSale';
import Stock from './components/Stock';
import StockEntryScreen from './components/StockEntry';
import Statistics from './components/Statistics';
import Settings from './components/Settings';
import { Language } from './utils/translations';

const SESSION_KEY = 'florir_user_session';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  
  // System configurations language state
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('florir_lang');
    return (saved === 'en' || saved === 'es' || saved === 'pt') ? (saved as Language) : 'pt';
  });

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    localStorage.setItem('florir_lang', newLang);
  };

  // Business state variables
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [entries, setEntries] = useState<StockEntry[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [dbStatus, setDbStatus] = useState<'connecting' | 'online' | 'fallback'>('connecting');

  // Load state on startup
  useEffect(() => {
    // 1. Session load
    const storedUser = localStorage.getItem(SESSION_KEY);
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // 2. Load florist business state from full-stack system APIs
    fetch('/api/bootstrap')
      .then(res => res.json())
      .then(data => {
        setProducts(data.products || []);
        setSales(data.sales || []);
        setEntries(data.stockEntries || []);
        setLowStockProducts(data.lowStockProducts || []);
        setDbStatus(data.usingFallback ? 'fallback' : 'online');
      })
      .catch(err => {
        console.error("API bootstrap loading failed, using in-memory state:", err);
        setDbStatus('fallback');
      });
  }, []);

  // Auth actions
  const handleLogin = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
    setActiveTab('dashboard');
  };

  // Business logic: Add complex sale transaction & update SQL state
  const handleAddSale = (newSale: Sale) => {
    fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sale: newSale, employeeEmail: user?.email })
    })
      .then(res => {
        if (!res.ok) {
          return res.json().then(data => {
            throw new Error(data.error || "Server rejected sale transaction");
          });
        }
        return res.json();
      })
      .then(data => {
        if (data.success) {
          setProducts(data.products);
          setSales(data.sales);
          setLowStockProducts(data.lowStockProducts || []);
          if (data.usingFallback !== undefined) {
            setDbStatus(data.usingFallback ? 'fallback' : 'online');
          }
        }
      })
      .catch(err => {
        console.error("Failed to commit sale transaction:", err);
        alert(err.message || "Ocorreu um erro ao salvar a venda! Por favor, tente novamente.");
      });
  };

  // Business logic: Register stock replenishments and sync SQL state
  const handleAddStockEntry = (newEntry: StockEntry) => {
    fetch('/api/stock-entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entry: newEntry, employeeEmail: user?.email })
    })
      .then(res => {
        if (!res.ok) throw new Error("Server rejected stock entry replenishment");
        return res.json();
      })
      .then(data => {
        if (data.success) {
          setProducts(data.products);
          setEntries(data.stockEntries);
          setLowStockProducts(data.lowStockProducts || []);
          if (data.usingFallback !== undefined) {
            setDbStatus(data.usingFallback ? 'fallback' : 'online');
          }
        }
      })
      .catch(err => {
        console.error("Failed to register stock entry:", err);
        alert("Ocorreu um erro ao registrar o abastecimento!");
      });
  };

  // Business logic: Create a new product and sync state
  const handleAddProduct = (productData: { name: string; category: string; price: number; stock: number; minStock: number }, onSuccess?: () => void) => {
    fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    })
      .then(res => {
        if (!res.ok) {
          return res.json().then(data => {
            throw new Error(data.error || "Server error while creating product");
          });
        }
        return res.json();
      })
      .then(data => {
        if (data.success) {
          setProducts(data.products);
          if (onSuccess) onSuccess();
        }
      })
      .catch(err => {
        console.error("Failed to create product:", err);
        alert(err.message || "Ocorreu um erro ao cadastrar o produto!");
      });
  };

  // Business logic: Toggle product active status (pause / unpause)
  const handleToggleProductActive = (productId: string) => {
    fetch(`/api/products/${productId}/toggle-active`, {
      method: 'PUT'
    })
      .then(res => {
        if (!res.ok) throw new Error("Server error toggling active state");
        return res.json();
      })
      .then(data => {
        if (data.success) {
          setProducts(data.products);
        }
      })
      .catch(err => {
        console.error("Failed to toggle product state:", err);
        alert("Ocorreu um erro ao alterar o status do produto!");
      });
  };

  // If user is currently unauthenticated, enforce LoginPage display
  if (!user) {
    return (
      <LoginPage 
        onLogin={handleLogin} 
        defaultEmail="efraimwss@gmail.com"
      />
    );
  }

  // Render Page Content conditionally
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            products={products}
            sales={sales}
            lowStockProducts={lowStockProducts}
            onNavigate={setActiveTab}
          />
        );
      case 'new-sale':
        return (
          <NewSale 
            products={products} 
            onAddSale={handleAddSale} 
            currentLanguage={language}
          />
        );
      case 'stock':
        return (
          <Stock 
            products={products} 
            onAddProduct={handleAddProduct}
            onToggleProductActive={handleToggleProductActive}
          />
        );
      case 'stock-entry':
        return (
          <StockEntryScreen 
            products={products} 
            onAddEntry={handleAddStockEntry} 
          />
        );
      case 'statistics':
        return (
          <Statistics 
            products={products} 
            sales={sales} 
            onNavigate={setActiveTab}
          />
        );
      case 'settings':
        return (
          <Settings 
            currentLanguage={language} 
            onLanguageChange={handleLanguageChange} 
            user={user} 
          />
        );
      default:
        return (
          <div className="p-8 text-center text-xs text-brand-muted-foreground font-sans">
            Módulo em desenvolvimento.
          </div>
        );
    }
  };

  return (
    <div className="flex bg-brand-bg min-h-screen relative font-sans text-brand-foreground antialiased select-none">
      
      {/* 256px Fixed Left Navigation Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        user={user} 
        onLogout={handleLogout}
        dbStatus={dbStatus} 
        currentLanguage={language}
      />

      {/* Main Panel Content Window */}
      <main className="flex-1 min-h-screen overflow-y-auto">
        {renderTabContent()}
      </main>

    </div>
  );
}
