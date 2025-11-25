import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectWithActivities,
} from '../controllers/project.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', getAllProjects);
router.post('/', createProject);
router.get('/:id', getProjectById);
router.get('/:id/activities', getProjectWithActivities);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

export default router;
