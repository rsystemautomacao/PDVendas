import { z } from 'zod';

const enderecoSchema = z.object({
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
}).optional();

export const createClienteSchema = z.object({
  tipo: z.enum(['fisica', 'juridica']).default('fisica'),
  nome: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email().optional().or(z.literal('')),
  telefone: z.string().optional(),
  celular: z.string().optional(),
  cpfCnpj: z.string().optional(),
  rgIe: z.string().optional(),
  dataNascimento: z.string().optional(),
  genero: z.string().optional(),
  endereco: enderecoSchema,
  limiteCredito: z.number().min(0).default(0),
  saldoDevedor: z.number().min(0).default(0),
  ativo: z.boolean().default(true),
  aprovado: z.boolean().default(true),
  observacoes: z.string().optional(),
});

export const updateClienteSchema = createClienteSchema.partial();

export const updateSaldoSchema = z.object({
  saldoDevedor: z.number().min(0, 'Saldo deve ser positivo'),
});
