import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createCareerActivity,
  getAllCareerActivities,
  getCareerActivityById,
  updateCareerActivity,
  deleteCareerActivity,
  getActivityLogs,
  createActivityLog,
  updateActivityLog,
  deleteActivityLog,
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

// Activity Logs (daily progress logs for activities)
router.get('/activities/:activityId/logs', getActivityLogs);
router.post('/activities/:activityId/logs', createActivityLog);
router.put('/logs/:logId', updateActivityLog);
router.delete('/logs/:logId', deleteActivityLog);

// Job Applications
router.get('/applications/pipeline', getApplicationPipeline);
router.get('/applications', getAllJobApplications);
router.post('/applications', createJobApplication);
router.get('/applications/:id', getJobApplicationById);
router.put('/applications/:id', updateJobApplication);
router.delete('/applications/:id', deleteJobApplication);

export default router;
