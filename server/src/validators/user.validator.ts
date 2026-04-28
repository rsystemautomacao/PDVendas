import { z } from 'zod';

export const createUserSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  role: z.enum(['caixa', 'gerente']),
  permissoes: z.record(z.boolean()).optional(),
  comissao: z.number().min(0).max(100).optional().default(0),
});

export const updateUserManagedSchema = z.object({
  nome: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(['caixa', 'gerente']).optional(),
  ativo: z.boolean().optional(),
  permissoes: z.record(z.boolean()).optional(),
  novaSenha: z.string().min(6).optional(),
  comissao: z.number().min(0).max(100).optional(),
});
