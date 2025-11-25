import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createJournalEntry,
  getAllJournalEntries,
  getJournalEntryById,
  updateJournalEntry,
  deleteJournalEntry,
  getJournalStats,
} from '../controllers/journal.controller.js';

const router = Router();

router.use(authenticate);

router.get('/stats', getJournalStats);

router.get('/', getAllJournalEntries);
router.post('/', createJournalEntry);
router.get('/:id', getJournalEntryById);
router.put('/:id', updateJournalEntry);
router.delete('/:id', deleteJournalEntry);

export default router;
