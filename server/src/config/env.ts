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
  // Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  STRIPE_PRICE_ID: process.env.STRIPE_PRICE_ID || '',
  // Email (SMTP) — configure para envio de reset de senha em producao
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || 'MeuPDV <noreply@meupdv.com.br>',
  // URL pública do servidor (ex: https://pdvendas-xyz.onrender.com) — usado para keep-alive
  SERVER_URL: process.env.SERVER_URL || '',
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
  // Stripe: pagamentos ficam indisponíveis se não configurados, mas não derrubamos o servidor
  if (!env.STRIPE_SECRET_KEY) {
    console.warn('AVISO: STRIPE_SECRET_KEY não configurada - pagamentos via Stripe indisponíveis');
  }
  if (!env.STRIPE_WEBHOOK_SECRET) {
    console.warn('AVISO: STRIPE_WEBHOOK_SECRET não configurada - webhooks Stripe serão rejeitados');
  }
  if (!env.STRIPE_PRICE_ID) {
    console.warn('AVISO: STRIPE_PRICE_ID não configurada - checkout Stripe indisponível');
  }
}
