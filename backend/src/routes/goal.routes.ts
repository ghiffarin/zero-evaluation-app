import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createGoal,
  getAllGoals,
  getGoalById,
  updateGoal,
  deleteGoal,
  getGoalsByCategory,
  getGoalStats,
} from '../controllers/goal.controller.js';

const router = Router();

router.use(authenticate);

router.get('/stats', getGoalStats);
router.get('/category/:category', getGoalsByCategory);

router.get('/', getAllGoals);
router.post('/', createGoal);
router.get('/:id', getGoalById);
router.put('/:id', updateGoal);
router.delete('/:id', deleteGoal);

export default router;
