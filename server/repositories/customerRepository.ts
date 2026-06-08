import { sql } from '../db';
import { Cliente } from '../models/Cliente';

export async function findAllCustomers(): Promise<Cliente[]> {
  const rows = await sql`
    SELECT idcliente, nome, cpf, email, telefone, ativo, datacriacao
    FROM clientes ORDER BY idcliente ASC
  `;
  return rows.map(Cliente.fromRow);
}

export async function insertCustomer(
  nome: string,
  cpf: string | null,
  email: string | null,
  telefone: string | null,
  ativo: boolean,
) {
  return sql`
    INSERT INTO clientes (nome, cpf, email, telefone, ativo)
    VALUES (${nome}, ${cpf}, ${email}, ${telefone}, ${ativo})
    RETURNING idcliente, nome, cpf, email, telefone, ativo, datacriacao
  `;
}

export async function toggleCustomerActive(id: number) {
  return sql`UPDATE clientes SET ativo = NOT ativo WHERE idcliente = ${id}`;
}
