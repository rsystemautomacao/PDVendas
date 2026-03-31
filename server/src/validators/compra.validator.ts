import { z } from 'zod';

const itemCompraSchema = z.object({
  produtoId: z.string().min(1),
  nome: z.string().optional(),
  quantidade: z.number().min(0.001),
  custoUnitario: z.number().min(0),
  total: z.number().min(0),
});

export const createCompraSchema = z.object({
  fornecedor: z.string().min(1, 'Fornecedor é obrigatório'),
  itens: z.array(itemCompraSchema).min(1, 'Pelo menos um item'),
  total: z.number().min(0),
  status: z.enum(['pendente', 'recebida', 'cancelada']).default('pendente'),
  observacoes: z.string().optional(),
});

export const updateCompraSchema = createCompraSchema.partial();
