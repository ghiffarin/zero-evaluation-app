import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getExportSummary,
  exportCSV,
  exportSQL,
  exportJSON,
} from '../controllers/export.controller.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get export summary (record counts per table)
router.get('/summary', getExportSummary);

// Export as CSV
router.get('/csv', exportCSV);

// Export as SQL
router.get('/sql', exportSQL);

// Export as JSON
router.get('/json', exportJSON);

export default router;
