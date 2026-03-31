import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

/**
 * Middleware que verifica se o usuário autenticado é o superadmin.
 * O email do superadmin é definido pela env var SUPERADMIN_EMAIL.
 * Deve ser usado APÓS o middleware `authenticate`.
 */
export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Não autenticado' });
  }

  if (!env.SUPERADMIN_EMAIL) {
    return res.status(403).json({ success: false, error: 'Superadmin não configurado' });
  }

  if (req.user.email.toLowerCase() !== env.SUPERADMIN_EMAIL.toLowerCase()) {
    return res.status(403).json({ success: false, error: 'Acesso restrito' });
  }

  next();
};
