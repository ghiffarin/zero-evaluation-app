import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createCareerActivity,
  getAllCareerActivities,
  getCareerActivityById,
  updateCareerActivity,
  deleteCareerActivity,
  createJobApplication,
  getAllJobApplications,
  getJobApplicationById,
  updateJobApplication,
  deleteJobApplication,
  getCareerStats,
  getApplicationPipeline,
} from '../controllers/career.controller.js';

const router = Router();

router.use(authenticate);

// Stats
router.get('/stats', getCareerStats);

// Activities
router.get('/activities', getAllCareerActivities);
router.post('/activities', createCareerActivity);
router.get('/activities/:id', getCareerActivityById);
router.put('/activities/:id', updateCareerActivity);
router.delete('/activities/:id', deleteCareerActivity);

// Job Applications
router.get('/applications/pipeline', getApplicationPipeline);
router.get('/applications', getAllJobApplications);
router.post('/applications', createJobApplication);
router.get('/applications/:id', getJobApplicationById);
router.put('/applications/:id', updateJobApplication);
router.delete('/applications/:id', deleteJobApplication);

export default router;
