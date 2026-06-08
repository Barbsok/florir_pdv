import { sql } from '../db';
import { Funcionario } from '../models/Funcionario';

export async function findAllUsers(): Promise<Funcionario[]> {
  const rows = await sql`
    SELECT idfuncionario, nome, email, cargo, ativo FROM funcionarios ORDER BY idfuncionario ASC
  `;
  return rows.map(Funcionario.fromRow);
}

export async function findUserByCredentials(email: string, password: string): Promise<Funcionario[]> {
  const rows = await sql`
    SELECT * FROM funcionarios
    WHERE email = ${email} AND senha = ${password} AND ativo = true
    LIMIT 1
  `;
  return rows.map(Funcionario.fromRow);
}

export async function findEmployeeByEmail(email: string) {
  return sql`SELECT idfuncionario FROM funcionarios WHERE email = ${email} LIMIT 1`;
}

export async function findEmployeeByName(name: string) {
  return sql`
    SELECT idfuncionario FROM funcionarios WHERE LOWER(nome) LIKE LOWER(${'%' + name + '%'}) LIMIT 1
  `;
}

export async function insertUser(
  nome: string,
  email: string,
  senha: string,
  cargo: string,
  ativo: boolean,
) {
  return sql`
    INSERT INTO funcionarios (nome, email, senha, cargo, ativo)
    VALUES (${nome}, ${email}, ${senha}, ${cargo}, ${ativo})
    RETURNING idfuncionario, nome, email, cargo, ativo
  `;
}

export async function toggleUserActive(id: number) {
  return sql`UPDATE funcionarios SET ativo = NOT ativo WHERE idfuncionario = ${id}`;
}
