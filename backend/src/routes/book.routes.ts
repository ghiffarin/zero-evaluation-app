import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createBook,
  getAllBooks,
  getBookById,
  updateBook,
  deleteBook,
  getBookWithSessions,
  createReadingSession,
  getAllReadingSessions,
  getReadingSessionById,
  updateReadingSession,
  deleteReadingSession,
  getReadingStats,
} from '../controllers/book.controller.js';

const router = Router();

router.use(authenticate);

// Stats
router.get('/stats', getReadingStats);

// Books
router.get('/', getAllBooks);
router.post('/', createBook);
router.get('/:id', getBookById);
router.get('/:id/sessions', getBookWithSessions);
router.put('/:id', updateBook);
router.delete('/:id', deleteBook);

// Reading Sessions
router.get('/sessions/all', getAllReadingSessions);
router.post('/sessions', createReadingSession);
router.get('/sessions/:id', getReadingSessionById);
router.put('/sessions/:id', updateReadingSession);
router.delete('/sessions/:id', deleteReadingSession);

export default router;
