import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  validateImport,
  importJSON,
} from '../controllers/import.controller.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validate import data (preview before import)
router.post('/validate', validateImport);

// Import data from JSON
router.post('/json', importJSON);

export default router;
