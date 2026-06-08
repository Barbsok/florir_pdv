import { Request, Response } from 'express';
import { getAllDbState } from '../services/dbStateService';
import { findLowStockProducts } from '../repositories/productRepository';

export async function bootstrap(_: Request, res: Response) {
  try {
    const [data, lowStock] = await Promise.all([getAllDbState(), findLowStockProducts()]);
    res.json({ usingFallback: false, ...data, lowStockProducts: lowStock });
  } catch (err) {
    console.error('Database read failed:', err);
    res.status(500).json({ error: 'Erro ao carregar dados do banco de dados.' });
  }
}

export async function getLowStockProducts(_: Request, res: Response) {
  try {
    const rows = await findLowStockProducts();
    res.json({ products: rows });
  } catch (err) {
    console.error('Error fetching low-stock products:', err);
    res.status(500).json({ error: 'Erro ao buscar produtos com estoque baixo.' });
  }
}
