import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createIeltsSession,
  getAllIeltsSessions,
  getIeltsSessionById,
  updateIeltsSession,
  deleteIeltsSession,
  getIeltsStats,
  createIeltsVocab,
  getAllIeltsVocab,
  getIeltsVocabById,
  updateIeltsVocab,
  deleteIeltsVocab,
  addMistakeToSession,
} from '../controllers/ielts.controller.js';

const router = Router();

router.use(authenticate);

// Stats
router.get('/stats', getIeltsStats);

// Sessions
router.get('/sessions', getAllIeltsSessions);
router.post('/sessions', createIeltsSession);
router.get('/sessions/:id', getIeltsSessionById);
router.put('/sessions/:id', updateIeltsSession);
router.delete('/sessions/:id', deleteIeltsSession);

// Mistakes
router.post('/sessions/:sessionId/mistakes', addMistakeToSession);

// Vocab
router.get('/vocab', getAllIeltsVocab);
router.post('/vocab', createIeltsVocab);
router.get('/vocab/:id', getIeltsVocabById);
router.put('/vocab/:id', updateIeltsVocab);
router.delete('/vocab/:id', deleteIeltsVocab);

export default router;
