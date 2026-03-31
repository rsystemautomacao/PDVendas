import cors from 'cors';
import { env } from './env';

const allowedOrigins = env.CORS_ORIGIN.split(',').map(o => o.trim());

export const corsConfig = cors({
  origin: (origin, callback) => {
    // Permitir requests sem origin (mobile apps, curl, health checks)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(allowed => origin === allowed || allowed === '*')) {
      return callback(null, true);
    }
    callback(new Error('Bloqueado pelo CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
