import { Request, Response, NextFunction } from 'express';

/**
 * Wrapper para handlers async — captura erros e passa para o error handler global.
 */
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
