import { Request, Response } from 'express';
import prisma from '../utils/prisma.js';
import { sendSuccess, sendError, sendCreated, sendNotFound } from '../utils/response.js';
import { addDaysUTC, getUserToday } from '../utils/date.js';
import { withoutProtectedFields } from '../utils/sanitize.js';
import { createCrudController } from '../services/crud.service.js';

// ============================================
// SAFETY KITS
// ============================================

const kitCrud = createCrudController({
  model: 'safetyKit',
  include: {
    items: { orderBy: { priority: 'asc' } },
  },
  orderBy: { createdAt: 'desc' },
  searchFields: ['name', 'description'],
  dateField: 'createdAt',
});

export const createKit = kitCrud.create;
export const getAllKits = kitCrud.getAll;
export const getKitById = kitCrud.getOne;
export const updateKit = kitCrud.update;
export const deleteKit = kitCrud.delete;

export const getKitByLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { location } = req.params;

    const kit = await prisma.safetyKit.findFirst({
      where: { userId, location: location as any },
      include: {
        items: { orderBy: { priority: 'asc' } },
      },
    });

    if (!kit) {
      sendNotFound(res, 'Kit not found for this location');
      return;
    }

    sendSuccess(res, kit);
  } catch (error) {
    console.error('Get kit by location error:', error);
    sendError(res, 'Failed to fetch kit', 500);
  }
};

// ============================================
// SAFETY KIT ITEMS
// ============================================

export const getItemsByKit = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { kitId } = req.params;

    // Verify kit belongs to user
    const kit = await prisma.safetyKit.findFirst({
      where: { id: kitId, userId },
    });

    if (!kit) {
      sendNotFound(res, 'Kit not found');
      return;
    }

    const items = await prisma.safetyKitItem.findMany({
      where: { safetyKitId: kitId },
      orderBy: [{ priority: 'asc' }, { category: 'asc' }],
    });

    sendSuccess(res, items);
  } catch (error) {
    console.error('Get items by kit error:', error);
    sendError(res, 'Failed to fetch items', 500);
  }
};

export const createItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { kitId } = req.params;

    // Verify kit belongs to user
    const kit = await prisma.safetyKit.findFirst({
      where: { id: kitId, userId },
    });

    if (!kit) {
      sendNotFound(res, 'Kit not found');
      return;
    }

    const item = await prisma.safetyKitItem.create({
      data: {
        ...withoutProtectedFields(req.body),
        safetyKitId: kitId,
        expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : null,
        purchaseDate: req.body.purchaseDate ? new Date(req.body.purchaseDate) : null,
      },
    });

    sendCreated(res, item, 'Item created successfully');
  } catch (error) {
    console.error('Create item error:', error);
    sendError(res, 'Failed to create item', 500);
  }
};

export const getItemById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const item = await prisma.safetyKitItem.findFirst({
      where: { id },
      include: {
        safetyKit: true,
      },
    });

    if (!item || item.safetyKit.userId !== userId) {
      sendNotFound(res, 'Item not found');
      return;
    }

    sendSuccess(res, item);
  } catch (error) {
    console.error('Get item by id error:', error);
    sendError(res, 'Failed to fetch item', 500);
  }
};

export const updateItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    // Verify ownership
    const existingItem = await prisma.safetyKitItem.findFirst({
      where: { id },
      include: { safetyKit: true },
    });

    if (!existingItem || existingItem.safetyKit.userId !== userId) {
      sendNotFound(res, 'Item not found');
      return;
    }

    const item = await prisma.safetyKitItem.update({
      where: { id },
      data: {
        ...withoutProtectedFields(req.body, ['safetyKitId']),
        expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : undefined,
        purchaseDate: req.body.purchaseDate ? new Date(req.body.purchaseDate) : undefined,
        lastCheckedAt: req.body.lastCheckedAt ? new Date(req.body.lastCheckedAt) : undefined,
      },
    });

    sendSuccess(res, item, 'Item updated successfully');
  } catch (error) {
    console.error('Update item error:', error);
    sendError(res, 'Failed to update item', 500);
  }
};

