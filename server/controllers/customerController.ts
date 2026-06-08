import { Request, Response } from 'express';
import { findAllCustomers, insertCustomer, toggleCustomerActive } from '../repositories/customerRepository';
import { Cliente } from '../models/Cliente';

export async function getCustomers(_: Request, res: Response) {
  try {
    const customers = await findAllCustomers();
    const mappedCustomers = customers.map((c: Cliente) => ({ ...c, id: c.idcliente }));
    res.json({ success: true, customers: mappedCustomers });
  } catch (err) {
    console.error('Error fetching customers:', err);
    res.json({ success: true, customers: [] });
  }
}

export async function createCustomer(req: Request, res: Response) {
  const { nome, cpf, email, telefone, ativo } = req.body;
  if (!nome) {
    return res.status(400).json({ error: 'O nome do cliente é obrigatório' });
  }

  try {
    const result = await insertCustomer(nome, cpf || null, email || null, telefone || null, ativo !== false);
    const mappedCustomer = result.length > 0 ? { ...result[0], id: result[0].idcliente } : null;
    res.json({ success: true, customer: mappedCustomer });
  } catch (err: any) {
    console.error('Error creating customer:', err);
    const msg = err.code === '23505' ? 'Este CPF já está cadastrado.' : 'Erro ao cadastrar cliente.';
    res.status(500).json({ error: msg });
  }
}

export async function toggleActive(req: Request, res: Response) {
  const { id } = req.params;
  const idInt = parseInt(id, 10);
  if (isNaN(idInt)) return res.status(400).json({ error: 'ID de cliente inválido.' });

  try {
    await toggleCustomerActive(idInt);
    const customers = await findAllCustomers();
    const mappedCustomers = customers.map((c: Cliente) => ({ ...c, id: c.idcliente }));
    res.json({ success: true, customers: mappedCustomers });
  } catch (err) {
    console.error('Error toggling customer active state:', err);
    res.status(500).json({ error: 'Erro ao modificar status do cliente.' });
  }
}
