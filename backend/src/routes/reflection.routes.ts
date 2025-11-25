import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createReflectionEntry,
  getAllReflectionEntries,
  getReflectionEntryById,
  getReflectionEntryByDate,
  updateReflectionEntry,
  deleteReflectionEntry,
  upsertReflectionEntry,
  getReflectionStats,
} from '../controllers/reflection.controller.js';

const router = Router();

router.use(authenticate);

router.get('/stats', getReflectionStats);
router.get('/date/:date', getReflectionEntryByDate);
router.put('/date/:date', upsertReflectionEntry);

router.get('/', getAllReflectionEntries);
router.post('/', createReflectionEntry);
router.get('/:id', getReflectionEntryById);
router.put('/:id', updateReflectionEntry);
router.delete('/:id', deleteReflectionEntry);

export default router;
