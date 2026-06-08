import { Request, Response } from 'express';
import { insertPedido, insertItemPedido, finalizePedido } from '../repositories/saleRepository';
import { findEmployeeByEmail } from '../repositories/userRepository';
import { findLowStockProducts } from '../repositories/productRepository';
import { getAllDbState } from '../services/dbStateService';

const mapPaymentMethodToDb = (method: string): string => {
  switch (method?.toLowerCase()) {
    case 'pix': return 'pix';
    case 'débito':
    case 'debito': return 'debito';
    case 'crédito':
    case 'credito': return 'credito';
    case 'dinheiro': return 'dinheiro';
    default: return 'dinheiro';
  }
};

export async function createSale(req: Request, res: Response) {
  const { sale, employeeEmail } = req.body;
  if (!sale || !sale.items) {
    return res.status(400).json({ error: 'Falta informações da venda' });
  }

  try {
    let idFuncionario = 1;
    if (employeeEmail) {
      const funcResult = await findEmployeeByEmail(employeeEmail);
      if (funcResult.length > 0) idFuncionario = funcResult[0].idfuncionario;
    }

    const paymentDb = mapPaymentMethodToDb(sale.paymentMethod);
    const idClienteDb = sale.clienteId ? parseInt(String(sale.clienteId), 10) : null;

    const insertResult = await insertPedido(sale.total, paymentDb, idFuncionario, idClienteDb);
    if (insertResult.length === 0) throw new Error('Erro ao criar pedido principal');
    const idpedido = insertResult[0].idpedido;

    for (const item of sale.items) {
      await insertItemPedido(
        idpedido,
        parseInt(item.productId, 10),
        item.quantity,
        item.price,
        item.subtotal,
      );
    }

    await finalizePedido(idpedido, paymentDb);

    const [data, lowStock] = await Promise.all([getAllDbState(), findLowStockProducts()]);
    res.json({
      success: true,
      usingFallback: false,
      products: data.products,
      sales: data.sales,
      lowStockProducts: lowStock,
    });
  } catch (err: any) {
    console.error('Error committing sale transaction:', err);
    res.status(500).json({ error: err?.message || 'Erro ao salvar a venda no banco de dados' });
  }
}
