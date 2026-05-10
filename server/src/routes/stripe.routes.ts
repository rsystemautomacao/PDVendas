import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { stripeService } from '../services/stripe.service';

const router = Router();

router.post('/create-checkout', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const url = await stripeService.createCheckoutSession(req.user!._id, req.user!.email);
    res.json({ success: true, data: { url } });
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
