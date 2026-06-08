import { findAllProducts } from '../repositories/productRepository';
import { findAllSales } from '../repositories/saleRepository';
import { findAllStockEntries } from '../repositories/stockEntryRepository';
import { Produto } from '../models/Produto';
import { EntradaEstoque } from '../models/EntradaEstoque';

const mapPaymentMethod = (pm: string): string => {
  switch (pm?.toLowerCase()) {
    case 'pix': return 'Pix';
    case 'debito': return 'Débito';
    case 'credito': return 'Crédito';
    case 'dinheiro': return 'Dinheiro';
    default: return pm || 'Dinheiro';
  }
};

export async function getAllDbState() {
  const [products, rawVendas, entries] = await Promise.all([
    findAllProducts(),
    findAllSales(),
    findAllStockEntries(),
  ]);

  const mappedProducts = products.map((p: Produto) => ({
    id: String(p.idproduto),
    name: p.nome,
    category: p.categoria_nome || 'Sem Categoria',
    stock: p.estoque,
    minStock: p.estoqueminimo,
    price: p.valorunitario,
    ativo: p.ativo,
  }));

  const salesMap = new Map<number, any>();
  for (const row of rawVendas) {
    const id = Number(row.idpedido);
    if (!salesMap.has(id)) {
      salesMap.set(id, {
        id: String(id),
        paymentMethod: mapPaymentMethod(row.formapagamento),
        total: Number(row.valortotal),
        date: new Date(row.datahora).toISOString(),
        clienteId: row.idcliente ? Number(row.idcliente) : undefined,
        clienteNome: row.nomecliente || undefined,
        items: [],
      });
    }
    if (row.idproduto) {
      salesMap.get(id).items.push({
        productId: String(row.idproduto),
        name: row.nomeproduto || 'Produto',
        quantity: Number(row.quantidade),
        price: Number(row.valorunitario),
        subtotal: Number(row.subtotal),
      });
    }
  }
  const sales = Array.from(salesMap.values());

  const stockEntries = entries.map((e: EntradaEstoque) => ({
    id: String(e.identrada),
    productId: String(e.idproduto),
    productName: e.produto_nome || 'Produto',
    quantity: e.quantidade,
    costPrice: e.precocusto,
    employee: e.funcionario_nome || 'Funcionário',
    date: e.datahora.toISOString(),
    observations: e.observacao,
  }));

  return { products: mappedProducts, sales, stockEntries };
}
