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

const servicoSchema = z.object({
  descricao: z.string().min(1, 'Descrição do serviço é obrigatória'),
  valor: z.number().min(0),
});

const pecaSchema = z.object({
  produtoId: z.string().optional(),
  nome: z.string().min(1, 'Nome da peça é obrigatório'),
  quantidade: z.number().min(1),
  valorUnitario: z.number().min(0),
  total: z.number().min(0),
});

const pagamentoSchema = z.object({
  forma: z.enum(['dinheiro', 'credito', 'debito', 'pix', 'boleto', 'crediario']),
  valor: z.number().min(0),
  parcelas: z.number().optional(),
  bandeira: z.string().optional(),
});

export const createOSSchema = z.object({
  clienteId: z.string().optional(),
  clienteNome: z.string().min(1, 'Nome do cliente é obrigatório'),
  clienteTelefone: z.string().optional(),
  dispositivo: dispositivoSchema,
  defeitoRelatado: z.string().min(1, 'Defeito relatado é obrigatório'),
  laudoTecnico: z.string().optional(),
  servicos: z.array(servicoSchema).default([]),
  pecas: z.array(pecaSchema).default([]),
  valorServicos: z.number().min(0).default(0),
  valorPecas: z.number().min(0).default(0),
  desconto: z.number().min(0).default(0),
  total: z.number().min(0).default(0),
  status: z
    .enum([
      'aberta',
      'em_analise',
      'orcamento_enviado',
      'aprovada',
      'em_execucao',
      'concluida',
      'entregue',
      'cancelada',
    ])
    .default('aberta'),
  prioridade: z.enum(['baixa', 'normal', 'alta', 'urgente']).default('normal'),
  tecnicoId: z.string().optional(),
  tecnicoNome: z.string().optional(),
  prazoEstimado: z.string().optional(),
  pagamentos: z.array(pagamentoSchema).default([]),
  observacoes: z.string().optional(),
  orcamentoId: z.string().optional(),
});

export const updateOSSchema = z.object({
  clienteId: z.string().optional(),
  clienteNome: z.string().min(1).optional(),
  clienteTelefone: z.string().optional(),
  dispositivo: dispositivoSchema.optional(),
  defeitoRelatado: z.string().min(1).optional(),
  laudoTecnico: z.string().optional(),
  servicos: z.array(servicoSchema).optional(),
  pecas: z.array(pecaSchema).optional(),
  valorServicos: z.number().min(0).optional(),
  valorPecas: z.number().min(0).optional(),
  desconto: z.number().min(0).optional(),
  total: z.number().min(0).optional(),
  status: z
    .enum([
      'aberta',
      'em_analise',
      'orcamento_enviado',
      'aprovada',
      'em_execucao',
      'concluida',
      'entregue',
      'cancelada',
    ])
    .optional(),
  prioridade: z.enum(['baixa', 'normal', 'alta', 'urgente']).optional(),
  tecnicoId: z.string().optional(),
  tecnicoNome: z.string().optional(),
  prazoEstimado: z.string().optional(),
  pagamentos: z.array(pagamentoSchema).optional(),
  observacoes: z.string().optional(),
  motivoCancelamento: z.string().optional(),
});

export const cancelOSSchema = z.object({
  motivo: z.string().min(1, 'Motivo do cancelamento é obrigatório'),
});
