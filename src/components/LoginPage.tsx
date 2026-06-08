/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User } from '../types';

interface LoginPageProps {
  onLogin: (user: User) => void;
  defaultEmail?: string;
}

export default function LoginPage({ onLogin, defaultEmail = 'admin@gmail.com' }: LoginPageProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Por favor, informe seu e-mail.');
      return;
    }
    if (!password) {
      setError('Por favor, informe sua senha.');
      return;
    }
    
    setLoading(true);
    setError('');

    fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
      .then(res => {
        if (!res.ok) {
          return res.json().then(data => {
            throw new Error(data.error || 'Credenciais inválidas ou erro no servidor.');
          });
        }
        return res.json();
      })
      .then(data => {
        setLoading(false);
        if (data.success && data.user) {
          onLogin(data.user);
        } else {
          setError('Dados de autenticação inconsistentes.');
        }
      })
      .catch(err => {
        setLoading(false);
        setError(err.message || 'Erro ao conectar. O banco de dados pode estar indisponível.');
      });
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 bg-brand-bg overflow-hidden">
      {/* Subtle botanical line illustrations in the background (SVG based) */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.035] flex items-center justify-between px-12 md:px-32">
        {/* Branch 1 Left */}
        <svg width="400" height="600" viewBox="0 0 100 150" fill="none" stroke="#d4a5a5" strokeWidth="0.5" className="transform -rotate-12 select-none">
          <path d="M50,150 Q45,100 50,20 Q60,10 65,5" />
          <path d="M50,120 Q35,110 32,95" />
          <path d="M32,95 Q40,90 49,112" />
          <path d="M50,100 Q65,90 68,75" />
          <path d="M68,75 Q60,70 50,92" />
          <path d="M50,75 Q30,65 28,50" />
          <path d="M28,50 Q38,45 49,67" />
          <path d="M50,55 Q70,45 72,30" />
          <path d="M72,30 Q62,25 50,47" />
          {/* Detailed petal/leaves */}
          <path d="M32,95 C25,85 40,75 32,95" />
          <path d="M68,75 C75,65 60,55 68,75" />
          <path d="M28,50 C20,40 35,30 28,50" />
        </svg>

        {/* Branch 2 Right */}
        <svg width="350" height="550" viewBox="0 0 100 150" fill="none" stroke="#d4a5a5" strokeWidth="0.5" className="transform rotate-45 select-none">
          <path d="M10,150 Q40,110 50,30 Q55,10 62,0" />
          <path d="M25,120 Q48,112 50,100" />
          <path d="M50,100 Q30,95 23,80" />
          <path d="M23,80 Q40,82 48,93" />
          <path d="M37,85 Q60,75 62,60" />
          <path d="M62,60 Q45,55 36,78" />
          <path d="M45,55 Q20,45 18,30" />
          <path d="M18,30 Q35,35 44,48" />
        </svg>
      </div>

      <div className="relative w-full max-w-md fade-in">
        {/* Centered card with Florir Logo */}
        <div className="bg-brand-card border border-brand-border rounded-[6px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-10 text-center">
          
          <h1 className="font-serif text-4xl text-brand-foreground tracking-wide mb-2">
            Florir
          </h1>
          <p className="font-sans text-[11px] uppercase tracking-widest text-brand-muted-foreground mb-8">
            Sistema de Vendas &amp; Estoque
          </p>

          <form onSubmit={handleSubmit} className="space-y-6 text-left">
            {error && (
              <div className="p-3 bg-brand-rose-light text-brand-secondary border border-brand-secondary/25 rounded-[6px] text-xs font-sans">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-brand-muted-foreground mb-2 font-sans">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                className="w-full bg-brand-card text-brand-foreground border border-brand-border rounded-[6px] px-4 py-3 text-sm font-sans focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/25 transition-all"
                placeholder="exemplo@florir.com"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[11px] uppercase tracking-wider text-brand-muted-foreground font-sans">
                  Senha
                </label>
                <a href="#recuperar" className="text-[10px] uppercase tracking-wider text-brand-primary hover:underline font-sans">
                  Esqueceu?
                </a>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className="w-full bg-brand-card text-brand-foreground border border-brand-border rounded-[6px] px-4 py-3 text-sm font-sans focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/25 transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-brand-primary text-white font-sans text-xs uppercase tracking-widest py-3 px-4 rounded-[6px] cursor-pointer hover:bg-brand-primary/90 transition-all font-semibold"
            >
              Entrar no Sistema
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-brand-border/60">
            <p className="text-[11px] text-brand-muted-foreground font-sans">
              Flora-PDV &bull; Licença de Uso Premium Activa
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
