import { z } from 'zod';

export const abrirCaixaSchema = z.object({
  valorAbertura: z.number().min(0, 'Valor de abertura é obrigatório'),
  observacoes: z.string().optional(),
});

export const movimentacaoSchema = z.object({
  tipo: z.enum(['reforco', 'sangria', 'venda', 'estorno']),
  valor: z.number().min(0.01, 'Valor deve ser positivo'),
  descricao: z.string().default(''),
});
