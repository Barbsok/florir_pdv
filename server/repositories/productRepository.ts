import { sql } from '../db';
import { Produto } from '../models/Produto';

export async function findAllProducts(): Promise<Produto[]> {
  const rows = await sql`
    SELECT p.*, c.nome AS categoria_nome
    FROM produtos p
    LEFT JOIN categorias c ON p.idcategoria = c.idcategoria
    ORDER BY p.idproduto ASC
  `;
  return rows.map(Produto.fromRow);
}

export async function findLowStockProducts() {
  return sql`SELECT * FROM fn_produtos_estoque_baixo()`;
}

export async function findOrCreateCategory(category: string, productName: string): Promise<number> {
  const existing = await sql`
    SELECT idcategoria FROM categorias WHERE LOWER(nome) = LOWER(${category}) LIMIT 1
  `;
  if (existing.length > 0) return existing[0].idcategoria;

  const inserted = await sql`
    INSERT INTO categorias (nome, descricao)
    VALUES (${category}, ${`Categoria criada automaticamente para ${productName}`})
    RETURNING idcategoria
  `;
  return inserted.length > 0 ? inserted[0].idcategoria : 1;
}

export async function insertProduct(
  name: string,
  categoryId: number,
  price: number,
  stock: number,
  minStock: number,
) {
  return sql`
    INSERT INTO produtos (nome, valorunitario, estoque, estoqueminimo, ativo, idcategoria)
    VALUES (${name}, ${price}, ${stock}, ${minStock}, true, ${categoryId})
  `;
}

export async function toggleProductActive(id: number) {
  return sql`UPDATE produtos SET ativo = NOT ativo WHERE idproduto = ${id}`;
}
