import { Router } from 'express';
import { osController } from '../controllers/os.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createOSSchema, updateOSSchema, cancelOSSchema } from '../validators/os.validator';

const router = Router();

router.use(authenticate);

router.get('/', osController.list);
router.get('/stats', osController.stats);
router.get('/:id', osController.getById);
router.post('/', validate(createOSSchema), osController.create);
router.put('/:id', validate(updateOSSchema), osController.update);
router.put('/:id/cancelar', validate(cancelOSSchema), osController.cancel);

export default router;
