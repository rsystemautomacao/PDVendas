import { z } from 'zod';

const itemVendaSchema = z.object({
  produtoId: z.string().min(1),
  nome: z.string().optional(),
  codigo: z.string().optional(),
  quantidade: z.number().min(0.001),
  precoUnitario: z.number().min(0),
  desconto: z.number().min(0).default(0),
  total: z.number().min(0),
});

const pagamentoSchema = z.object({
  forma: z.enum(['dinheiro', 'credito', 'debito', 'pix', 'boleto', 'crediario']),
  valor: z.number().min(0),
  parcelas: z.number().optional(),
  bandeira: z.string().optional(),
});

export const createVendaSchema = z.object({
  clienteId: z.string().optional(),
  clienteNome: z.string().optional(),
  itens: z.array(itemVendaSchema).min(1, 'Pelo menos um item é obrigatório'),
  subtotal: z.number().min(0),
  desconto: z.number().min(0).default(0),
  descontoTipo: z.enum(['valor', 'percentual']).default('valor'),
  total: z.number().min(0),
  pagamentos: z.array(pagamentoSchema).min(1, 'Pelo menos uma forma de pagamento'),
  troco: z.number().min(0).default(0),
  status: z.enum(['finalizada', 'orcamento', 'cancelada']).default('finalizada'),
  caixaId: z.string().min(1, 'Caixa é obrigatório'),
  observacoes: z.string().optional(),
});

export const cancelVendaSchema = z.object({
  motivo: z.string().min(1, 'Motivo do cancelamento é obrigatório'),
});
