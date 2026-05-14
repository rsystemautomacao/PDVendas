import mongoose, { Schema } from 'mongoose';

const promocaoSchema = new Schema(
  {
    empresaId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    nome: { type: String, required: [true, 'Nome da promocao e obrigatorio'] },
    descricao: String,
    percentual: { type: Number, required: true, min: 1, max: 99 },
    // Produtos que participam da promocao (array de IDs)
    produtos: [{ type: Schema.Types.ObjectId, ref: 'Produto' }],
    // Filtros opcionais — se definidos, aplicam a todos os produtos que batam
    grupo: String,
    categoria: String,
    ativo: { type: Boolean, default: true },
    dataInicio: { type: Date, default: Date.now },
    dataFim: Date,
  },
  {
    timestamps: { createdAt: 'criadoEm', updatedAt: 'atualizadoEm' },
  }
);

export const Promocao = mongoose.model('Promocao', promocaoSchema);
