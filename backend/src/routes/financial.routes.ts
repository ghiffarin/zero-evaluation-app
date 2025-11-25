import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getFinancialStats,
  getDailySpending,
} from '../controllers/financial.controller.js';

const router = Router();

router.use(authenticate);

router.get('/stats', getFinancialStats);
router.get('/daily/:date', getDailySpending);

router.get('/', getAllTransactions);
router.post('/', createTransaction);
router.get('/:id', getTransactionById);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;
