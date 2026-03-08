import { z } from 'zod';

const dispositivoSchema = z.object({
  tipo: z.enum(['celular', 'tablet', 'notebook', 'outro']),
  marca: z.string().min(1, 'Marca é obrigatória'),
  modelo: z.string().min(1, 'Modelo é obrigatório'),
  cor: z.string().optional(),
  imei: z.string().optional(),
  serial: z.string().optional(),
  senhaDispositivo: z.string().optional(),
  acessorios: z.string().optional(),
  estadoVisual: z.string().optional(),
});

const itemOrcamentoSchema = z.object({
  tipo: z.enum(['servico', 'peca']),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  produtoId: z.string().optional(),
  quantidade: z.number().min(1),
  valorUnitario: z.number().min(0),
  total: z.number().min(0),
});

export const createOrcamentoSchema = z.object({
  clienteId: z.string().optional(),
  clienteNome: z.string().min(1, 'Nome do cliente é obrigatório'),
  clienteTelefone: z.string().optional(),
  dispositivo: dispositivoSchema,
  defeitoRelatado: z.string().min(1, 'Defeito relatado é obrigatório'),
  itens: z.array(itemOrcamentoSchema).min(1, 'Pelo menos um item é obrigatório'),
  subtotal: z.number().min(0),
  desconto: z.number().min(0).default(0),
  total: z.number().min(0),
  validade: z.number().min(1).default(15),
  status: z
    .enum(['pendente', 'enviado', 'aprovado', 'recusado', 'expirado', 'convertido'])
    .default('pendente'),
  observacoes: z.string().optional(),
});

export const updateOrcamentoSchema = z.object({
  clienteId: z.string().optional(),
  clienteNome: z.string().min(1).optional(),
  clienteTelefone: z.string().optional(),
  dispositivo: dispositivoSchema.optional(),
  defeitoRelatado: z.string().min(1).optional(),
  itens: z.array(itemOrcamentoSchema).min(1).optional(),
  subtotal: z.number().min(0).optional(),
  desconto: z.number().min(0).optional(),
  total: z.number().min(0).optional(),
  validade: z.number().min(1).optional(),
  status: z
    .enum(['pendente', 'enviado', 'aprovado', 'recusado', 'expirado', 'convertido'])
    .optional(),
  observacoes: z.string().optional(),
});
