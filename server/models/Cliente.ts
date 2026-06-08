export class Cliente {
  idcliente: number = 0;
  nome: string = '';
  cpf?: string;
  email?: string;
  telefone?: string;
  ativo: boolean = true;
  datacriacao?: Date;

  static fromRow(row: any): Cliente {
    const c = new Cliente();
    c.idcliente = Number(row.idcliente);
    c.nome = row.nome;
    c.cpf = row.cpf ?? undefined;
    c.email = row.email ?? undefined;
    c.telefone = row.telefone ?? undefined;
    c.ativo = row.ativo !== false;
    c.datacriacao = row.datacriacao ? new Date(row.datacriacao) : undefined;
    return c;
  }
}
