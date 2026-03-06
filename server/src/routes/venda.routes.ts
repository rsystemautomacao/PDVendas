import { Router } from 'express';
import { vendaController } from '../controllers/venda.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createVendaSchema, cancelVendaSchema } from '../validators/venda.validator';

const router = Router();

router.use(authenticate);

router.get('/', vendaController.list);
router.get('/hoje', vendaController.today);
router.get('/stats', vendaController.stats);
router.get('/:id', vendaController.getById);
router.post('/', validate(createVendaSchema), vendaController.create);
router.put('/:id/cancelar', validate(cancelVendaSchema), vendaController.cancel);

export default router;
