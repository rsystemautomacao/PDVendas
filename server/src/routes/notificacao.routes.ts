import { Router } from 'express';
import { notificacaoController } from '../controllers/notificacao.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', notificacaoController.list);
router.patch('/marcar-todas', notificacaoController.markAllRead);
router.delete('/lidas', notificacaoController.removeAllRead);
router.patch('/:id/lida', notificacaoController.markRead);
router.delete('/:id', notificacaoController.remove);

export default router;
