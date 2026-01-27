import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createBudget,
  getAllBudgets,
  getBudgetById,
  updateBudget,
  deleteBudget,
  getBudgetStats,
  getBudgetComparison,
  getBudgetAlerts,
  getBudgetWithSpending,
  getBudgetByCategory,
  getBudgetTransactions,
} from '../controllers/budget.controller.js';

const router = Router();

router.use(authenticate);

// Stats and analytics endpoints (must be before :id routes)
router.get('/stats', getBudgetStats);
router.get('/comparison', getBudgetComparison);
router.get('/alerts', getBudgetAlerts);

// Category lookup (for transaction modal) - must be before :id
router.get('/category/:category', getBudgetByCategory);

// CRUD endpoints
router.get('/', getAllBudgets);
router.post('/', createBudget);
router.get('/:id', getBudgetWithSpending);
router.put('/:id', updateBudget);
router.delete('/:id', deleteBudget);

// Budget transactions
router.get('/:id/transactions', getBudgetTransactions);

export default router;
