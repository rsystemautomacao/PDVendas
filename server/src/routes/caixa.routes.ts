import { Router } from 'express';
import { caixaController } from '../controllers/caixa.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { abrirCaixaSchema, movimentacaoSchema } from '../validators/caixa.validator';

const router = Router();

router.use(authenticate);

router.get('/', caixaController.list);
router.get('/aberto', caixaController.getOpen);
router.get('/:id', caixaController.getById);
router.post('/abrir', validate(abrirCaixaSchema), caixaController.open);
router.put('/:id/fechar', caixaController.close);
router.post('/:id/movimentacoes', validate(movimentacaoSchema), caixaController.addMovement);

export default router;
