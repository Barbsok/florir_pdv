import { sql } from '../db';
import { EntradaEstoque } from '../models/EntradaEstoque';

export async function findAllStockEntries(): Promise<EntradaEstoque[]> {
  const rows = await sql`
    SELECT e.*, pr.nome AS produto_nome, f.nome AS funcionario_nome
    FROM entradaestoque e
    LEFT JOIN produtos pr ON e.idproduto = pr.idproduto
    LEFT JOIN funcionarios f ON e.idfuncionario = f.idfuncionario
    ORDER BY e.datahora DESC
  `;
  return rows.map(EntradaEstoque.fromRow);
}

export async function insertStockEntry(
  quantity: number,
  costPrice: number | null,
  observations: string | null,
  productId: number,
  employeeId: number,
) {
  return sql`
    INSERT INTO entradaestoque (quantidade, precocusto, observacao, idproduto, idfuncionario)
    VALUES (${quantity}, ${costPrice}, ${observations}, ${productId}, ${employeeId})
  `;
}

export async function updateProductStock(productId: number, quantity: number) {
  return sql`UPDATE produtos SET estoque = estoque + ${quantity} WHERE idproduto = ${productId}`;
}