export const deleteItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    // Verify ownership
    const existingItem = await prisma.safetyKitItem.findFirst({
      where: { id },
      include: { safetyKit: true },
    });

    if (!existingItem || existingItem.safetyKit.userId !== userId) {
      sendNotFound(res, 'Item not found');
      return;
    }

    await prisma.safetyKitItem.delete({
      where: { id },
    });

    sendSuccess(res, null, 'Item deleted successfully');
  } catch (error) {
    console.error('Delete item error:', error);
    sendError(res, 'Failed to delete item', 500);
  }
};

export const getItemsNeedingRestock = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const items = await prisma.safetyKitItem.findMany({
      where: {
        safetyKit: { userId },
        OR: [
          { status: 'low' },
          { status: 'out' },
          { status: 'replace' },
        ],
      },
      include: {
        safetyKit: { select: { name: true, location: true } },
      },
      orderBy: [{ priority: 'asc' }, { status: 'asc' }],
    });

    sendSuccess(res, items);
  } catch (error) {
    console.error('Get items needing restock error:', error);
    sendError(res, 'Failed to fetch items', 500);
  }
};

export const getExpiringItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const daysAhead = parseInt(req.query.days as string) || 30;

    const today = await getUserToday(userId);
    const futureDate = addDaysUTC(today, daysAhead);

    const items = await prisma.safetyKitItem.findMany({
      where: {
        safetyKit: { userId },
        expiryDate: {
          lte: futureDate,
          gte: today,
        },
      },
      include: {
        safetyKit: { select: { name: true, location: true } },
      },
      orderBy: { expiryDate: 'asc' },
    });

    sendSuccess(res, items);
  } catch (error) {
    console.error('Get expiring items error:', error);
    sendError(res, 'Failed to fetch expiring items', 500);
  }
};

// ============================================
// KIT CHECKS
// ============================================

export const getAllChecks = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { kitId, startDate, endDate, page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { userId };
    if (kitId) where.safetyKitId = kitId;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const [checks, total] = await Promise.all([
      prisma.kitCheck.findMany({
        where,
        include: {
          safetyKit: { select: { name: true, location: true } },
          lines: {
            include: { safetyKitItem: { select: { name: true, category: true, priority: true } } },
          },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.kitCheck.count({ where }),
    ]);

    sendSuccess(res, checks, undefined, 200, {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error('Get all checks error:', error);
    sendError(res, 'Failed to fetch checks', 500);
  }
};

export const createCheck = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { safetyKitId, date, checkType, notes } = req.body;

    // Verify kit belongs to user
    const kit = await prisma.safetyKit.findFirst({
      where: { id: safetyKitId, userId },
      include: { items: true },
    });

    if (!kit) {
      sendNotFound(res, 'Kit not found');
      return;
    }

    const check = await prisma.kitCheck.create({
      data: {
        userId,
        safetyKitId,
        date: date ? new Date(date) : new Date(),
        checkType: checkType || 'weekly',
        totalItems: kit.items.length,
        notes,
      },
      include: {
        safetyKit: { select: { name: true, location: true } },
      },
    });

    sendCreated(res, check, 'Check started successfully');
  } catch (error) {
    console.error('Create check error:', error);
    sendError(res, 'Failed to create check', 500);
  }
};

export const getCheckById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const check = await prisma.kitCheck.findFirst({
      where: { id, userId },
      include: {
        safetyKit: {
          include: { items: { orderBy: { priority: 'asc' } } },
        },
        lines: {
          include: { safetyKitItem: true },
        },
      },
    });

    if (!check) {
      sendNotFound(res, 'Check not found');
      return;
    }

    sendSuccess(res, check);
  } catch (error) {
    console.error('Get check by id error:', error);
    sendError(res, 'Failed to fetch check', 500);
  }
};

export const getChecksByKit = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { kitId } = req.params;

    // Verify kit belongs to user
    const kit = await prisma.safetyKit.findFirst({
      where: { id: kitId, userId },
    });

    if (!kit) {
      sendNotFound(res, 'Kit not found');
      return;
    }

    const checks = await prisma.kitCheck.findMany({
      where: { safetyKitId: kitId },
      include: {
        lines: {
          include: { safetyKitItem: { select: { name: true, category: true } } },
        },
      },
      orderBy: { date: 'desc' },
    });

    sendSuccess(res, checks);
  } catch (error) {
    console.error('Get checks by kit error:', error);
    sendError(res, 'Failed to fetch checks', 500);
  }
};

