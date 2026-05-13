import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema, updateUserSchema, forgotPasswordSchema, resetPasswordSchema } from '../validators/auth.validator';
import { env } from '../config/env';
import { verifySMTPConnection } from '../services/email.service';

const router = Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 15,
  message: { success: false, error: 'Muitas tentativas. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { success: false, error: 'Muitas contas criadas. Tente novamente em 1 hora.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Diagnóstico de email — testa Resend e SMTP e envia email real de teste
router.get('/diag-smtp', async (req, res) => {
  const sendTo = (req.query.to as string) || '';
  const config = {
    RESEND_API_KEY: env.RESEND_API_KEY ? `configurado (${env.RESEND_API_KEY.length} chars)` : '(vazio)',
    RESEND_FROM: env.RESEND_FROM || '(vazio)',
    SMTP_HOST: env.SMTP_HOST || '(vazio)',
    SMTP_PORT: env.SMTP_PORT,
    SMTP_USER: env.SMTP_USER || '(vazio)',
    SMTP_PASS: env.SMTP_PASS ? `configurado (${env.SMTP_PASS.length} chars)` : '(vazio)',
    NODE_ENV: env.NODE_ENV,
  };

  // Testa Resend
  if (env.RESEND_API_KEY) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(env.RESEND_API_KEY);

      if (sendTo) {
        // Envia email real de teste
        const { data, error } = await resend.emails.send({
          from: env.RESEND_FROM || 'onboarding@resend.dev',
          to: sendTo,
          subject: 'Teste MeuPDV — email funcionando!',
          html: '<p>Se você recebeu este email, o Resend está funcionando corretamente.</p>',
        });
        if (error) return res.json({ ok: false, service: 'resend', error: error.message, config });
        return res.json({ ok: true, service: 'resend', message: `Email enviado para ${sendTo}`, id: data?.id, config });
      }

      // Só verifica se a chave é válida (sem enviar)
      const domains = await resend.domains.list();
      return res.json({ ok: true, service: 'resend', message: 'Chave Resend válida. Use ?to=seu@email.com para enviar email de teste.', config });
    } catch (err: any) {
      return res.json({ ok: false, service: 'resend', error: err.message, config });
    }
  }

  // Fallback: testa SMTP
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    return res.json({ ok: false, reason: 'Nenhum serviço de email configurado (RESEND_API_KEY ou SMTP vars ausentes)', config });
  }
  try {
    const nodemailer = await import('nodemailer');
    const t = nodemailer.createTransport({
      host: env.SMTP_HOST, port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
    await t.verify();
    return res.json({ ok: true, service: 'smtp', message: 'Conexão SMTP OK', config });
  } catch (err: any) {
    return res.json({ ok: false, service: 'smtp', error: err.message, code: err.code, config });
  }
});

router.post('/register', registerLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), authController.requestReset);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), authController.resetPassword);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);
router.put('/me', authenticate, validate(updateUserSchema), authController.updateMe);

export default router;
