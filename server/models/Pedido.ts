export class Pedido {
  idpedido: number = 0;
  datahora: Date = new Date();
  valortotal: number = 0;
  status: string = '';
  formapagamento: string = '';
  idfuncionario: number = 0;
  idcliente?: number;

  static fromRow(row: any): Pedido {
    const p = new Pedido();
    p.idpedido = Number(row.idpedido);
    p.datahora = new Date(row.datahora);
    p.valortotal = Number(row.valortotal);
    p.status = row.status;
    p.formapagamento = row.formapagamento;
    p.idfuncionario = Number(row.idfuncionario);
    p.idcliente = row.idcliente ? Number(row.idcliente) : undefined;
    return p;
  }
}
