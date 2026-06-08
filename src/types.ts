/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  price: number;
  ativo?: boolean;
}

export type PaymentMethod = 'Pix' | 'Débito' | 'Crédito' | 'Dinheiro';

export interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  paymentMethod: PaymentMethod;
  total: number;
  date: string; // ISO String
  clienteId?: number;
  clienteNome?: string;
}

export interface StockEntry {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  costPrice?: number;
  employee: string;
  date: string; // ISO String
  observations?: string;
}

export interface User {
  email: string;
  name: string;
  role: string;
}

export interface LowStockProduct {
  idproduto: number;
  nome: string;
  estoqueatual: number;
  estoqueminimo: number;
  quantidadefaltante: number;
  categoria: string;
}
