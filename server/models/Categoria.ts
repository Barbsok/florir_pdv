export class Categoria {
  idcategoria: number = 0;
  nome: string = '';
  descricao?: string;

  static fromRow(row: any): Categoria {
    const c = new Categoria();
    c.idcategoria = Number(row.idcategoria);
    c.nome = row.nome;
    c.descricao = row.descricao ?? undefined;
    return c;
  }
}
