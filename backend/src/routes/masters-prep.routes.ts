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
  createNote,
  getAllNotes,
  getNoteById,
  updateNote,
  deleteNote,
  createUniversity,
  getAllUniversities,
  getUniversityById,
  updateUniversity,
  deleteUniversity,
  createScholarship,
  getAllScholarships,
  getScholarshipById,
  updateScholarship,
  deleteScholarship,
} from '../controllers/masters-prep.controller.js';

const router = Router();

router.use(authenticate);

router.get('/stats', getMastersPrepStats);
router.get('/readiness', getReadinessBreakdown);

// Quick Notes
router.get('/notes', getAllNotes);
router.post('/notes', createNote);
router.get('/notes/:id', getNoteById);
router.put('/notes/:id', updateNote);
router.delete('/notes/:id', deleteNote);

// Universities
router.get('/universities', getAllUniversities);
router.post('/universities', createUniversity);
router.get('/universities/:id', getUniversityById);
router.put('/universities/:id', updateUniversity);
router.delete('/universities/:id', deleteUniversity);

// Scholarships
router.get('/scholarships', getAllScholarships);
router.post('/scholarships', createScholarship);
router.get('/scholarships/:id', getScholarshipById);
router.put('/scholarships/:id', updateScholarship);
router.delete('/scholarships/:id', deleteScholarship);

// Prep Items
router.get('/', getAllPrepItems);
router.post('/', createPrepItem);
router.get('/:id', getPrepItemById);
router.put('/:id', updatePrepItem);
router.delete('/:id', deletePrepItem);

// Sessions
router.post('/:itemId/sessions', addSessionToPrepItem);

export default router;
