import { Router } from 'express';
import { financeiroController } from '../controllers/financeiro.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createContaPagarSchema, createContaReceberSchema, createDespesaSchema, updateDespesaSchema } from '../validators/financeiro.validator';

const router = Router();

router.use(authenticate);

// Contas a Pagar
router.get('/contas-pagar', financeiroController.listCP);
router.post('/contas-pagar', validate(createContaPagarSchema), financeiroController.createCP);
router.put('/contas-pagar/:id/pagar', financeiroController.payCP);
router.delete('/contas-pagar/:id', financeiroController.deleteCP);

// Contas a Receber
router.get('/contas-receber', financeiroController.listCR);
router.post('/contas-receber', validate(createContaReceberSchema), financeiroController.createCR);
router.put('/contas-receber/:id/receber', financeiroController.receiveCR);
router.delete('/contas-receber/:id', financeiroController.deleteCR);

// Despesas
router.get('/despesas', financeiroController.listDespesas);
router.get('/despesas/:id', financeiroController.getDespesa);
router.post('/despesas', validate(createDespesaSchema), financeiroController.createDespesa);
router.put('/despesas/:id', validate(updateDespesaSchema), financeiroController.updateDespesa);
router.put('/despesas/:id/pagar', financeiroController.payDespesa);
router.delete('/despesas/:id', financeiroController.deleteDespesa);

// Resumo
router.get('/resumo', financeiroController.summary);

export default router;
