import { z } from 'zod';

const variacaoItemSchema = z.object({
  _id: z.string().optional(),
  tamanho: z.string().optional(),
  cor: z.string().optional(),
  sku: z.string().optional(),
  codigoBarras: z.string().optional(),
  preco: z.number().min(0).optional(),
  estoque: z.number().min(0).default(0),
});

const serialItemSchema = z.object({
  _id: z.string().optional(),
  numero: z.string().min(1, 'Número de série é obrigatório'),
  status: z.enum(['disponivel', 'vendido', 'garantia', 'defeito']).default('disponivel'),
  vendaId: z.string().optional(),
  dataVenda: z.string().optional(),
  garantiaAte: z.string().optional(),
  observacoes: z.string().optional(),
});

const especificacaoItemSchema = z.object({
  chave: z.string().min(1),
  valor: z.string().min(1),
});

export const createProdutoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  codigo: z.string().min(1, 'Código é obrigatório'),
  codigoBarras: z.string().optional(),
  tipo: z.enum(['produto', 'servico']).default('produto'),
  modoVenda: z.enum(['normal', 'balanca']).default('normal'),
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
  // Novos campos
  temVariacoes: z.boolean().default(false),
  variacoes: z.array(variacaoItemSchema).optional(),
  tamanhosPadrao: z.array(z.string()).optional(),
  coresPadrao: z.array(z.string()).optional(),
  temSerial: z.boolean().default(false),
  seriais: z.array(serialItemSchema).optional(),
  garantiaMeses: z.number().min(0).optional(),
  garantiaTipo: z.enum(['fabricante', 'loja', 'estendida', '']).optional(),
  especificacoes: z.array(especificacaoItemSchema).optional(),
  categoria: z.string().optional(),
  genero: z.enum(['', 'masculino', 'feminino', 'unissex', 'infantil']).optional(),
  material: z.string().optional(),
  colecao: z.string().optional(),
});

export const updateProdutoSchema = createProdutoSchema.partial();

export const updateEstoqueSchema = z.object({
  quantidade: z.number({ required_error: 'Quantidade é obrigatória' }),
  operacao: z.enum(['set', 'add', 'subtract']).default('set'),
});
