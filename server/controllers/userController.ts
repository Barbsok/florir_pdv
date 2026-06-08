import { Request, Response } from 'express';
import { findAllUsers, insertUser, toggleUserActive } from '../repositories/userRepository';
import { Funcionario } from '../models/Funcionario';

export async function getUsers(_: Request, res: Response) {
  try {
    const users = await findAllUsers();
    const mappedUsers = users.map((u: Funcionario) => ({ ...u, id: u.idfuncionario }));
    res.json({ success: true, users: mappedUsers });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Erro ao buscar usuários do banco de dados' });
  }
}

export async function createUser(req: Request, res: Response) {
  const { nome, email, senha, cargo, ativo } = req.body;
  if (!nome || !email || !senha || !cargo) {
    return res.status(400).json({ error: 'Preencha todos os campos obrigatórios' });
  }

  try {
    const result = await insertUser(nome, email, senha, cargo, ativo !== false);
    const mappedUser = result.length > 0 ? { ...result[0], id: result[0].idfuncionario } : null;
    res.json({ success: true, user: mappedUser });
  } catch (err: any) {
    console.error('Error creating user:', err);
    const msg = err.code === '23505' ? 'Este e-mail já está cadastrado.' : 'Erro ao criar usuário.';
    res.status(500).json({ error: msg });
  }
}

export async function toggleActive(req: Request, res: Response) {
  const { id } = req.params;
  const idInt = parseInt(id, 10);
  if (isNaN(idInt)) return res.status(400).json({ error: 'ID de funcionário inválido.' });

  try {
    await toggleUserActive(idInt);
    const users = await findAllUsers();
    const mappedUsers = users.map((u: Funcionario) => ({ ...u, id: u.idfuncionario }));
    res.json({ success: true, users: mappedUsers });
  } catch (err) {
    console.error('Error toggling employee active state:', err);
    res.status(500).json({ error: 'Erro ao modificar status do funcionário.' });
  }
}
