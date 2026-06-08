import { Request, Response } from 'express';
import { findUserByCredentials } from '../repositories/userRepository';

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'E-mail e senha são obrigatórios' });
  }

  try {
    const users = await findUserByCredentials(email, password);
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'E-mail ou senha incorretos ou funcionário inativo.',
      });
    }
    const u = users[0];
    res.json({ success: true, user: { email: u.email, name: u.nome, role: u.cargo } });
  } catch (err) {
    console.error('Login database error:', err);
    res.status(500).json({ success: false, error: 'Erro interno ao autenticar no banco de dados' });
  }
}
