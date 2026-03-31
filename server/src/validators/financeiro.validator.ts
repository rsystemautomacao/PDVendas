import { z } from 'zod';

export const createContaPagarSchema = z.object({
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  fornecedor: z.string().optional(),
  valor: z.number().min(0.01, 'Valor é obrigatório'),
  valorPago: z.number().min(0).default(0),
  vencimento: z.string().min(1, 'Vencimento é obrigatório'),
  pago: z.boolean().default(false),
  pagoEm: z.string().optional(),
  categoria: z.string().optional(),
  observacoes: z.string().optional(),
});

export const createContaReceberSchema = z.object({
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  clienteId: z.string().optional(),
  clienteNome: z.string().optional(),
  vendaId: z.string().optional(),
  valor: z.number().min(0.01, 'Valor é obrigatório'),
  valorRecebido: z.number().min(0).default(0),
  vencimento: z.string().min(1, 'Vencimento é obrigatório'),
  recebido: z.boolean().default(false),
  recebidoEm: z.string().optional(),
  observacoes: z.string().optional(),
});

export const createDespesaSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  fornecedor: z.string().optional(),
  tipo: z.enum(['fixa', 'variavel']).default('variavel'),
  valor: z.number().min(0.01, 'Valor é obrigatório'),
  vencimento: z.string().min(1, 'Vencimento é obrigatório'),
  pago: z.boolean().default(false),
  pagoEm: z.string().optional(),
  observacoes: z.string().optional(),
});

export const updateDespesaSchema = createDespesaSchema.partial();
