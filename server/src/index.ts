import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { corsConfig } from './config/cors';
import { connectDB } from './config/db';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';

const app = express();

// Security & parsing
app.use(helmet());
app.use(corsConfig);
app.use(morgan(env.NODE_ENV === 'production' ? 'short' : 'dev'));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api', routes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Rota não encontrada' });
});

// Global error handler (must be last)
app.use(errorHandler);

// Start server
connectDB().then(() => {
  app.listen(env.PORT, () => {
    console.log(`MeuPDV Server rodando na porta ${env.PORT} [${env.NODE_ENV}]`);
  });
});

export default app;
