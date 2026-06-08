import { Request, Response } from 'express';
import {
  findOrCreateCategory,
  insertProduct,
  toggleProductActive,
} from '../repositories/productRepository';
import { getAllDbState } from '../services/dbStateService';

export async function createProduct(req: Request, res: Response) {
  const { name, category, price, stock, minStock } = req.body;
  if (!name || !category || price === undefined || stock === undefined || minStock === undefined) {
    return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
  }

  const numericPrice = Number(price);
  const numericStock = Number(stock);
  const numericMinStock = Number(minStock);

  if (isNaN(numericPrice) || numericPrice <= 0)
    return res.status(400).json({ error: 'O preço deve ser um número maior que zero.' });
  if (isNaN(numericStock) || numericStock < 0)
    return res.status(400).json({ error: 'O estoque deve ser um número maior ou igual a zero.' });
  if (isNaN(numericMinStock) || numericMinStock < 0)
    return res.status(400).json({ error: 'O estoque mínimo deve ser um número maior ou igual a zero.' });

  try {
    const categoryId = await findOrCreateCategory(category.trim(), name);
    await insertProduct(name, categoryId, numericPrice, numericStock, numericMinStock);
    const data = await getAllDbState();
    res.json({ success: true, products: data.products });
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Erro ao cadastrar produto no banco de dados.' });
  }
}

export async function toggleActive(req: Request, res: Response) {
  const { id } = req.params;
  const idInt = parseInt(id, 10);
  if (isNaN(idInt)) return res.status(400).json({ error: 'ID de produto inválido.' });

  try {
    await toggleProductActive(idInt);
    const data = await getAllDbState();
    res.json({ success: true, products: data.products });
  } catch (err) {
    console.error('Error toggling product active state:', err);
    res.status(500).json({ error: 'Erro ao modificar status do produto no banco de dados.' });
  }
}
