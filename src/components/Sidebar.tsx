/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  ShoppingBag, 
  Layers, 
  PlusCircle, 
  BarChart3, 
  TrendingUp, 
  LogOut,
  User as UserIcon,
  Settings
} from 'lucide-react';
import { User } from '../types';
import { Language, getTranslations } from '../utils/translations';

export type ActiveTab = 'new-sale' | 'stock' | 'stock-entry' | 'dashboard' | 'statistics' | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  user: User;
  onLogout: () => void;
  dbStatus?: 'connecting' | 'online' | 'fallback';
  currentLanguage: Language;
}

export default function Sidebar({ activeTab, onTabChange, user, onLogout, dbStatus, currentLanguage }: SidebarProps) {
  const t = getTranslations(currentLanguage);

  const menuItems = [
    { id: 'new-sale' as ActiveTab, label: t.new_sale, icon: ShoppingBag },
    { id: 'stock' as ActiveTab, label: t.stock, icon: Layers },
    { id: 'stock-entry' as ActiveTab, label: t.stock_entry, icon: PlusCircle },
    { id: 'dashboard' as ActiveTab, label: t.dashboard, icon: BarChart3 },
    { id: 'statistics' as ActiveTab, label: t.statistics, icon: TrendingUp },
    { id: 'settings' as ActiveTab, label: t.settings, icon: Settings },
  ];

  return (
    <aside className="w-64 bg-brand-bg border-r border-brand-border/65 flex flex-col h-screen sticky top-0 font-sans z-20">
      {/* Brand Logo Header */}
      <div className="p-8 border-b border-brand-border/50 text-center flex flex-col items-center">
        <h2 className="font-serif text-3xl tracking-wider text-brand-foreground">
          {t.sidebar_title}
        </h2>
        <p className="text-[10px] uppercase tracking-[0.2em] text-brand-muted-foreground mt-1 text-center">
          {t.sidebar_subtitle}
        </p>

        {/* Supabase connection badge status */}
        <div className="mt-3.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-muted/30 border border-brand-border/40 text-[9px] font-mono tracking-wider">
          {dbStatus === 'connecting' && (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-brand-muted-foreground uppercase text-[8px]">{t.supabase_connecting}</span>
            </>
          )}
          {dbStatus === 'online' && (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-700 font-bold uppercase text-[8px]">{t.supabase_connected}</span>
            </>
          )}
          {dbStatus === 'fallback' && (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span className="text-amber-800 font-bold uppercase text-[8px]">{t.supabase_fallback}</span>
            </>
          )}
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-[6px] text-xs uppercase tracking-wider font-medium transition-all text-left cursor-pointer ${
                isActive
                  ? 'bg-brand-primary text-white border-l-4 border-brand-secondary shadow-[0_1px_3px_rgba(0,0,0,0.04)] font-semibold'
                  : 'text-brand-muted-foreground hover:bg-brand-sidebar-accent hover:text-brand-foreground'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-white' : 'text-brand-muted-foreground'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Info & Logout Segment */}
      <div className="p-4 border-t border-brand-border/50 space-y-3 bg-brand-muted/20">
        <div className="flex items-center gap-3 px-2 py-1.5">
          <div className="w-8 h-8 rounded-full bg-brand-primary/15 flex items-center justify-center text-brand-primary border border-brand-primary/20">
            <UserIcon size={14} />
          </div>
          <div className="overflow-hidden">
            <h4 className="text-xs font-semibold text-brand-foreground truncate">
              {user.name}
            </h4>
            <p className="text-[10px] text-brand-muted-foreground truncate font-mono">
              {user.role}
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-[6px] text-xs uppercase tracking-wider font-semibold text-brand-secondary hover:bg-brand-rose-light hover:text-brand-secondary transition-all cursor-pointer"
        >
          <LogOut size={16} />
          <span>{t.logout}</span>
        </button>
      </div>
    </aside>
  );
}
