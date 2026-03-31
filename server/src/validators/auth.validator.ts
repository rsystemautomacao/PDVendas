import { z } from 'zod';

export const registerSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  empresa: z.object({
    nome: z.string().optional(),
    cnpj: z.string().optional(),
    telefone: z.string().optional(),
    endereco: z.string().optional(),
    cidade: z.string().optional(),
    estado: z.string().optional(),
  }).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(1, 'Senha é obrigatória'),
  forceLogin: z.boolean().optional(),
});

export const updateUserSchema = z.object({
  nome: z.string().min(2).optional(),
  email: z.string().email().optional(),
  senhaAtual: z.string().optional(),
  novaSenha: z.string().min(6).optional(),
  role: z.enum(['admin', 'caixa', 'gerente']).optional(),
  ativo: z.boolean().optional(),
  empresa: z.object({
    nome: z.string().optional(),
    cnpj: z.string().optional(),
    telefone: z.string().optional(),
    endereco: z.string().optional(),
    cidade: z.string().optional(),
    estado: z.string().optional(),
    logoBase64: z.string().optional(),
  }).optional(),
}).refine(
  (data) => {
    if (data.novaSenha && !data.senhaAtual) return false;
    return true;
  },
  { message: 'Senha atual é obrigatória para alterar a senha', path: ['senhaAtual'] }
);

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
  token: z.string().length(6, 'Código deve ter 6 dígitos'),
  novaSenha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});