export const completeCheck = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { lines, duration, notes } = req.body;

    // Verify check belongs to user
    const existingCheck = await prisma.kitCheck.findFirst({
      where: { id, userId },
      include: {
        safetyKit: { include: { items: true } },
      },
    });

    if (!existingCheck) {
      sendNotFound(res, 'Check not found');
      return;
    }

    // Priority weights for readiness calculation
    const priorityWeights: Record<string, number> = {
      critical: 3,
      high: 2,
      normal: 1,
    };

    // Calculate readiness score
    let totalWeight = 0;
    let achievedWeight = 0;
    let itemsReady = 0;
    let itemsIssue = 0;

    // Create check lines and update item statuses
    const checkLines = [];
    for (const line of lines) {
      const item = existingCheck.safetyKit.items.find((i) => i.id === line.safetyKitItemId);
      if (!item) continue;

      const weight = priorityWeights[item.priority] || 1;
      totalWeight += weight;

      if (line.isOk) {
        achievedWeight += weight;
        itemsReady++;
      } else {
        itemsIssue++;
      }

      checkLines.push({
        kitCheckId: id,
        safetyKitItemId: line.safetyKitItemId,
        statusFound: line.statusFound,
        quantityFound: line.quantityFound,
        isOk: line.isOk,
        notes: line.notes || null,
      });

      // Update item status and lastCheckedAt
      await prisma.safetyKitItem.update({
        where: { id: line.safetyKitItemId },
        data: {
          status: line.statusFound,
          quantity: line.quantityFound,
          lastCheckedAt: new Date(),
        },
      });
    }

    const readinessScore = totalWeight > 0 ? (achievedWeight / totalWeight) * 100 : 0;

    // Delete existing lines if re-completing
    await prisma.kitCheckLine.deleteMany({
      where: { kitCheckId: id },
    });

    // Create new lines
    await prisma.kitCheckLine.createMany({
      data: checkLines,
    });

    // Update check with results
    const check = await prisma.kitCheck.update({
      where: { id },
      data: {
        readinessScore,
        itemsReady,
        itemsIssue,
        totalItems: lines.length,
        duration,
        notes: notes || existingCheck.notes,
      },
      include: {
        safetyKit: { select: { name: true, location: true } },
        lines: {
          include: { safetyKitItem: true },
        },
      },
    });

    sendSuccess(res, check, 'Check completed successfully');
  } catch (error) {
    console.error('Complete check error:', error);
    sendError(res, 'Failed to complete check', 500);
  }
};

// ============================================
// INCIDENTS
// ============================================

const incidentCrud = createCrudController({
  model: 'incident',
  include: {
    items: { include: { safetyKitItem: true } },
    expenses: true,
  },
  orderBy: { date: 'desc' },
  searchFields: ['title', 'description', 'location'],
});

export const createIncident = incidentCrud.create;
export const getAllIncidents = incidentCrud.getAll;
export const getIncidentById = incidentCrud.getOne;
export const updateIncident = incidentCrud.update;
export const deleteIncident = incidentCrud.delete;

export const addIncidentItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { incidentId } = req.params;
    const { safetyKitItemId, quantityUsed, wasHelpful, wasMissing, notes } = req.body;

    // Verify incident belongs to user
    const incident = await prisma.incident.findFirst({
      where: { id: incidentId, userId },
    });

    if (!incident) {
      sendNotFound(res, 'Incident not found');
      return;
    }

    // Verify item belongs to user
    const item = await prisma.safetyKitItem.findFirst({
      where: { id: safetyKitItemId },
      include: { safetyKit: true },
    });

    if (!item || item.safetyKit.userId !== userId) {
      sendNotFound(res, 'Item not found');
      return;
    }

    const incidentItem = await prisma.incidentItem.create({
      data: {
        incidentId,
        safetyKitItemId,
        quantityUsed: quantityUsed || 1,
        wasHelpful: wasHelpful ?? true,
        wasMissing: wasMissing ?? false,
        notes,
      },
      include: { safetyKitItem: true },
    });

    // Optionally reduce item quantity if used
    if (!wasMissing && quantityUsed) {
      await prisma.safetyKitItem.update({
        where: { id: safetyKitItemId },
        data: {
          quantity: { decrement: quantityUsed },
        },
      });
    }

    sendCreated(res, incidentItem, 'Item added to incident');
  } catch (error) {
    console.error('Add incident item error:', error);
    sendError(res, 'Failed to add item to incident', 500);
  }
};

