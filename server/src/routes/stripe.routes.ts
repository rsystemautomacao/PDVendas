import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { stripeService } from '../services/stripe.service';
import { User } from '../models/User';

const router = Router();

router.post('/create-checkout', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const quantity = parseInt(req.body.quantity, 10) || 1;
    const url = await stripeService.createCheckoutSession(req.user!._id, req.user!.email, quantity);
    res.json({ success: true, data: { url } });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get('/status', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user!._id)
      .select('maxLicencas statusAssinatura dataVencimento stripeSubscriptionId')
      .lean();
    if (!user) return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
    res.json({
      success: true,
      data: {
        maxLicencas: (user as any).maxLicencas || 1,
        statusAssinatura: (user as any).statusAssinatura || 'teste',
        dataVencimento: (user as any).dataVencimento,
        temAssinatura: !!(user as any).stripeSubscriptionId,
      },
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.patch('/update-licenses', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const quantity = parseInt(req.body.quantity, 10);
    if (!quantity) return res.status(400).json({ success: false, error: 'Quantidade inválida' });
    const result = await stripeService.updateLicenses(req.user!._id, quantity);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/portal', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const url = await stripeService.createPortalSession(req.user!._id);
    res.json({ success: true, data: { url } });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/cancel', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const result = await stripeService.cancelSubscription(req.user!._id);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

export default router;
