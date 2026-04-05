import { z } from 'zod';

const itemTrocaSchema = z.object({
  produtoId: z.string().min(1),
  nome: z.string().optional(),
  codigo: z.string().optional(),
  quantidade: z.number().min(0.001),
  precoUnitario: z.number().min(0),
  total: z.number().min(0),
});

export const createTrocaSchema = z.object({
  body: z.object({
    vendaId: z.string().min(1, 'Venda obrigatoria'),
    vendaNumero: z.number(),
    clienteNome: z.string().optional().default(''),
    tipo: z.enum(['troca', 'devolucao']),
    itensDevolvidos: z.array(itemTrocaSchema).min(1, 'Selecione ao menos 1 item para devolver'),
    itensNovos: z.array(itemTrocaSchema).optional().default([]),
    totalDevolvido: z.number().min(0),
    totalNovo: z.number().min(0).optional().default(0),
    diferenca: z.number().optional().default(0),
    motivo: z.string().min(1, 'Motivo obrigatorio'),
    observacoes: z.string().optional().default(''),
  }),
});

export const updateStatusTrocaSchema = z.object({
  body: z.object({
    status: z.enum(['aprovada', 'recusada']),
  }),
});
