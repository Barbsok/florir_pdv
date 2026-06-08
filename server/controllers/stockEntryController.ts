import { Request, Response } from 'express';
import { insertStockEntry, updateProductStock } from '../repositories/stockEntryRepository';
import { findEmployeeByEmail, findEmployeeByName } from '../repositories/userRepository';
import { findLowStockProducts } from '../repositories/productRepository';
import { getAllDbState } from '../services/dbStateService';

export async function createStockEntry(req: Request, res: Response) {
  const { entry, employeeEmail } = req.body;
  if (!entry || !entry.productId) {
    return res.status(400).json({ error: 'Falta campos obrigatórios no abastecimento' });
  }

  try {
    let idFuncionario = 1;
    if (employeeEmail) {
      const funcResult = await findEmployeeByEmail(employeeEmail);
      if (funcResult.length > 0) idFuncionario = funcResult[0].idfuncionario;
    } else if (entry.employee) {
      const funcResult = await findEmployeeByName(entry.employee);
      if (funcResult.length > 0) idFuncionario = funcResult[0].idfuncionario;
    }

    const prodIdInt = parseInt(entry.productId, 10);
    await insertStockEntry(
      entry.quantity,
      entry.costPrice ?? null,
      entry.observations ?? null,
      prodIdInt,
      idFuncionario,
    );
    await updateProductStock(prodIdInt, entry.quantity);

    const [data, lowStock] = await Promise.all([getAllDbState(), findLowStockProducts()]);
    res.json({
      success: true,
      usingFallback: false,
      products: data.products,
      stockEntries: data.stockEntries,
      lowStockProducts: lowStock,
    });
  } catch (err) {
    console.error('Error committing stock entry transaction:', err);
    res.status(500).json({ error: 'Erro ao salvar o abastecimento de estoque no banco de dados' });
  }
}
