import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createSkillSession,
  getAllSkillSessions,
  getSkillSessionById,
  updateSkillSession,
  deleteSkillSession,
  getSkillStats,
} from '../controllers/skill.controller.js';

const router = Router();

router.use(authenticate);

router.get('/stats', getSkillStats);

router.get('/', getAllSkillSessions);
router.post('/', createSkillSession);
router.get('/:id', getSkillSessionById);
router.put('/:id', updateSkillSession);
router.delete('/:id', deleteSkillSession);

export default router;
