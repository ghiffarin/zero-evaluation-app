import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createDailyLog,
  getAllDailyLogs,
  getDailyLogById,
  getDailyLogByDate,
  updateDailyLog,
  deleteDailyLog,
  upsertDailyLog,
  getWeeklySummary,
} from '../controllers/daily-log.controller.js';

const router = Router();

router.use(authenticate);

router.get('/weekly-summary', getWeeklySummary);
router.get('/date/:date', getDailyLogByDate);
router.put('/date/:date', upsertDailyLog);

router.get('/', getAllDailyLogs);
router.post('/', createDailyLog);
router.get('/:id', getDailyLogById);
router.put('/:id', updateDailyLog);
router.delete('/:id', deleteDailyLog);

export default router;
