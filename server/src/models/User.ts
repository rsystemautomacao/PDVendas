import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

const empresaSchema = new Schema(
  {
    nome: String,
    cnpj: String,
    telefone: String,
    endereco: String,
    cidade: String,
    estado: String,
    logoBase64: String,
    segmento: {
      type: String,
      enum: [
        '', 'varejo_geral', 'roupas_calcados', 'informatica_eletronicos',
        'alimentos_bebidas', 'materiais_construcao', 'pet_shop',
        'papelaria', 'farmacia', 'otica', 'assistencia_tecnica',
        'auto_pecas', 'oficina_mecanica', 'outro',
      ],
      default: '',
    },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    nome: { type: String, required: [true, 'Nome é obrigatório'] },
    email: {
      type: String,
      required: [true, 'Email é obrigatório'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    senha: { type: String, required: [true, 'Senha é obrigatória'], select: false },
    role: { type: String, enum: ['admin', 'caixa', 'gerente'], default: 'admin' },
    ativo: { type: Boolean, default: true },
    ultimoLogin: Date,
    resetToken: { type: String, select: false },
    resetTokenExpires: { type: Date, select: false },
    empresa: empresaSchema,
    adminId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    permissoes: { type: Schema.Types.Mixed, default: {} },
    maxLicencas: { type: Number, default: 1 },
    // Assinatura / Vencimento
    dataVencimento: { type: Date, default: null },
    statusAssinatura: { type: String, enum: ['ativa', 'expirando', 'vencida', 'teste'], default: 'teste' },
    notificacaoVencimentoEnviada: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: 'criadoEm', updatedAt: false },
  }
);

// Hash senha antes de salvar
userSchema.pre('save', async function (next) {
  if (!this.isModified('senha')) return next();
  const salt = await bcrypt.genSalt(10);
  this.senha = await bcrypt.hash(this.senha, salt);
  next();
});

// Método para comparar senha
userSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.senha);
};

// Remove senha do JSON output
userSchema.set('toJSON', {
  transform: (_doc: any, ret: any) => {
    if (ret._id) ret._id = ret._id.toString();
    if (ret.criadoEm instanceof Date) ret.criadoEm = ret.criadoEm.toISOString();
    if (ret.ultimoLogin instanceof Date) ret.ultimoLogin = ret.ultimoLogin.toISOString();
    if (ret.dataVencimento instanceof Date) ret.dataVencimento = ret.dataVencimento.toISOString();
    delete ret.senha;
    delete ret.__v;
    delete ret.id;
    return ret;
  },
});

export const User = mongoose.model('User', userSchema);
