import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  // Kit management
  createKit,
  getAllKits,
  getKitById,
  updateKit,
  deleteKit,
  getKitByLocation,

  // Item management
  createItem,
  getItemById,
  updateItem,
  deleteItem,
  getItemsByKit,
  getItemsNeedingRestock,
  getExpiringItems,

  // Kit checks
  createCheck,
  getAllChecks,
  getCheckById,
  getChecksByKit,
  completeCheck,

  // Incidents
  createIncident,
  getAllIncidents,
  getIncidentById,
  updateIncident,
  deleteIncident,
  addIncidentItem,
  removeIncidentItem,
  addIncidentExpense,
  removeIncidentExpense,

  // Stats & Dashboard
  getSafetyKitStats,
  getReadinessOverview,
  getRestockReminders,
} from '../controllers/safety-kit.controller.js';

const router = Router();

// Require authentication for all routes
router.use(authenticate);

// ============================================
// Stats & Overview (place before param routes)
// ============================================
router.get('/stats', getSafetyKitStats);
router.get('/readiness', getReadinessOverview);
router.get('/restock', getRestockReminders);
router.get('/expiring', getExpiringItems);

// ============================================
// Safety Kits
// ============================================
router.get('/kits', getAllKits);
router.post('/kits', createKit);
router.get('/kits/location/:location', getKitByLocation);
router.get('/kits/:id', getKitById);
router.put('/kits/:id', updateKit);
router.delete('/kits/:id', deleteKit);

// ============================================
// Kit Items
// ============================================
router.get('/kits/:kitId/items', getItemsByKit);
router.post('/kits/:kitId/items', createItem);
router.get('/items/restock', getItemsNeedingRestock);
router.get('/items/:id', getItemById);
router.put('/items/:id', updateItem);
router.delete('/items/:id', deleteItem);

// ============================================
// Kit Checks
// ============================================
router.get('/checks', getAllChecks);
router.post('/checks', createCheck);
router.get('/kits/:kitId/checks', getChecksByKit);
router.get('/checks/:id', getCheckById);
router.post('/checks/:id/complete', completeCheck);

// ============================================
// Incidents
// ============================================
router.get('/incidents', getAllIncidents);
router.post('/incidents', createIncident);
router.get('/incidents/:id', getIncidentById);
router.put('/incidents/:id', updateIncident);
router.delete('/incidents/:id', deleteIncident);

// Incident Items & Expenses
router.post('/incidents/:incidentId/items', addIncidentItem);
router.delete('/incidents/:incidentId/items/:itemId', removeIncidentItem);
router.post('/incidents/:incidentId/expenses', addIncidentExpense);
router.delete('/incidents/:incidentId/expenses/:expenseId', removeIncidentExpense);

export default router;
