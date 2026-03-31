import { Router } from 'express';
import { produtoController } from '../controllers/produto.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createProdutoSchema, updateProdutoSchema, updateEstoqueSchema } from '../validators/produto.validator';

const router = Router();

router.use(authenticate);

router.get('/', produtoController.list);
router.get('/baixo-estoque', produtoController.lowStock);
router.get('/:id', produtoController.getById);
router.post('/', validate(createProdutoSchema), produtoController.create);
router.put('/:id', validate(updateProdutoSchema), produtoController.update);
router.delete('/:id', produtoController.remove);
router.patch('/:id/estoque', validate(updateEstoqueSchema), produtoController.updateStock);

export default router;
