export class EntradaEstoque {
  identrada: number = 0;
  quantidade: number = 0;
  precocusto?: number;
  datahora: Date = new Date();
  observacao?: string;
  idproduto: number = 0;
  idfuncionario: number = 0;
  produto_nome?: string;
  funcionario_nome?: string;

  static fromRow(row: any): EntradaEstoque {
    const e = new EntradaEstoque();
    e.identrada = Number(row.identrada);
    e.quantidade = Number(row.quantidade);
    e.precocusto = row.precocusto ? Number(row.precocusto) : undefined;
    e.datahora = new Date(row.datahora);
    e.observacao = row.observacao ?? undefined;
    e.idproduto = Number(row.idproduto);
    e.idfuncionario = Number(row.idfuncionario);
    e.produto_nome = row.produto_nome ?? undefined;
    e.funcionario_nome = row.funcionario_nome ?? undefined;
    return e;
  }
}
