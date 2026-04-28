import { User } from '../models/User';
import { Notificacao } from '../models/Notificacao';
import { env } from '../config/env';

/**
 * Verifica assinaturas de todos os tenants e envia notificacoes
 * de vencimento proximo ou ja vencido.
 *
 * Executado periodicamente (a cada 6 horas) pelo server.
 */
export async function checkSubscriptions() {
  const now = new Date();
  const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const in3days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const in1day = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // Buscar superadmin para enviar notificacoes do painel admin
  let superadminId: string | null = null;
  if (env.SUPERADMIN_EMAIL) {
    const superadmin = await User.findOne({ email: env.SUPERADMIN_EMAIL.toLowerCase() });
    if (superadmin) superadminId = superadmin._id.toString();
  }

  // Buscar todos os admins (tenants) com data de vencimento definida
  const tenants = await User.find({
    role: 'admin',
    ativo: true,
    dataVencimento: { $ne: null },
  });

  for (const tenant of tenants) {
    const vencimento = tenant.dataVencimento as Date;
    if (!vencimento) continue;

    const tenantId = tenant._id.toString();
    const diasRestantes = Math.ceil((vencimento.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

    // === JA VENCIDO ===
    if (vencimento <= now) {
      if ((tenant as any).statusAssinatura !== 'vencida') {
        (tenant as any).statusAssinatura = 'vencida';
        (tenant as any).notificacaoVencimentoEnviada = false; // reset para poder notificar novamente
        await tenant.save();

        // Notificar o cliente
        await Notificacao.create({
          empresaId: tenantId,
          titulo: 'Assinatura vencida',
          mensagem: `Sua assinatura venceu em ${vencimento.toLocaleDateString('pt-BR')}. Entre em contato para renovar e continuar usando o sistema.`,
          tipo: 'erro',
          userId: null,
        });

        // Notificar o superadmin
        if (superadminId) {
          await Notificacao.create({
            empresaId: superadminId,
            titulo: 'Cliente com assinatura vencida',
            mensagem: `${tenant.nome} (${tenant.email}) teve a assinatura vencida em ${vencimento.toLocaleDateString('pt-BR')}. Dias vencidos: ${Math.abs(diasRestantes)}.`,
            tipo: 'erro',
            userId: null,
          });
        }
      }
      continue;
    }

    // === VENCENDO EM ATE 7 DIAS ===
    if (vencimento <= in7days) {
      const novoStatus = vencimento <= in1day ? 'expirando' : 'expirando';

      if ((tenant as any).statusAssinatura !== 'expirando') {
        (tenant as any).statusAssinatura = novoStatus;
        await tenant.save();
      }

      // Enviar notificacao apenas em marcos importantes: 7, 3 e 1 dia(s)
      const shouldNotify =
        (diasRestantes === 7) ||
        (diasRestantes === 3) ||
        (diasRestantes === 1) ||
        (diasRestantes === 0);

      if (shouldNotify) {
        // Verificar se ja notificou hoje para este marco
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const jaNotificouHoje = await Notificacao.findOne({
          empresaId: tenantId,
          titulo: { $regex: /vencimento|vencer|expira/i },
          criadoEm: { $gte: hoje },
        });

        if (!jaNotificouHoje) {
          const urgencia = diasRestantes <= 1 ? 'erro' : diasRestantes <= 3 ? 'alerta' : 'info';
          const diasTexto = diasRestantes === 0 ? 'hoje' :
            diasRestantes === 1 ? 'amanha' :
            `em ${diasRestantes} dias`;

          // Notificar o cliente
          await Notificacao.create({
            empresaId: tenantId,
            titulo: `Assinatura vence ${diasTexto}!`,
            mensagem: `Sua assinatura vence ${diasTexto} (${vencimento.toLocaleDateString('pt-BR')}). Providencie o pagamento para evitar interrupcoes no servico.`,
            tipo: urgencia as any,
            userId: null,
          });

          // Notificar o superadmin
          if (superadminId) {
            await Notificacao.create({
              empresaId: superadminId,
              titulo: `Vencimento proximo: ${tenant.nome}`,
              mensagem: `${tenant.nome} (${tenant.email}) tem assinatura vencendo ${diasTexto} (${vencimento.toLocaleDateString('pt-BR')}).`,
              tipo: urgencia as any,
              userId: null,
            });
          }
        }
      }
    }
  }

  console.log(`[SubscriptionCheck] Verificacao concluida. ${tenants.length} tenants analisados.`);
}
