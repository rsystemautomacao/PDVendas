import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Middleware de validação usando Zod.
 * Valida req.body contra o schema fornecido.
 */
export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map((e) => e.message);
        return res.status(400).json({
          success: false,
          error: messages[0] || 'Dados inválidos',
          details: messages,
        });
      }
      next(error);
    }
  };
};
