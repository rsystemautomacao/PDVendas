import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { env } from '../config/env';
import { stripeService } from '../services/stripe.service';

const router = Router();
const stripe = new Stripe(env.STRIPE_SECRET_KEY);

router.post('/stripe', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;

  if (!sig) {
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  let event: any;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error('[Webhook] Signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  try {
    await stripeService.handleWebhookEvent(event);
  } catch (err: any) {
    console.error('[Webhook] Error processing event:', err.message);
  }

  res.json({ received: true });
});

export default router;
