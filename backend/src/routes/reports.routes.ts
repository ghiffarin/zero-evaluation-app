import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getMonthlyReport,
  getQuarterlyReport,
  getYearlyReport,
} from '../controllers/reports.controller.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/reports/monthly?year=2024&month=12
router.get('/monthly', getMonthlyReport);

// GET /api/reports/quarterly?year=2024&quarter=4
router.get('/quarterly', getQuarterlyReport);

// GET /api/reports/yearly?year=2024
router.get('/yearly', getYearlyReport);

export default router;
