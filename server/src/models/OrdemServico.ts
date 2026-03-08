import mongoose, { Schema } from 'mongoose';

const dispositivoSchema = new Schema(
  {
    tipo: {
      type: String,
      enum: ['celular', 'tablet', 'notebook', 'outro'],
      required: true,
    },
    marca: { type: String, required: true },
    modelo: { type: String, required: true },
    cor: String,
    imei: String,
    serial: String,
    senhaDispositivo: String,
    acessorios: String,
    estadoVisual: String,
  },
  { _id: false }
);

const servicoOSSchema = new Schema(
  {
    descricao: { type: String, required: true },
    valor: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const pecaOSSchema = new Schema(
  {
    produtoId: { type: Schema.Types.ObjectId, ref: 'Produto' },
    nome: { type: String, required: true },
    quantidade: { type: Number, required: true, min: 1 },
    valorUnitario: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const pagamentoSchema = new Schema(
  {
    forma: {
      type: String,
      enum: ['dinheiro', 'credito', 'debito', 'pix', 'boleto', 'crediario'],
      required: true,
    },
    valor: { type: Number, required: true, min: 0 },
    parcelas: Number,
    bandeira: String,
  },
  { _id: false }
);

const ordemServicoSchema = new Schema(
  {
    numero: { type: Number, required: true, unique: true },
    clienteId: { type: Schema.Types.ObjectId, ref: 'Cliente' },
    clienteNome: { type: String, required: true },
    clienteTelefone: String,
    dispositivo: { type: dispositivoSchema, required: true },
    defeitoRelatado: { type: String, required: true },
    laudoTecnico: String,
    servicos: [servicoOSSchema],
    pecas: [pecaOSSchema],
    valorServicos: { type: Number, default: 0, min: 0 },
    valorPecas: { type: Number, default: 0, min: 0 },
    desconto: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: [
        'aberta',
        'em_analise',
        'orcamento_enviado',
        'aprovada',
        'em_execucao',
        'concluida',
        'entregue',
        'cancelada',
      ],
      default: 'aberta',
    },
    prioridade: {
      type: String,
      enum: ['baixa', 'normal', 'alta', 'urgente'],
      default: 'normal',
    },
    tecnicoId: { type: Schema.Types.ObjectId, ref: 'User' },
    tecnicoNome: String,
    prazoEstimado: Date,
    pagamentos: [pagamentoSchema],
    observacoes: String,
    orcamentoId: { type: Schema.Types.ObjectId, ref: 'Orcamento' },
    concluidaEm: Date,
    entregueEm: Date,
    canceladaEm: Date,
    motivoCancelamento: String,
  },
  {
    timestamps: { createdAt: 'criadoEm', updatedAt: 'atualizadoEm' },
  }
);

export const OrdemServico = mongoose.model('OrdemServico', ordemServicoSchema);
