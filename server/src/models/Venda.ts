import mongoose, { Schema } from 'mongoose';

const itemVendaSchema = new Schema(
  {
    produtoId: { type: Schema.Types.ObjectId, ref: 'Produto', required: true },
    nome: String,
    codigo: String,
    quantidade: { type: Number, required: true, min: 0.001 },
    precoUnitario: { type: Number, required: true, min: 0 },
    desconto: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    // Dados de variação (roupas)
    variacaoId: { type: Schema.Types.ObjectId },
    tamanho: String,
    cor: String,
    // Número de série (informática)
    serialNumero: String,
    // Garantia
    garantiaAte: Date,
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

const vendaSchema = new Schema(
  {
    empresaId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    numero: { type: Number, required: true },
    clienteId: { type: Schema.Types.ObjectId, ref: 'Cliente' },
    clienteNome: String,
    itens: [itemVendaSchema],
    subtotal: { type: Number, required: true, min: 0 },
    desconto: { type: Number, default: 0, min: 0 },
    descontoTipo: { type: String, enum: ['valor', 'percentual'], default: 'valor' },
    total: { type: Number, required: true, min: 0 },
    pagamentos: [pagamentoSchema],
    troco: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['finalizada', 'orcamento', 'cancelada'],
      default: 'finalizada',
    },
    caixaId: { type: Schema.Types.ObjectId, ref: 'Caixa', required: true },
    vendedorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    vendedorNome: String,
    observacoes: String,
    canceladoEm: Date,
    motivoCancelamento: String,
  },
  {
    timestamps: { createdAt: 'criadoEm', updatedAt: false },
  }
);

vendaSchema.index({ empresaId: 1, numero: 1 }, { unique: true });

export const Venda = mongoose.model('Venda', vendaSchema);
