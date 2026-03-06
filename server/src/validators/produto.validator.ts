import { z } from 'zod';

export const createProdutoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  codigo: z.string().min(1, 'Código é obrigatório'),
  codigoBarras: z.string().optional(),
  tipo: z.enum(['produto', 'servico']).default('produto'),
  preco: z.number().min(0, 'Preço deve ser positivo'),
  precoCusto: z.number().min(0).optional(),
  estoque: z.number().min(0).default(0),
  estoqueMinimo: z.number().min(0).default(5),
  unidade: z.enum(['UN', 'KG', 'L', 'CX', 'M', 'PCT']).default('UN'),
  grupo: z.string().optional(),
  marca: z.string().optional(),
  fornecedor: z.string().optional(),
  ativo: z.boolean().default(true),
  observacoes: z.string().optional(),
});

export const updateProdutoSchema = createProdutoSchema.partial();

export const updateEstoqueSchema = z.object({
  quantidade: z.number({ required_error: 'Quantidade é obrigatória' }),
  operacao: z.enum(['set', 'add', 'subtract']).default('set'),
});
