import { Router } from 'express';
import { compraController } from '../controllers/compra.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createCompraSchema, updateCompraSchema } from '../validators/compra.validator';

const router = Router();

router.use(authenticate);

router.get('/', compraController.list);
router.post('/', validate(createCompraSchema), compraController.create);
router.put('/:id', validate(updateCompraSchema), compraController.update);
router.put('/:id/receber', compraController.receive);

export default router;
