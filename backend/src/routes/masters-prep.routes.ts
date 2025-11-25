import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createPrepItem,
  getAllPrepItems,
  getPrepItemById,
  updatePrepItem,
  deletePrepItem,
  addSessionToPrepItem,
  getMastersPrepStats,
  getReadinessBreakdown,
} from '../controllers/masters-prep.controller.js';

const router = Router();

router.use(authenticate);

router.get('/stats', getMastersPrepStats);
router.get('/readiness', getReadinessBreakdown);

router.get('/', getAllPrepItems);
router.post('/', createPrepItem);
router.get('/:id', getPrepItemById);
router.put('/:id', updatePrepItem);
router.delete('/:id', deletePrepItem);

// Sessions
router.post('/:itemId/sessions', addSessionToPrepItem);

export default router;
