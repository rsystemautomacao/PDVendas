import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { env } from '../config/env';

// ─── Resend (recomendado em produção — funciona via HTTPS, não bloqueado por Render) ───

function createResendClient() {
  if (!env.RESEND_API_KEY) return null;
  return new Resend(env.RESEND_API_KEY);
}

// ─── Nodemailer / SMTP (fallback, pode ser bloqueado em alguns provedores) ───

function createSMTPTransporter() {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
}

/** Testa a conexão na inicialização do servidor */
export async function verifySMTPConnection(): Promise<void> {
  const resend = createResendClient();
  if (resend) {
    console.log('[Email] ✅ Resend configurado — emails enviados via API HTTPS');
    return;
  }

  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    console.warn('[Email] ⚠️  Nenhum serviço de email configurado (RESEND_API_KEY ou SMTP_HOST/USER/PASS ausentes) — emails de reset desativados.');
    return;
  }

  const transporter = createSMTPTransporter()!;
  try {
    await transporter.verify();
    console.log(`[Email] ✅ Conexão SMTP OK — ${env.SMTP_USER} via ${env.SMTP_HOST}:${env.SMTP_PORT}`);
  } catch (err: any) {
    console.error(`[Email] ❌ Falha na conexão SMTP (${env.SMTP_HOST}:${env.SMTP_PORT} / ${env.SMTP_USER}): ${err.message}`);
    console.error('[Email]    Dica: Use RESEND_API_KEY para evitar bloqueios de porta em produção.');
  }
}

function buildResetEmailHTML(code: string): string {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
      <div style="text-align:center;margin-bottom:24px">
        <div style="display:inline-flex;align-items:center;justify-content:center;
                    width:56px;height:56px;border-radius:16px;
                    background:linear-gradient(135deg,#6366f1,#4f46e5)">
          <span style="font-size:24px">🔐</span>
        </div>
        <h1 style="margin:12px 0 4px;font-size:22px;color:#1e1b4b">Redefinição de Senha</h1>
        <p style="margin:0;color:#6b7280;font-size:14px">MeuPDV — Sistema de Gestão Comercial</p>
      </div>

      <p style="color:#374151;font-size:15px">Recebemos uma solicitação para redefinir a senha da sua conta.</p>
      <p style="color:#374151;font-size:15px">Use o código abaixo para concluir o processo:</p>

      <div style="background:#f5f3ff;border:2px solid #a5b4fc;border-radius:12px;
                  padding:20px;text-align:center;margin:24px 0">
        <p style="margin:0 0 6px;font-size:12px;color:#6d28d9;font-weight:600;
                  letter-spacing:.1em;text-transform:uppercase">Seu código</p>
        <p style="margin:0;font-size:36px;font-weight:800;letter-spacing:.25em;color:#4f46e5">${code}</p>
        <p style="margin:8px 0 0;font-size:12px;color:#7c3aed">Válido por 30 minutos</p>
      </div>

      <p style="color:#6b7280;font-size:13px">
        Se você não solicitou a redefinição de senha, ignore este email.
        Sua senha permanece a mesma.
      </p>

      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
      <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0">
        MeuPDV · Este é um email automático, não responda.
      </p>
    </div>
  `;
}

export async function sendPasswordResetEmail(to: string, code: string): Promise<boolean> {
  const html = buildResetEmailHTML(code);
  const subject = `${code} — Código de recuperação MeuPDV`;

  // Tenta Resend primeiro (funciona via HTTPS, não sofre bloqueio de porta)
  const resend = createResendClient();
  if (resend) {
    try {
      const { data, error } = await resend.emails.send({
        from: env.RESEND_FROM || env.SMTP_FROM || 'MeuPDV <onboarding@resend.dev>',
        to,
        subject,
        html,
      });
      if (error) {
        console.error(`[Email] ❌ Resend falhou ao enviar para ${to}: ${error.message}`);
        return false;
      }
      console.log(`[Email] ✅ Email enviado via Resend para ${to} — id: ${data?.id}`);
      return true;
    } catch (err: any) {
      console.error(`[Email] ❌ Resend erro inesperado: ${err.message}`);
      return false;
    }
  }

  // Fallback: SMTP / Nodemailer
  const transporter = createSMTPTransporter();
  if (!transporter) {
    console.warn('[Email] Nenhum serviço de email configurado — reset não enviado.');
    return false;
  }

  try {
    const info = await transporter.sendMail({ from: env.SMTP_FROM, to, subject, html });
    console.log(`[Email] ✅ Email enviado via SMTP para ${to} — messageId: ${info.messageId}`);
    return true;
  } catch (err: any) {
    console.error(`[Email] ❌ SMTP falhou ao enviar para ${to}: ${err.message} (code: ${err.code})`);
    return false;
  }
}
