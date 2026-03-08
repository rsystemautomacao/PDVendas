import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createUserSchema, updateUserManagedSchema } from '../validators/user.validator';

const router = Router();

router.use(authenticate);

router.get('/', userController.list);
router.get('/:id', userController.getById);
router.post('/', validate(createUserSchema), userController.create);
router.put('/:id', validate(updateUserManagedSchema), userController.update);
router.delete('/:id', userController.remove);

export default router;
