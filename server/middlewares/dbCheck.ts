import { Request, Response, NextFunction } from 'express';
import { isDatabaseConfigured } from '../db';

export function dbCheck(_: Request, res: Response, next: NextFunction) {
  if (!isDatabaseConfigured()) {
    return res.status(503).json({ error: 'Banco de dados não configurado.' });
  }
  next();
}
