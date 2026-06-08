export class ItemPedido {
  idpedido: number = 0;
  idproduto: number = 0;
  quantidade: number = 0;
  valorunitario: number = 0;
  subtotal: number = 0;

  static fromRow(row: any): ItemPedido {
    const i = new ItemPedido();
    i.idpedido = Number(row.idpedido);
    i.idproduto = Number(row.idproduto);
    i.quantidade = Number(row.quantidade);
    i.valorunitario = Number(row.valorunitario);
    i.subtotal = Number(row.subtotal);
    return i;
  }
}