export const removeIncidentItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { incidentId, itemId } = req.params;

    // Verify incident belongs to user
    const incident = await prisma.incident.findFirst({
      where: { id: incidentId, userId },
    });

    if (!incident) {
      sendNotFound(res, 'Incident not found');
      return;
    }

    await prisma.incidentItem.delete({
      where: { id: itemId },
    });

    sendSuccess(res, null, 'Item removed from incident');
  } catch (error) {
    console.error('Remove incident item error:', error);
    sendError(res, 'Failed to remove item from incident', 500);
  }
};

export const addIncidentExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { incidentId } = req.params;
    const { category, description, amountIdr, date, notes } = req.body;

    // Verify incident belongs to user
    const incident = await prisma.incident.findFirst({
      where: { id: incidentId, userId },
    });

    if (!incident) {
      sendNotFound(res, 'Incident not found');
      return;
    }

    const expense = await prisma.incidentExpense.create({
      data: {
        incidentId,
        category,
        description,
        amountIdr,
        date: date ? new Date(date) : new Date(),
        notes,
      },
    });

    // Update total expense on incident
    const totalExpense = await prisma.incidentExpense.aggregate({
      where: { incidentId },
      _sum: { amountIdr: true },
    });

    await prisma.incident.update({
      where: { id: incidentId },
      data: { totalExpense: totalExpense._sum.amountIdr || 0 },
    });

    sendCreated(res, expense, 'Expense added to incident');
  } catch (error) {
    console.error('Add incident expense error:', error);
    sendError(res, 'Failed to add expense to incident', 500);
  }
};

export const removeIncidentExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { incidentId, expenseId } = req.params;

    // Verify incident belongs to user
    const incident = await prisma.incident.findFirst({
      where: { id: incidentId, userId },
    });

    if (!incident) {
      sendNotFound(res, 'Incident not found');
      return;
    }

    await prisma.incidentExpense.delete({
      where: { id: expenseId },
    });

    // Update total expense on incident
    const totalExpense = await prisma.incidentExpense.aggregate({
      where: { incidentId },
      _sum: { amountIdr: true },
    });

    await prisma.incident.update({
      where: { id: incidentId },
      data: { totalExpense: totalExpense._sum.amountIdr || 0 },
    });

    sendSuccess(res, null, 'Expense removed from incident');
  } catch (error) {
    console.error('Remove incident expense error:', error);
    sendError(res, 'Failed to remove expense from incident', 500);
  }
};

// ============================================
// STATS & DASHBOARD
// ============================================

export const getSafetyKitStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { startDate, endDate } = req.query;

    // Get all kits with items
    const kits = await prisma.safetyKit.findMany({
      where: { userId, isActive: true },
      include: {
        items: true,
        checks: {
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
    });

    // Count items by status
    const allItems = kits.flatMap((k) => k.items);
    const itemsByStatus: Record<string, number> = {
      ok: 0,
      low: 0,
      out: 0,
      replace: 0,
    };
    allItems.forEach((item) => {
      itemsByStatus[item.status] = (itemsByStatus[item.status] || 0) + 1;
    });

    // Items needing attention
    const needsAttention = allItems.filter((i) =>
      ['low', 'out', 'replace'].includes(i.status)
    ).length;

    // Expiring items (next 30 days)
    const today = await getUserToday(userId);
    const futureDate = addDaysUTC(today, 30);
    const expiringItems = allItems.filter(
      (i) => i.expiryDate && i.expiryDate <= futureDate && i.expiryDate >= today
    ).length;

    // Average readiness score from last checks
    const lastChecks = kits.map((k) => k.checks[0]).filter(Boolean);
    const avgReadiness = lastChecks.length > 0
      ? lastChecks.reduce((sum, c) => sum + (c.readinessScore || 0), 0) / lastChecks.length
      : null;

    // Incidents
    const incidentWhere: any = { userId };
    if (startDate || endDate) {
      incidentWhere.date = {};
      if (startDate) incidentWhere.date.gte = new Date(startDate as string);
      if (endDate) incidentWhere.date.lte = new Date(endDate as string);
    }

    const incidents = await prisma.incident.findMany({
      where: incidentWhere,
      include: { expenses: true },
    });

    const incidentsByType: Record<string, number> = {};
    let totalExpense = 0;
    let totalSaved = 0;
    incidents.forEach((inc) => {
      incidentsByType[inc.incidentType] = (incidentsByType[inc.incidentType] || 0) + 1;
      totalExpense += inc.totalExpense || 0;
      totalSaved += inc.estimatedSaved || 0;
    });

    const stats = {
      kits: {
        total: kits.length,
        totalItems: allItems.length,
        itemsByStatus,
        needsAttention,
        expiringItems,
        avgReadiness,
      },
      incidents: {
        total: incidents.length,
        byType: incidentsByType,
        totalExpense,
        totalSaved,
      },
      recentChecks: lastChecks.map((c) => ({
        kitId: c.safetyKitId,
        date: c.date,
        readinessScore: c.readinessScore,
      })),
    };

    sendSuccess(res, stats);
  } catch (error) {
    console.error('Get safety kit stats error:', error);
    sendError(res, 'Failed to fetch statistics', 500);
  }
};

