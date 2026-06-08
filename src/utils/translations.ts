/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = 'pt' | 'en' | 'es';

export const translations = {
  pt: {
    sidebar_title: 'Florir',
    sidebar_subtitle: 'Floricultura Botanique',
    new_sale: 'Nova Venda',
    stock: 'Produtos / Plantas',
    stock_entry: 'Entrada de Estoque',
    dashboard: 'Dashboard',
    statistics: 'Estatísticas',
    settings: 'Configurações',
    logout: 'Sair',
    supabase_connecting: 'SUPABASE: CONECTANDO...',
    supabase_connected: 'SUPABASE: CONECTADO',
    supabase_fallback: 'MODO SEGURO (MEMÓRIA)',
    
    // Settings Translations
    settings_title: 'Configurações do Sistema',
    settings_subtitle: 'Gerencie acessos de funcionários, clientes e preferências de idioma.',
    tab_users: 'Usuários do PDV',
    tab_customers: 'Clientes',
    tab_language: 'Idioma (Language)',
    
    // Users
    users_title: 'Controle de Acessos ao PDV',
    users_subtitle: 'Cadastre e visualize funcionários habilitados para operar o caixa e registrar vendas.',
    form_user_name: 'Nome Completo',
    form_user_email: 'Endereço de E-mail',
    form_user_password: 'Senha de Acesso',
    form_user_role: 'Cargo / Permissão',
    form_user_status: 'Usuário Ativo',
    role_admin: 'Administrador',
    role_seller: 'Vendedor',
    role_cashier: 'Caixa',
    btn_add_user: 'Cadastrar Novo Usuário',
    user_list: 'Funcionários Cadastrados',
    user_status_active: 'Ativo',
    user_status_inactive: 'Inativo',
    
    // Customers
    customers_title: 'Cadastro de Clientes',
    customers_subtitle: 'Gerencie os dados dos clientes para faturamento e programas de fidelidade.',
    form_cust_name: 'Nome do Cliente',
    form_cust_cpf: 'CPF (opcional)',
    form_cust_email: 'E-mail',
    form_cust_phone: 'Telefone / WhatsApp',
    btn_add_cust: 'Cadastrar Cliente',
    cust_list: 'Clientes Registrados',
    cust_date: 'Cadastrado em',
    
    // Language
    lang_title: 'Selecionar Idioma',
    lang_subtitle: 'Escolha o idioma de exibição de toda a interface do sistema Florir.',
    lang_select_label: 'Idioma do Sistema',
    lang_help: 'A alteração de idioma será aplicada a todos os menus, botões e tabelas do sistema.',

    // General
    success_created_user: 'Usuário cadastrado com sucesso!',
    success_created_cust: 'Cliente cadastrado com sucesso!',
    success_language_changed: 'Idioma alterado com sucesso!',
    loading: 'Carregando...',
    placeholder_search: 'Pesquisar...',
  },
  en: {
    sidebar_title: 'Florir',
    sidebar_subtitle: 'Botanique Florist',
    new_sale: 'New Sale',
    stock: 'Products / Plants',
    stock_entry: 'Stock Entry',
    dashboard: 'Dashboard',
    statistics: 'Statistics',
    settings: 'Settings',
    logout: 'Log Out',
    supabase_connecting: 'SUPABASE: CONNECTING...',
    supabase_connected: 'SUPABASE: CONNECTED',
    supabase_fallback: 'SAFE MODE (LOCAL MEMORY)',

    // Settings Translations
    settings_title: 'System Settings',
    settings_subtitle: 'Manage employee access, customer lists, and system languages.',
    tab_users: 'POS Users',
    tab_customers: 'Customers',
    tab_language: 'Language',

    // Users
    users_title: 'Access Control',
    users_subtitle: 'Register and view employees authorized to perform transactions and operate the register.',
    form_user_name: 'Full Name',
    form_user_email: 'Email Address',
    form_user_password: 'Access Password',
    form_user_role: 'Role / Permission',
    form_user_status: 'Active User',
    role_admin: 'Administrator',
    role_seller: 'Salesperson',
    role_cashier: 'Cashier',
    btn_add_user: 'Register New User',
    user_list: 'Registered Employees',
    user_status_active: 'Active',
    user_status_inactive: 'Inactive',

    // Customers
    customers_title: 'Customer Directory',
    customers_subtitle: 'Manage client information for invoices and rewards programs.',
    form_cust_name: 'Customer Name',
    form_cust_cpf: 'Tax ID / CPF (optional)',
    form_cust_email: 'Email Address',
    form_cust_phone: 'Phone / WhatsApp',
    btn_add_cust: 'Register Customer',
    cust_list: 'Registered Customers',
    cust_date: 'Registered on',

    // Language
    lang_title: 'Select Language',
    lang_subtitle: 'Choose the display language for the entire Florir interface.',
    lang_select_label: 'System Language',
    lang_help: 'Language changes apply to all system menus, buttons, and datagrids.',

    // General
    success_created_user: 'User registered successfully!',
    success_created_cust: 'Customer registered successfully!',
    success_language_changed: 'Language updated successfully!',
    loading: 'Loading...',
    placeholder_search: 'Search...',
  },
  es: {
    sidebar_title: 'Florir',
    sidebar_subtitle: 'Floristería Botanique',
    new_sale: 'Nueva Venta',
    stock: 'Productos / Plantas',
    stock_entry: 'Ingreso Especial',
    dashboard: 'Tablero',
    statistics: 'Estadísticas',
    settings: 'Ajustes',
    logout: 'Cerrar Sesión',
    supabase_connecting: 'SUPABASE: CONECTANDO...',
    supabase_connected: 'SUPABASE: CONECTADO',
    supabase_fallback: 'MODO SEGURO (MEMORIA)',

    // Settings Translations
    settings_title: 'Configuración del Sistema',
    settings_subtitle: 'Gestione accesos del personal, directorio de clientes y preferencias de idioma.',
    tab_users: 'Usuarios de Caja',
    tab_customers: 'Clientes',
    tab_language: 'Idioma',

    // Users
    users_title: 'Control de Aceso (Caja)',
    users_subtitle: 'Registre y administre el personal autorizado para operar el punto de venta.',
    form_user_name: 'Nombre Completo',
    form_user_email: 'Correo Electrónico',
    form_user_password: 'Contraseña de Acceso',
    form_user_role: 'Puesto / Permiso',
    form_user_status: 'Usuario Activo',
    role_admin: 'Administrador',
    role_seller: 'Vendedor',
    role_cashier: 'Cajero',
    btn_add_user: 'Registrar Nuevo Usuario',
    user_list: 'Empleados Registrados',
    user_status_active: 'Activo',
    user_status_inactive: 'Inactivo',

    // Customers
    customers_title: 'Directorio de Clientes',
    customers_subtitle: 'Gestione los datos de los clientes para facturación y fidelidad.',
    form_cust_name: 'Nombre del Cliente',
    form_cust_cpf: 'Identificación / CPF (opcional)',
    form_cust_email: 'Correo Electrónico',
    form_cust_phone: 'Teléfono / WhatsApp',
    btn_add_cust: 'Registrar Cliente',
    cust_list: 'Clientes Registrados',
    cust_date: 'Registrado el',

    // Language
    lang_title: 'Seleccionar Idioma',
    lang_subtitle: 'Indique el idioma de visualización de todos los elementos de Florir.',
    lang_select_label: 'Idioma del Sistema',
    lang_help: 'Los cambios de idioma afectarán todo el software, desde menús secundarios hasta reportes.',

    // General
    success_created_user: '¡Usuario registrado correctamente!',
    success_created_cust: '¡Cliente registrado correctamente!',
    success_language_changed: '¡Idioma modificado correctamente!',
    loading: 'Cargando...',
    placeholder_search: 'Buscar...',
  }
};

export function getTranslations(lang: Language) {
  return translations[lang] || translations.pt;
}
