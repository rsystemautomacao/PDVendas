import { Router } from 'express';
import { clienteController } from '../controllers/cliente.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createClienteSchema, updateClienteSchema, updateSaldoSchema } from '../validators/cliente.validator';

const router = Router();

router.use(authenticate);

router.get('/', clienteController.list);
router.get('/:id', clienteController.getById);
router.post('/', validate(createClienteSchema), clienteController.create);
router.put('/:id', validate(updateClienteSchema), clienteController.update);
router.delete('/:id', clienteController.remove);
router.patch('/:id/saldo', validate(updateSaldoSchema), clienteController.updateSaldo);

export default router;
