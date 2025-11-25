import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createWorkoutSession,
  getAllWorkoutSessions,
  getWorkoutSessionById,
  updateWorkoutSession,
  deleteWorkoutSession,
  addSetToWorkout,
  getWorkoutStats,
} from '../controllers/workout.controller.js';

const router = Router();

router.use(authenticate);

router.get('/stats', getWorkoutStats);

router.get('/', getAllWorkoutSessions);
router.post('/', createWorkoutSession);
router.get('/:id', getWorkoutSessionById);
router.put('/:id', updateWorkoutSession);
router.delete('/:id', deleteWorkoutSession);

// Sets
router.post('/:sessionId/sets', addSetToWorkout);

export default router;
