import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User } from '../models/User';
import { Session } from '../models/Session';

export interface JwtPayload {
  _id: string;
  email: string;
  role: string;
  empresaId: string;
  jti?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Middleware que verifica o token JWT no header Authorization.
 * Também verifica se a sessão (JTI) ainda é válida.
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Token de autenticação não fornecido',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload & { empresaId?: string };

    if (decoded.empresaId) {
      req.user = decoded as JwtPayload;
    } else {
      const user = await User.findById(decoded._id).lean();
      if (!user) {
        return res.status(401).json({ success: false, error: 'Usuário não encontrado' });
      }
      const empresaId = user.role === 'admin'
        ? user._id.toString()
        : (user.adminId ? user.adminId.toString() : user._id.toString());
      req.user = { ...decoded, empresaId };
    }

    // Check session validity if token has JTI
    if (req.user.jti) {
      const session = await Session.findOne({ tokenJti: req.user.jti }).lean();
      if (session && !session.isValid) {
        return res.status(401).json({
          success: false,
          error: 'Sessão encerrada',
          code: 'SESSION_INVALIDATED',
          reason: session.invalidatedReason || 'unknown',
        });
      }

      // Atualiza lastActivity com throttle de 5 minutos para não sobrecarregar o banco
      if (session && session.isValid) {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        if (!session.lastActivity || (session.lastActivity as Date) < fiveMinutesAgo) {
          Session.updateOne({ tokenJti: req.user.jti }, { lastActivity: new Date() }).catch(() => {});
        }
      }
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Token inválido ou expirado',
    });
  }
};

/**
 * Middleware de autorização por role.
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Não autenticado' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Sem permissão para acessar este recurso' });
    }
    next();
  };
};
