import { sql } from '../db';

export async function findAllSales() {
  return sql`SELECT * FROM vw_resumo_vendas ORDER BY datahora DESC`;
}

export async function insertPedido(
  total: number,
  paymentMethod: string,
  employeeId: number,
  clienteId: number | null,
) {
  return sql`
    INSERT INTO pedidos (valortotal, status, formapagamento, idfuncionario, idcliente)
    VALUES (${total}, 'aberto', ${paymentMethod}, ${employeeId}, ${clienteId})
    RETURNING idpedido
  `;
}

export async function insertItemPedido(
  pedidoId: number,
  productId: number,
  quantity: number,
  price: number,
  subtotal: number,
) {
  return sql`
    INSERT INTO itenspedido (idpedido, idproduto, quantidade, valorunitario, subtotal)
    VALUES (${pedidoId}, ${productId}, ${quantity}, ${price}, ${subtotal})
  `;
}

export async function finalizePedido(pedidoId: number, paymentMethod: string) {
  return sql`CALL sp_finalizar_pedido(${pedidoId}, ${paymentMethod})`;
}
