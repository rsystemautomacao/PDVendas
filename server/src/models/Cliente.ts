import mongoose, { Schema } from 'mongoose';

const enderecoSchema = new Schema(
  {
    cep: String,
    logradouro: String,
    numero: String,
    complemento: String,
    bairro: String,
    cidade: String,
    estado: String,
  },
  { _id: false }
);

const clienteSchema = new Schema(
  {
    empresaId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tipo: { type: String, enum: ['fisica', 'juridica'], default: 'fisica' },
    nome: { type: String, required: [true, 'Nome é obrigatório'] },
    email: { type: String, lowercase: true, trim: true },
    telefone: String,
    celular: String,
    cpfCnpj: String,
    rgIe: String,
    dataNascimento: String,
    genero: String,
    endereco: enderecoSchema,
    limiteCredito: { type: Number, default: 0, min: 0 },
    saldoDevedor: { type: Number, default: 0, min: 0 },
    ativo: { type: Boolean, default: true },
    aprovado: { type: Boolean, default: true },
    observacoes: String,
  },
  {
    timestamps: { createdAt: 'criadoEm', updatedAt: 'atualizadoEm' },
  }
);

clienteSchema.index({ nome: 'text', cpfCnpj: 'text', email: 'text' });

export const Cliente = mongoose.model('Cliente', clienteSchema);
