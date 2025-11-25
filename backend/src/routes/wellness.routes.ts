import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createWellnessEntry,
  getAllWellnessEntries,
  getWellnessEntryById,
  getWellnessEntryByDate,
  updateWellnessEntry,
  deleteWellnessEntry,
  upsertWellnessEntry,
  getWellnessStats,
} from '../controllers/wellness.controller.js';

const router = Router();

router.use(authenticate);

router.get('/stats', getWellnessStats);
router.get('/date/:date', getWellnessEntryByDate);
router.put('/date/:date', upsertWellnessEntry);

router.get('/', getAllWellnessEntries);
router.post('/', createWellnessEntry);
router.get('/:id', getWellnessEntryById);
router.put('/:id', updateWellnessEntry);
router.delete('/:id', deleteWellnessEntry);

export default router;
