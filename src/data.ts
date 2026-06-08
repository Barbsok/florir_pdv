/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, Sale, StockEntry } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Buquê de Peônias Blush', category: 'Flores Premium', stock: 5, minStock: 8, price: 280.00 },
  { id: 'p2', name: 'Orquídea Phalaenopsis Branca', category: 'Orquídeas', stock: 12, minStock: 10, price: 165.00 },
  { id: 'p3', name: 'Arranjo de Rosas Secas Vintage', category: 'Arranjos', stock: 6, minStock: 5, price: 190.00 },
  { id: 'p4', name: 'Vaso Terrário Botânico Médio', category: 'Terrários', stock: 3, minStock: 6, price: 145.00 },
  { id: 'p5', name: 'Ramo de Eucalipto Preservado', category: 'Fibras e Folhas', stock: 20, minStock: 15, price: 68.00 },
  { id: 'p6', name: 'Lírio Perfumado Imperial', category: 'Flores Unidade', stock: 2, minStock: 5, price: 110.00 },
  { id: 'p7', name: 'Buquê Silvestre de Lavanda', category: 'Flores Premium', stock: 15, minStock: 10, price: 155.00 },
  { id: 'p8', name: 'Arranjo de Hortênsias Desidratadas', category: 'Arranjos', stock: 1, minStock: 4, price: 210.00 },
];

export const INITIAL_STOCK_ENTRIES: StockEntry[] = [
  { id: 'se1', productId: 'p1', productName: 'Buquê de Peônias Blush', quantity: 10, costPrice: 140.00, employee: 'Elena Vasconcelos', date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), observations: 'Lote importado da Holanda em perfeitas condições.' },
  { id: 'se2', productId: 'p5', productName: 'Ramo de Eucalipto Preservado', quantity: 30, costPrice: 30.00, employee: 'Arthur Schmidt', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), observations: 'Reposição de folhagens secas.' },
  { id: 'se3', productId: 'p8', productName: 'Arranjo de Hortênsias Desidratadas', quantity: 5, costPrice: 95.00, employee: 'Elena Vasconcelos', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), observations: 'Lote especial para exposição.' },
];

// Helper to generate dynamic sales for the last 30 days
export function generateInitialSales(): Sale[] {
  const sales: Sale[] = [];
  const now = new Date();
  
  // High-quality deterministic sales to populate our statistics beautiful line and bar charts!
  const salesDistribution = [
    { dayOffset: 29, prodId: 'p2', qty: 1, method: 'Pix' },
    { dayOffset: 27, prodId: 'p3', qty: 2, method: 'Crédito' },
    { dayOffset: 25, prodId: 'p1', qty: 1, method: 'Dinheiro' },
    { dayOffset: 23, prodId: 'p5', qty: 3, method: 'Débito' },
    { dayOffset: 20, prodId: 'p7', qty: 1, method: 'Pix' },
    { dayOffset: 18, prodId: 'p4', qty: 1, method: 'Crédito' },
    { dayOffset: 15, prodId: 'p2', qty: 2, method: 'Pix' },
    { dayOffset: 12, prodId: 'p8', qty: 1, method: 'Crédito' },
    { dayOffset: 10, prodId: 'p1', qty: 2, method: 'Pix' },
    { dayOffset: 8, prodId: 'p6', qty: 1, method: 'Dinheiro' },
    { dayOffset: 7, prodId: 'p3', qty: 1, method: 'Débito' },
    { dayOffset: 6, prodId: 'p5', qty: 4, method: 'Pix' },
    { dayOffset: 5, prodId: 'p7', qty: 2, method: 'Crédito' },
    { dayOffset: 4, prodId: 'p2', qty: 1, method: 'Pix' },
    { dayOffset: 3, prodId: 'p4', qty: 2, method: 'Crédito' },
    { dayOffset: 2, prodId: 'p1', qty: 1, method: 'Pix' },
    { dayOffset: 1, prodId: 'p3', qty: 1, method: 'Dinheiro' },
    { dayOffset: 0, prodId: 'p2', qty: 1, method: 'Pix' }, // Today
    { dayOffset: 0, prodId: 'p7', qty: 1, method: 'Crédito' }, // Today
  ];

  salesDistribution.forEach((s, idx) => {
    const saleDate = new Date(now.getTime() - s.dayOffset * 24 * 60 * 60 * 1000);
    const product = INITIAL_PRODUCTS.find(p => p.id === s.prodId);
    if (product) {
      const itemPrice = product.price;
      const subtotal = itemPrice * s.qty;
      sales.push({
        id: `sale-${idx + 1}`,
        items: [
          {
            productId: s.prodId,
            name: product.name,
            quantity: s.qty,
            price: itemPrice,
            subtotal: subtotal
          }
        ],
        paymentMethod: s.method as any,
        total: subtotal,
        date: saleDate.toISOString()
      });
    }
  });

  return sales;
}

// Storage keys
const PRODUCTS_KEY = 'florir_products_v1';
const SALES_KEY = 'florir_sales_v1';
const ENTRIES_KEY = 'florir_entries_v1';

export function getStoredProducts(): Product[] {
  const data = localStorage.getItem(PRODUCTS_KEY);
  if (!data) {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(INITIAL_PRODUCTS));
    return INITIAL_PRODUCTS;
  }
  return JSON.parse(data);
}

export function saveProducts(products: Product[]): void {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

export function getStoredSales(): Sale[] {
  const data = localStorage.getItem(SALES_KEY);
  if (!data) {
    const initialSales = generateInitialSales();
    localStorage.setItem(SALES_KEY, JSON.stringify(initialSales));
    return initialSales;
  }
  return JSON.parse(data);
}

export function saveSales(sales: Sale[]): void {
  localStorage.setItem(SALES_KEY, JSON.stringify(sales));
}

export function getStoredStockEntries(): StockEntry[] {
  const data = localStorage.getItem(ENTRIES_KEY);
  if (!data) {
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(INITIAL_STOCK_ENTRIES));
    return INITIAL_STOCK_ENTRIES;
  }
  return JSON.parse(data);
}

export function saveStockEntries(entries: StockEntry[]): void {
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
}
