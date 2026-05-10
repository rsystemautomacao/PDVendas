import Stripe from 'stripe';
import { env } from '../config/env';
import { User } from '../models/User';

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export const stripeService = {
  async createCheckoutSession(userId: string, userEmail: string, quantity: number) {
    const user = await User.findById(userId);
    if (!user) throw new Error('Usuário não encontrado');

    if (quantity < 1 || quantity > 50) throw new Error('Quantidade de licenças inválida (1 a 50)');

    let customerId = (user as any).stripeCustomerId as string | undefined;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { userId },
      });
      customerId = customer.id;
      await User.findByIdAndUpdate(userId, { stripeCustomerId: customerId });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: env.STRIPE_PRICE_ID,
          quantity,
        },
      ],
      success_url: `${env.CORS_ORIGIN}/app/config/assinatura?status=sucesso`,
      cancel_url: `${env.CORS_ORIGIN}/app/config/assinatura?status=cancelado`,
      metadata: { userId, quantity: String(quantity) },
    });

    return session.url;
  },

  async createPortalSession(userId: string) {
    const user = await User.findById(userId);
    if (!user || !(user as any).stripeCustomerId) {
      throw new Error('Cliente Stripe não encontrado');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: (user as any).stripeCustomerId,
      return_url: `${env.CORS_ORIGIN}/app/config/assinatura`,
    });

    return session.url;
  },

  async cancelSubscription(userId: string) {
    const user = await User.findById(userId);
    if (!user || !(user as any).stripeSubscriptionId) {
      throw new Error('Assinatura não encontrada');
    }

    await stripe.subscriptions.update((user as any).stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    return { message: 'Assinatura será cancelada ao fim do período atual' };
  },

  async handleWebhookEvent(event: { type: string; data: { object: any } }) {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        if (!userId) break;

        const quantity = parseInt(session.metadata?.quantity || '1', 10);

        await User.findByIdAndUpdate(userId, {
          stripeSubscriptionId: session.subscription as string,
          statusAssinatura: 'ativa',
          dataVencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          maxLicencas: quantity,
          notificacaoVencimentoEnviada: false,
        });
        console.log(`[Stripe] Assinatura ativada para user ${userId} com ${quantity} licença(s)`);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription as string;

        const user = await User.findOne({ stripeSubscriptionId: subscriptionId });
        if (user) {
          // Buscar quantidade atual da assinatura no Stripe
          let maxLicencas = (user as any).maxLicencas || 1;
          try {
            const sub = await stripe.subscriptions.retrieve(subscriptionId);
            const item = sub.items?.data?.[0];
            if (item?.quantity) maxLicencas = item.quantity;
          } catch {}

          await User.findByIdAndUpdate(user._id, {
            statusAssinatura: 'ativa',
            dataVencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            maxLicencas,
            notificacaoVencimentoEnviada: false,
          });
          console.log(`[Stripe] Pagamento recorrente confirmado para user ${user._id} com ${maxLicencas} licença(s)`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription as string;

        const user = await User.findOne({ stripeSubscriptionId: subscriptionId });
        if (user) {
          await User.findByIdAndUpdate(user._id, {
            statusAssinatura: 'expirando',
          });
          console.log(`[Stripe] Pagamento falhou para user ${user._id}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;

        const user = await User.findOne({ stripeSubscriptionId: subscription.id });
        if (user) {
          await User.findByIdAndUpdate(user._id, {
            statusAssinatura: 'vencida',
            stripeSubscriptionId: null,
          });
          console.log(`[Stripe] Assinatura cancelada para user ${user._id}`);
        }
        break;
      }
    }
  },
};
