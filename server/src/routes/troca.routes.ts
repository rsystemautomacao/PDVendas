import { Router } from 'express';
import { trocaController } from '../controllers/troca.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createTrocaSchema, updateStatusTrocaSchema } from '../validators/troca.validator';

const router = Router();

router.use(authenticate);

router.get('/', trocaController.list);
router.get('/:id', trocaController.getById);
router.post('/', validate(createTrocaSchema), trocaController.create);
router.put('/:id/status', validate(updateStatusTrocaSchema), trocaController.updateStatus);

export default router;
