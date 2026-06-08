export class Funcionario {
  idfuncionario: number = 0;
  nome: string = '';
  email: string = '';
  senha: string = '';
  cargo: string = '';
  ativo: boolean = true;

  static fromRow(row: any): Funcionario {
    const f = new Funcionario();
    f.idfuncionario = Number(row.idfuncionario);
    f.nome = row.nome;
    f.email = row.email;
    f.senha = row.senha ?? '';
    f.cargo = row.cargo;
    f.ativo = row.ativo !== false;
    return f;
  }
}
