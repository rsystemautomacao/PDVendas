import { Router } from 'express';
import { orcamentoController } from '../controllers/orcamento.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createOrcamentoSchema, updateOrcamentoSchema } from '../validators/orcamento.validator';

const router = Router();

router.use(authenticate);

router.get('/', orcamentoController.list);
router.get('/stats', orcamentoController.stats);
router.get('/:id', orcamentoController.getById);
router.post('/', validate(createOrcamentoSchema), orcamentoController.create);
router.put('/:id', validate(updateOrcamentoSchema), orcamentoController.update);
router.post('/:id/converter-os', orcamentoController.convertToOS);

export default router;
