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
  addGoalProgress,
  getGoalProgress,
  updateGoalProgress,
  deleteGoalProgress,
} from '../controllers/goal.controller.js';

const router = Router();

router.use(authenticate);

// Stats and category routes (must be before :id routes)
router.get('/stats', getGoalStats);
router.get('/category/:category', getGoalsByCategory);

// Progress routes
router.get('/:goalId/progress', getGoalProgress);
router.post('/:goalId/progress', addGoalProgress);
router.put('/progress/:progressId', updateGoalProgress);
router.delete('/progress/:progressId', deleteGoalProgress);

// Standard CRUD routes
router.get('/', getAllGoals);
router.post('/', createGoal);
router.get('/:id', getGoalById);
router.put('/:id', updateGoal);
router.delete('/:id', deleteGoal);

export default router;
