import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  MONGODB_URI: process.env.MONGODB_URI || '',
  JWT_SECRET: process.env.JWT_SECRET || 'meupdv-dev-secret-2024',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  NODE_ENV: process.env.NODE_ENV || 'development',
  SUPERADMIN_EMAIL: process.env.SUPERADMIN_EMAIL || '',
  // Sessões sem atividade por mais que este tempo são consideradas abandonadas e liberadas automaticamente
  SESSION_INACTIVITY_HOURS: parseInt(process.env.SESSION_INACTIVITY_HOURS || '4', 10),
};

// Validate required env vars
if (!env.MONGODB_URI) {
  console.error('FATAL: MONGODB_URI não configurada no .env');
  process.exit(1);
}

if (env.NODE_ENV === 'production') {
  if (env.JWT_SECRET === 'meupdv-dev-secret-2024') {
    console.error('FATAL: JWT_SECRET deve ser configurado em produção (não use o valor padrão)');
    process.exit(1);
  }
  if (!env.SUPERADMIN_EMAIL) {
    console.warn('AVISO: SUPERADMIN_EMAIL não configurado - painel admin ficará inacessível');
  }
}
