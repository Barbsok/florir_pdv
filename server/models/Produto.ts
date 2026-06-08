export class Produto {
  idproduto: number = 0;
  nome: string = '';
  valorunitario: number = 0;
  estoque: number = 0;
  estoqueminimo: number = 0;
  ativo: boolean = true;
  idcategoria: number = 0;
  categoria_nome?: string;

  static fromRow(row: any): Produto {
    const p = new Produto();
    p.idproduto = Number(row.idproduto);
    p.nome = row.nome;
    p.valorunitario = Number(row.valorunitario);
    p.estoque = Number(row.estoque);
    p.estoqueminimo = Number(row.estoqueminimo);
    p.ativo = row.ativo !== false;
    p.idcategoria = Number(row.idcategoria);
    p.categoria_nome = row.categoria_nome ?? undefined;
    return p;
  }
}
