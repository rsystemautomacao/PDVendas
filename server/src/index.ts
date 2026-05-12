import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { corsConfig } from './config/cors';
import { connectDB } from './config/db';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';
import webhookRoutes from './routes/webhook.routes';
import { checkSubscriptions } from './jobs/subscriptionCheck';
import { Session } from './models/Session';

const app = express();

// Desabilitar redirect automático de trailing slash
app.set('strict routing', true);

// Security & parsing
app.use(helmet());
app.use(corsConfig);
app.use(morgan(env.NODE_ENV === 'production' ? 'short' : 'dev'));

// Webhook do Stripe precisa do body raw (antes do express.json)
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);

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

// Limpa sessões expiradas ou inativas periodicamente
async function runSessionCleanup() {
  try {
    const inactivityHours = env.SESSION_INACTIVITY_HOURS;
    const now = new Date();
    const inactivityCutoff = new Date(now.getTime() - inactivityHours * 3600 * 1000);
    const result = await Session.updateMany(
      {
        isValid: true,
        $or: [
          { expiresAt: { $lte: now } },
          { lastActivity: { $lte: inactivityCutoff } },
        ],
      },
      { isValid: false, invalidatedReason: 'inactivity', invalidatedAt: now },
    );
    if (result.modifiedCount > 0) {
      console.log(`[SessionCleanup] ${result.modifiedCount} sessão(ões) inativas invalidadas`);
    }
  } catch (err: any) {
    console.error('[SessionCleanup] Erro:', err.message);
  }
}

// Start server
connectDB().then(() => {
  app.listen(env.PORT, () => {
    console.log(`MeuPDV Server rodando na porta ${env.PORT} [${env.NODE_ENV}]`);

    // Verificar assinaturas ao iniciar
    checkSubscriptions().catch(err => console.error('[SubscriptionCheck] Erro:', err.message));

    // Verificar assinaturas a cada 6 horas
    setInterval(() => {
      checkSubscriptions().catch(err => console.error('[SubscriptionCheck] Erro:', err.message));
    }, 6 * 60 * 60 * 1000);

    // Limpar sessões expiradas/inativas a cada hora
    runSessionCleanup();
    setInterval(runSessionCleanup, 60 * 60 * 1000);
  });
});

export default app;
