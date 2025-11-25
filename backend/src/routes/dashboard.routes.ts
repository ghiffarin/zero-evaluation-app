import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getTodaySummary,
  getWeeklyOverview,
  getMonthlyStats,
  getInsights,
  getChartData,
} from '../controllers/dashboard.controller.js';

const router = Router();

router.use(authenticate);

router.get('/today', getTodaySummary);
router.get('/weekly', getWeeklyOverview);
router.get('/monthly', getMonthlyStats);
router.get('/insights', getInsights);
router.get('/charts', getChartData);

export default router;
