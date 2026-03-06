import mongoose from 'mongoose';
import { env } from './env';

export async function connectDB(): Promise<void> {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI);
    console.log(`MongoDB conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error('Erro ao conectar MongoDB:', error);
    process.exit(1);
  }
}

// Plugin global: converte ObjectId → string e Date → ISO string no toJSON
mongoose.plugin((schema) => {
  schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (_doc: any, ret: any) => {
      if (ret._id) ret._id = ret._id.toString();
      delete ret.id; // remove o virtual "id" duplicado
      // Converter ObjectIds e Dates recursivamente
      for (const key of Object.keys(ret)) {
        const val = ret[key];
        if (val instanceof mongoose.Types.ObjectId) {
          ret[key] = val.toString();
        } else if (val instanceof Date) {
          ret[key] = val.toISOString();
        } else if (Array.isArray(val)) {
          ret[key] = val.map((item: any) => {
            if (item && typeof item === 'object' && item._id instanceof mongoose.Types.ObjectId) {
              item._id = item._id.toString();
            }
            if (item instanceof Date) return item.toISOString();
            return item;
          });
        }
      }
      return ret;
    },
  });
});
