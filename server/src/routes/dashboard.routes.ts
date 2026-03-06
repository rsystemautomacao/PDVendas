import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, dashboardController.getKPIs);

export default router;