export const getReadinessOverview = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const kits = await prisma.safetyKit.findMany({
      where: { userId, isActive: true },
      include: {
        items: true,
        checks: {
          orderBy: { date: 'desc' },
          take: 1,
          include: {
            lines: {
              where: { isOk: false },
              include: { safetyKitItem: { select: { name: true, priority: true } } },
            },
          },
        },
      },
    });

    const overview = kits.map((kit) => {
      const lastCheck = kit.checks[0];
      const issues = lastCheck?.lines || [];

      return {
        id: kit.id,
        name: kit.name,
        location: kit.location,
        totalItems: kit.items.length,
        readinessScore: lastCheck?.readinessScore || null,
        lastCheckDate: lastCheck?.date || null,
        itemsReady: lastCheck?.itemsReady || 0,
        itemsIssue: lastCheck?.itemsIssue || 0,
        issues: issues.map((l) => ({
          itemName: l.safetyKitItem.name,
          priority: l.safetyKitItem.priority,
          status: l.statusFound,
        })),
      };
    });

    sendSuccess(res, overview);
  } catch (error) {
    console.error('Get readiness overview error:', error);
    sendError(res, 'Failed to fetch readiness overview', 500);
  }
};

export const getRestockReminders = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Items needing restock
    const restockItems = await prisma.safetyKitItem.findMany({
      where: {
        safetyKit: { userId },
        OR: [
          { status: 'low' },
          { status: 'out' },
          { status: 'replace' },
        ],
      },
      include: {
        safetyKit: { select: { name: true, location: true } },
      },
      orderBy: [{ priority: 'asc' }, { status: 'asc' }],
    });

    // Expiring items (30 days)
    const today = await getUserToday(userId);
    const futureDate = addDaysUTC(today, 30);

    const expiringItems = await prisma.safetyKitItem.findMany({
      where: {
        safetyKit: { userId },
        expiryDate: {
          lte: futureDate,
          gte: today,
        },
      },
      include: {
        safetyKit: { select: { name: true, location: true } },
      },
      orderBy: { expiryDate: 'asc' },
    });

    // Calculate estimated restock cost
    const estimatedCost = restockItems.reduce(
      (sum, item) => sum + (item.estimatedPrice || 0),
      0
    );

    const reminders = {
      restock: restockItems.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        priority: item.priority,
        status: item.status,
        quantity: item.quantity,
        minQuantity: item.minQuantity,
        estimatedPrice: item.estimatedPrice,
        kitName: item.safetyKit.name,
        kitLocation: item.safetyKit.location,
      })),
      expiring: expiringItems.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        expiryDate: item.expiryDate,
        kitName: item.safetyKit.name,
        kitLocation: item.safetyKit.location,
      })),
      summary: {
        restockCount: restockItems.length,
        expiringCount: expiringItems.length,
        estimatedCost,
      },
    };

    sendSuccess(res, reminders);
  } catch (error) {
    console.error('Get restock reminders error:', error);
    sendError(res, 'Failed to fetch restock reminders', 500);
  }
};
