/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Globe, 
  FileText, 
  UserCheck, 
  Mail, 
  Lock, 
  Briefcase, 
  Phone, 
  CheckCircle, 
  Smartphone, 
  Search,
  Tag,
  Eye,
  EyeOff
} from 'lucide-react';
import { Language, getTranslations } from '../utils/translations';

interface SettingsProps {
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  user: {
    name: string;
    email: string;
    role: string;
  };
}

interface PosUser {
  id: number;
  nome: string;
  email: string;
  cargo: string;
  ativo: boolean;
}

interface Customer {
  id: number;
  nome: string;
  cpf?: string;
  email?: string;
  telefone?: string;
  ativo: boolean;
  datacriacao?: string;
}

export default function Settings({ currentLanguage, onLanguageChange, user }: SettingsProps) {
  const t = getTranslations(currentLanguage);
  
  // Navigation tabs
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'customers' | 'language'>('users');

  // Business States
  const [usersList, setUsersList] = useState<PosUser[]>([]);
  const [customersList, setCustomersList] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form states: New POS User
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'vendedor' | 'administrador' | 'caixa'>('vendedor');
  const [newUserActive, setNewUserActive] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Form states: New Customer
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerCpf, setNewCustomerCpf] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

  // Searches
  const [searchUserTerm, setSearchUserTerm] = useState('');
  const [searchCustomerTerm, setSearchCustomerTerm] = useState('');

  // Fetch lists on mount or subtab switch
  useEffect(() => {
    fetchLists();
  }, [activeSubTab]);

  const fetchLists = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      if (activeSubTab === 'users') {
        const res = await fetch('/api/config/users');
        const data = await res.json();
        if (data.success) {
          setUsersList(data.users || []);
        } else {
          setErrorMsg(data.error || 'Erro ao carregar usuários');
        }
      } else if (activeSubTab === 'customers') {
        const res = await fetch('/api/config/customers');
        const data = await res.json();
        if (data.success) {
          setCustomersList(data.customers || []);
        } else {
          setErrorMsg(data.error || 'Erro ao carregar clientes');
        }
      }
    } catch (err) {
      console.error('Fetch settings lists error:', err);
      setErrorMsg('Não foi possível conectar com o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!newUserName || !newUserEmail || !newUserPassword) {
      setErrorMsg('Por favor, preencha todos os campos.');
      return;
    }

    try {
      const res = await fetch('/api/config/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: newUserName,
          email: newUserEmail,
          senha: newUserPassword,
          cargo: newUserRole,
          ativo: newUserActive
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(t.success_created_user);
        // Reset form
        setNewUserName('');
        setNewUserEmail('');
        setNewUserPassword('');
        setNewUserRole('vendedor');
        setNewUserActive(true);
        // Refresh list
        fetchLists();
      } else {
        setErrorMsg(data.error || 'Erro ao cadastrar funcionário.');
      }
    } catch (err) {
      console.error('Create user error:', err);
      setErrorMsg('Erro de conexão ao salvar funcionário.');
    }
  };

  // Submit Customer
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!newCustomerName) {
      setErrorMsg('O nome do cliente é obrigatório.');
      return;
    }

    try {
      const res = await fetch('/api/config/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: newCustomerName,
          cpf: newCustomerCpf,
          email: newCustomerEmail,
          telefone: newCustomerPhone,
          ativo: true
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(t.success_created_cust);
        // Reset form
        setNewCustomerName('');
        setNewCustomerCpf('');
        setNewCustomerEmail('');
        setNewCustomerPhone('');
        // Refresh list
        fetchLists();
      } else {
        setErrorMsg(data.error || 'Erro ao cadastrar cliente.');
      }
    } catch (err) {
      console.error('Create customer error:', err);
      setErrorMsg('Erro de conexão ao salvar cliente.');
    }
  };

  const handleToggleUserActive = async (id: number) => {
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch(`/api/config/users/${id}/toggle-active`, {
        method: 'PUT'
      });
      const data = await res.json();
      if (data.success) {
        setUsersList(data.users || []);
        setSuccessMsg('Status do funcionário atualizado com sucesso!');
      } else {
        setErrorMsg(data.error || 'Erro ao alterar status do funcionário');
      }
    } catch (err) {
      console.error('Toggle user active error:', err);
      setErrorMsg('Erro de conexão ao alterar status do funcionário.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleCustomerActive = async (id: number) => {
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch(`/api/config/customers/${id}/toggle-active`, {
        method: 'PUT'
      });
      const data = await res.json();
      if (data.success) {
        setCustomersList(data.customers || []);
        setSuccessMsg('Status do cliente atualizado com sucesso!');
      } else {
        setErrorMsg(data.error || 'Erro ao alterar status do cliente');
      }
    } catch (err) {
      console.error('Toggle customer active error:', err);
      setErrorMsg('Erro de conexão ao alterar status do cliente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLanguageUpdate = (lang: Language) => {
    onLanguageChange(lang);
    setSuccessMsg(getTranslations(lang).success_language_changed);
  };

  // Filters
  const filteredUsers = usersList.filter(u => 
    u.nome.toLowerCase().includes(searchUserTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchUserTerm.toLowerCase()) ||
    u.cargo.toLowerCase().includes(searchUserTerm.toLowerCase())
  );

  const filteredCustomers = customersList.filter(c => 
    c.nome.toLowerCase().includes(searchCustomerTerm.toLowerCase()) || 
    (c.email && c.email.toLowerCase().includes(searchCustomerTerm.toLowerCase())) ||
    (c.cpf && c.cpf.includes(searchCustomerTerm)) ||
    (c.telefone && c.telefone.includes(searchCustomerTerm))
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 fade-in">
      
      {/* Header Block */}
      <div className="border-b border-brand-border pb-6">
        <h1 className="font-serif text-4xl tracking-tight text-brand-foreground">
          {t.settings_title}
        </h1>
        <p className="text-brand-muted-foreground text-sm mt-1">
          {t.settings_subtitle}
        </p>
      </div>

      {/* Subtab Buttons */}
      <div className="flex border-b border-brand-border/40 gap-6">
        <button
          onClick={() => { setActiveSubTab('users'); setSuccessMsg(''); setErrorMsg(''); }}
          className={`pb-4 px-1 text-xs uppercase tracking-wider font-semibold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'users'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-brand-muted-foreground hover:text-brand-foreground'
          }`}
        >
          <Users size={15} />
          {t.tab_users}
        </button>
        <button
          onClick={() => { setActiveSubTab('customers'); setSuccessMsg(''); setErrorMsg(''); }}
          className={`pb-4 px-1 text-xs uppercase tracking-wider font-semibold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'customers'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-brand-muted-foreground hover:text-brand-foreground'
          }`}
        >
          <UserPlus size={15} />
          {t.tab_customers}
        </button>
        <button
          onClick={() => { setActiveSubTab('language'); setSuccessMsg(''); setErrorMsg(''); }}
          className={`pb-4 px-1 text-xs uppercase tracking-wider font-semibold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'language'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-brand-muted-foreground hover:text-brand-foreground'
          }`}
        >
          <Globe size={15} />
          {t.tab_language}
        </button>
      </div>

      {/* Operation Toasts */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200/80 rounded-[8px] p-4 text-emerald-800 text-xs flex items-center gap-2.5 shadow-sm">
          <CheckCircle size={16} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200/80 rounded-[8px] p-4 text-rose-800 text-xs flex items-center gap-2.5 shadow-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 animate-pulse" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Body grids */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* SUBTAB: POS ACCESS USERS */}
        {activeSubTab === 'users' && (
          <>
            {/* User register Form */}
            <div className="lg:col-span-5 bg-brand-card border border-brand-border/60 rounded-[12px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-6">
              <div className="flex items-center gap-3 border-b border-brand-border/50 pb-4">
                <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary border border-brand-primary/20">
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-brand-foreground">{t.users_title}</h3>
                  <p className="text-[11px] text-brand-muted-foreground">Registre novos perfis administrativos ou operacionais.</p>
                </div>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-brand-muted-foreground flex items-center gap-1">
                    <UserCheck size={11} /> {t.form_user_name} *
                  </label>
                  <input
                    type="text"
                    required
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="Ex: Amanda Rezende"
                    className="w-full bg-brand-bg/45 border border-brand-border/80 rounded-[8px] px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary transition-all text-brand-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-brand-muted-foreground flex items-center gap-1">
                    <Mail size={11} /> {t.form_user_email} *
                  </label>
                  <input
                    type="email"
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="nome@floricultura.com"
                    className="w-full bg-brand-bg/45 border border-brand-border/80 rounded-[8px] px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary transition-all text-brand-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-brand-muted-foreground flex items-center gap-1">
                    <Lock size={11} /> {t.form_user_password} *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      placeholder="****"
                      className="w-full bg-brand-bg/45 border border-brand-border/80 rounded-[8px] pl-3.5 pr-10 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary transition-all text-brand-foreground"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-2.5 text-brand-muted-foreground hover:text-brand-foreground"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-brand-muted-foreground flex items-center gap-1">
                    <Briefcase size={11} /> {t.form_user_role} *
                  </label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as any)}
                    className="w-full bg-brand-bg/45 border border-brand-border/80 rounded-[8px] px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary transition-all text-brand-foreground"
                  >
                    <option value="vendedor">{t.role_seller}</option>
                    <option value="caixa">{t.role_cashier}</option>
                    <option value="administrador">{t.role_admin}</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    id="checkbox-active"
                    checked={newUserActive}
                    onChange={(e) => setNewUserActive(e.target.checked)}
                    className="rounded border-brand-border text-brand-primary focus:ring-brand-primary/40 cursor-pointer"
                  />
                  <label htmlFor="checkbox-active" className="text-xs text-brand-foreground font-medium cursor-pointer">
                    {t.form_user_status}
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-brand-primary text-white text-xs uppercase tracking-wider font-semibold py-3 px-4 rounded-[8px] transition-all hover:bg-brand-primary/90 focus:ring-2 focus:ring-brand-primary-light active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? t.loading : t.btn_add_user}
                </button>
              </form>
            </div>

            {/* User list */}
            <div className="lg:col-span-7 bg-brand-card border border-brand-border/60 rounded-[12px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-brand-border/50 pb-4">
                <div>
                  <h3 className="text-sm font-semibold text-brand-foreground">{t.user_list}</h3>
                  <p className="text-[11px] text-brand-muted-foreground">Funcionários registrados no banco de dados.</p>
                </div>
                {/* Search */}
                <div className="relative max-w-xs">
                  <Search size={14} className="absolute left-3.5 top-2.5 text-brand-muted-foreground" />
                  <input
                    type="text"
                    placeholder={t.placeholder_search}
                    value={searchUserTerm}
                    onChange={(e) => setSearchUserTerm(e.target.value)}
                    className="bg-brand-bg/40 border border-brand-border/60 rounded-[8px] pl-9 pr-3.5 py-1.5 text-xs text-brand-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary/30 w-full"
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="py-12 text-center text-xs text-brand-muted-foreground font-mono">
                  {t.loading}
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="py-12 text-center text-xs text-brand-muted-foreground font-sans">
                  Nenhum funcionário encontrado.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-brand-border/40 text-[10px] uppercase text-brand-muted-foreground tracking-wider font-semibold">
                        <th className="py-3 px-2">ID</th>
                        <th className="py-3 px-2">Funcionário</th>
                        <th className="py-3 px-2">Cargo</th>
                        <th className="py-3 px-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border/30">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-brand-bg/20 transition-all font-sans">
                          <td className="py-3.5 px-2 font-mono text-[10px] text-brand-muted-foreground">
                            #{u.id}
                          </td>
                          <td className="py-3.5 px-2">
                            <div className="font-semibold text-brand-foreground">{u.nome}</div>
                            <div className="text-[10px] text-brand-muted-foreground font-mono">{u.email}</div>
                          </td>
                          <td className="py-3.5 px-2">
                            <span className="capitalize px-2 py-0.5 rounded-[4px] bg-brand-muted/70 text-brand-muted-foreground font-medium text-[10px]">
                              {u.cargo === 'administrador' ? t.role_admin : u.cargo === 'vendedor' ? t.role_seller : t.role_cashier}
                            </span>
                          </td>
                          <td className="py-3.5 px-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleToggleUserActive(u.id)}
                              className="focus:outline-none cursor-pointer transition-transform hover:scale-105 active:scale-95 inline-block"
                              title="Clique para alternar status"
                            >
                              {u.ativo ? (
                                <span className="font-mono text-[9px] uppercase tracking-wider font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 hover:bg-emerald-100/70 transition-colors">
                                  {t.user_status_active}
                                </span>
                              ) : (
                                <span className="font-mono text-[9px] uppercase tracking-wider font-bold text-rose-500 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100 hover:bg-rose-100/70 transition-colors">
                                  {t.user_status_inactive}
                                </span>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* SUBTAB: CUSTOMER REGISTER */}
        {activeSubTab === 'customers' && (
          <>
            {/* Customer Form */}
            <div className="lg:col-span-5 bg-brand-card border border-brand-border/60 rounded-[12px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-6">
              <div className="flex items-center gap-3 border-b border-brand-border/50 pb-4">
                <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary border border-brand-primary/20">
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-brand-foreground">{t.customers_title}</h3>
                  <p className="text-[11px] text-brand-muted-foreground">Salve informações essenciais dos seus clientes para facilidade no checkout.</p>
                </div>
              </div>

              <form onSubmit={handleCreateCustomer} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-brand-muted-foreground flex items-center gap-1">
                    <UserCheck size={11} /> {t.form_cust_name} *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    placeholder="Ex: João da Silva Santos"
                    className="w-full bg-brand-bg/45 border border-brand-border/80 rounded-[8px] px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary transition-all text-brand-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-brand-muted-foreground flex items-center gap-1">
                    <Tag size={11} /> {t.form_cust_cpf}
                  </label>
                  <input
                    type="text"
                    value={newCustomerCpf}
                    onChange={(e) => setNewCustomerCpf(e.target.value)}
                    placeholder="Ex: 123.456.789-10"
                    className="w-full bg-brand-bg/45 border border-brand-border/80 rounded-[8px] px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary transition-all text-brand-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-brand-muted-foreground flex items-center gap-1">
                    <Mail size={11} /> {t.form_cust_email}
                  </label>
                  <input
                    type="email"
                    value={newCustomerEmail}
                    onChange={(e) => setNewCustomerEmail(e.target.value)}
                    placeholder="cliente@email.com"
                    className="w-full bg-brand-bg/45 border border-brand-border/80 rounded-[8px] px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary transition-all text-brand-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-brand-muted-foreground flex items-center gap-1">
                    <Phone size={11} /> {t.form_cust_phone}
                  </label>
                  <input
                    type="text"
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    placeholder="Ex: (17) 99823-1122"
                    className="w-full bg-brand-bg/45 border border-brand-border/80 rounded-[8px] px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary transition-all text-brand-foreground"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-brand-primary text-white text-xs uppercase tracking-wider font-semibold py-3 px-4 rounded-[8px] transition-all hover:bg-brand-primary/90 focus:ring-2 focus:ring-brand-primary-light active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? t.loading : t.btn_add_cust}
                </button>
              </form>
            </div>

            {/* Customer list */}
            <div className="lg:col-span-7 bg-brand-card border border-brand-border/60 rounded-[12px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-brand-border/50 pb-4">
                <div>
                  <h3 className="text-sm font-semibold text-brand-foreground">{t.cust_list}</h3>
                  <p className="text-[11px] text-brand-muted-foreground">Clientes registrados para faturamento rápido.</p>
                </div>
                {/* Search */}
                <div className="relative max-w-xs">
                  <Search size={14} className="absolute left-3.5 top-2.5 text-brand-muted-foreground" />
                  <input
                    type="text"
                    placeholder={t.placeholder_search}
                    value={searchCustomerTerm}
                    onChange={(e) => setSearchCustomerTerm(e.target.value)}
                    className="bg-brand-bg/40 border border-brand-border/60 rounded-[8px] pl-9 pr-3.5 py-1.5 text-xs text-brand-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary/30 w-full"
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="py-12 text-center text-xs text-brand-muted-foreground font-mono">
                  {t.loading}
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="py-12 text-center text-xs text-brand-muted-foreground font-sans">
                  Nenhum cliente cadastrado.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-brand-border/40 text-[10px] uppercase text-brand-muted-foreground tracking-wider font-semibold">
                        <th className="py-3 px-2">ID</th>
                        <th className="py-3 px-2">Cliente</th>
                        <th className="py-3 px-2">Contatos</th>
                        <th className="py-3 px-2">{t.cust_date}</th>
                        <th className="py-3 px-2 text-right">Status / Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border/30">
                      {filteredCustomers.map((c) => (
                        <tr key={c.id} className="hover:bg-brand-bg/20 transition-all font-sans">
                          <td className="py-3.5 px-2 font-mono text-[10px] text-brand-muted-foreground">
                            #{c.id}
                          </td>
                          <td className="py-3.5 px-2">
                            <div className="font-semibold text-brand-foreground">{c.nome}</div>
                            {c.cpf && (
                              <div className="text-[10px] text-brand-muted-foreground font-mono">CPF: {c.cpf}</div>
                            )}
                          </td>
                          <td className="py-3.5 px-2 space-y-0.5">
                            {c.email && (
                              <div className="text-[10px] text-brand-muted-foreground flex items-center gap-1">
                                <Mail size={10} /> {c.email}
                              </div>
                            )}
                            {c.telefone && (
                              <div className="text-[10px] text-brand-foreground flex items-center gap-1 font-semibold">
                                <Smartphone size={10} className="text-brand-primary" /> {c.telefone}
                              </div>
                            )}
                            {!c.email && !c.telefone && (
                              <span className="text-brand-muted-foreground/50 font-serif font-light text-[10px] italic">Sem contatos</span>
                            )}
                          </td>
                          <td className="py-3.5 px-2 text-[10px] text-brand-muted-foreground font-serif">
                            {c.datacriacao ? new Date(c.datacriacao).toLocaleDateString('pt-BR') : 'Histórico'}
                          </td>
                          <td className="py-3.5 px-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleToggleCustomerActive(c.id)}
                              className="focus:outline-none cursor-pointer transition-transform hover:scale-105 active:scale-95 inline-block"
                              title="Clique para alternar status"
                            >
                              {c.ativo !== false ? (
                                <span className="font-mono text-[9px] uppercase tracking-wider font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 hover:bg-emerald-100/70 transition-colors">
                                  {t.user_status_active}
                                </span>
                              ) : (
                                <span className="font-mono text-[9px] uppercase tracking-wider font-bold text-rose-500 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100 hover:bg-rose-100/70 transition-colors">
                                  {t.user_status_inactive}
                                </span>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* SUBTAB: SYSTEM LANGUAGE */}
        {activeSubTab === 'language' && (
          <div className="col-span-12 max-w-2xl bg-brand-card border border-brand-border/60 rounded-[12px] p-8 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b border-brand-border/40">
              <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary border border-brand-primary/20">
                <Globe size={22} className="animate-spin-slow" />
              </div>
              <div>
                <h3 className="text-md font-semibold text-brand-foreground">{t.lang_title}</h3>
                <p className="text-xs text-brand-muted-foreground">{t.lang_subtitle}</p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[11px] uppercase tracking-wider font-semibold text-brand-muted-foreground block">
                {t.lang_select_label}
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* PT */}
                <button
                  type="button"
                  onClick={() => handleLanguageUpdate('pt')}
                  className={`p-4 rounded-[10px] border text-left cursor-pointer transition-all ${
                    currentLanguage === 'pt'
                      ? 'border-brand-primary bg-brand-primary/5 shadow-sm text-brand-primary'
                      : 'border-brand-border/70 bg-transparent text-brand-foreground hover:bg-brand-muted/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold">🇧🇷</span>
                    {currentLanguage === 'pt' && <CheckCircle size={15} className="text-brand-primary" />}
                  </div>
                  <h4 className="font-semibold text-xs mt-2 text-brand-foreground">Português</h4>
                  <p className="text-[10px] text-brand-muted-foreground font-mono">Brasil (Original)</p>
                </button>

                {/* EN */}
                <button
                  type="button"
                  onClick={() => handleLanguageUpdate('en')}
                  className={`p-4 rounded-[10px] border text-left cursor-pointer transition-all ${
                    currentLanguage === 'en'
                      ? 'border-brand-primary bg-brand-primary/5 shadow-sm text-brand-primary'
                      : 'border-brand-border/70 bg-transparent text-brand-foreground hover:bg-brand-muted/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold">🇺🇸</span>
                    {currentLanguage === 'en' && <CheckCircle size={15} className="text-brand-primary" />}
                  </div>
                  <h4 className="font-semibold text-xs mt-2 text-brand-foreground">English</h4>
                  <p className="text-[10px] text-brand-muted-foreground font-mono">United States</p>
                </button>

                {/* ES */}
                <button
                  type="button"
                  onClick={() => handleLanguageUpdate('es')}
                  className={`p-4 rounded-[10px] border text-left cursor-pointer transition-all ${
                    currentLanguage === 'es'
                      ? 'border-brand-primary bg-brand-primary/5 shadow-sm text-brand-primary'
                      : 'border-brand-border/70 bg-transparent text-brand-foreground hover:bg-brand-muted/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold">🇪🇸</span>
                    {currentLanguage === 'es' && <CheckCircle size={15} className="text-brand-primary" />}
                  </div>
                  <h4 className="font-semibold text-xs mt-2 text-brand-foreground">Español</h4>
                  <p className="text-[10px] text-brand-muted-foreground font-mono">España</p>
                </button>

              </div>

              <p className="text-[11px] text-brand-muted-foreground bg-brand-bg p-3.5 rounded-[8px] border border-brand-border/50 font-serif leading-relaxed italic">
                💡 {t.lang_help}
              </p>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
