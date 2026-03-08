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

const itemOrcamentoSchema = new Schema(
  {
    tipo: {
      type: String,
      enum: ['servico', 'peca'],
      required: true,
    },
    descricao: { type: String, required: true },
    produtoId: { type: Schema.Types.ObjectId, ref: 'Produto' },
    quantidade: { type: Number, required: true, min: 1 },
    valorUnitario: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const orcamentoSchema = new Schema(
  {
    numero: { type: Number, required: true, unique: true },
    clienteId: { type: Schema.Types.ObjectId, ref: 'Cliente' },
    clienteNome: { type: String, required: true },
    clienteTelefone: String,
    dispositivo: { type: dispositivoSchema, required: true },
    defeitoRelatado: { type: String, required: true },
    itens: [itemOrcamentoSchema],
    subtotal: { type: Number, required: true, min: 0 },
    desconto: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    validade: { type: Number, default: 15 }, // dias
    status: {
      type: String,
      enum: ['pendente', 'enviado', 'aprovado', 'recusado', 'expirado', 'convertido'],
      default: 'pendente',
    },
    osGeradaId: { type: Schema.Types.ObjectId, ref: 'OrdemServico' },
    observacoes: String,
    aprovadoEm: Date,
    recusadoEm: Date,
  },
  {
    timestamps: { createdAt: 'criadoEm', updatedAt: 'atualizadoEm' },
  }
);

export const Orcamento = mongoose.model('Orcamento', orcamentoSchema);
