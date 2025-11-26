import { Request, Response } from 'express';
import prisma from '../utils/prisma.js';
import { sendSuccess, sendCreated, sendError, sendNotFound } from '../utils/response.js';
import { createCrudController } from '../services/crud.service.js';

// Masters Prep Items
const itemCrud = createCrudController({
  model: 'mastersPrepItem',
  include: {
    relatedGoal: true,
    sessions: {
      orderBy: { date: 'desc' },
      take: 5,
    },
  },
  orderBy: { updatedAt: 'desc' },
  searchFields: ['taskTitle', 'description', 'subcategory'],
  dateField: 'createdAt',
});

export const createPrepItem = itemCrud.create;
export const getAllPrepItems = itemCrud.getAll;
export const getPrepItemById = itemCrud.getOne;
export const updatePrepItem = itemCrud.update;
export const deletePrepItem = itemCrud.delete;

// Add session to prep item
export const addSessionToPrepItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { itemId } = req.params;

    // Verify item ownership
    const item = await prisma.mastersPrepItem.findFirst({
      where: { id: itemId, userId },
    });

    if (!item) {
      sendNotFound(res, 'Prep item not found');
      return;
    }

    const session = await prisma.mastersPrepSession.create({
      data: {
        ...req.body,
        userId,
        prepItemId: itemId,
      },
    });

    // Update accumulated time on prep item
    const totalTime = await prisma.mastersPrepSession.aggregate({
      where: { prepItemId: itemId },
      _sum: { timeSpentMin: true },
    });

    await prisma.mastersPrepItem.update({
      where: { id: itemId },
      data: { timeSpentMin: totalTime._sum.timeSpentMin || 0 },
    });

    sendCreated(res, session, 'Session added successfully');
  } catch (error) {
    console.error('Add prep session error:', error);
    sendError(res, 'Failed to add session', 500);
  }
};

// Get Masters Prep statistics
export const getMastersPrepStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const items = await prisma.mastersPrepItem.findMany({
      where: { userId },
      include: { sessions: true },
    });

    // Stats by category
    const byCategory: Record<string, any> = {};
    items.forEach((item) => {
      if (!byCategory[item.category]) {
        byCategory[item.category] = {
          total: 0,
          completed: 0,
          inProgress: 0,
          totalMinutes: 0,
          averageProgress: [],
          averageReadiness: [],
        };
      }
      byCategory[item.category].total++;
      if (item.status === 'completed') byCategory[item.category].completed++;
      if (item.status === 'in_progress') byCategory[item.category].inProgress++;
      byCategory[item.category].totalMinutes += item.timeSpentMin || 0;
      if (item.progressPercent !== null) {
        byCategory[item.category].averageProgress.push(item.progressPercent);
      }
      if (item.readinessScore !== null) {
        byCategory[item.category].averageReadiness.push(item.readinessScore);
      }
    });

    // Calculate averages
    Object.keys(byCategory).forEach((key) => {
      const cat = byCategory[key];
      cat.averageProgress = cat.averageProgress.length
        ? cat.averageProgress.reduce((a: number, b: number) => a + b, 0) / cat.averageProgress.length
        : 0;
      cat.averageReadiness = cat.averageReadiness.length
        ? cat.averageReadiness.reduce((a: number, b: number) => a + b, 0) / cat.averageReadiness.length
        : null;
    });

    // Overall readiness
    const allReadinessScores = items
      .filter((i) => i.readinessScore !== null)
      .map((i) => i.readinessScore as number);
    const overallReadiness = allReadinessScores.length
      ? allReadinessScores.reduce((a, b) => a + b, 0) / allReadinessScores.length
      : null;

    // Progress calculation
    const totalItems = items.length;
    const completedItems = items.filter((i) => i.status === 'completed').length;
    const overallProgress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

    const stats = {
      totalItems,
      completedItems,
      inProgressItems: items.filter((i) => i.status === 'in_progress').length,
      notStartedItems: items.filter((i) => i.status === 'not_started').length,
      overallProgress,
      overallReadiness,
      totalMinutes: items.reduce((sum, i) => sum + (i.timeSpentMin || 0), 0),
      byCategory,
      byStatus: {
        not_started: items.filter((i) => i.status === 'not_started').length,
        in_progress: items.filter((i) => i.status === 'in_progress').length,
        halfway: items.filter((i) => i.status === 'halfway').length,
        almost_done: items.filter((i) => i.status === 'almost_done').length,
        completed: items.filter((i) => i.status === 'completed').length,
      },
      byPriority: {
        high: items.filter((i) => i.priority === 1).length,
        medium: items.filter((i) => i.priority === 2).length,
        low: items.filter((i) => i.priority === 3).length,
      },
    };

    sendSuccess(res, stats);
  } catch (error) {
    console.error('Get masters prep stats error:', error);
    sendError(res, 'Failed to fetch masters prep statistics', 500);
  }
};

// Get readiness breakdown
export const getReadinessBreakdown = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const items = await prisma.mastersPrepItem.findMany({
      where: { userId },
      select: {
        id: true,
        category: true,
        taskTitle: true,
        status: true,
        progressPercent: true,
        readinessScore: true,
        priority: true,
      },
      orderBy: [{ priority: 'asc' }, { category: 'asc' }],
    });

    // Group by category with readiness info
    const breakdown: Record<string, any> = {};
    items.forEach((item) => {
      if (!breakdown[item.category]) {
        breakdown[item.category] = {
          items: [],
          averageReadiness: 0,
          averageProgress: 0,
        };
      }
      breakdown[item.category].items.push(item);
    });

    // Calculate category averages
    Object.keys(breakdown).forEach((cat) => {
      const catItems = breakdown[cat].items;
      const readinessScores = catItems.filter((i: any) => i.readinessScore).map((i: any) => i.readinessScore);
      const progressScores = catItems.filter((i: any) => i.progressPercent !== null).map((i: any) => i.progressPercent);

      breakdown[cat].averageReadiness = readinessScores.length
        ? readinessScores.reduce((a: number, b: number) => a + b, 0) / readinessScores.length
        : 0;
      breakdown[cat].averageProgress = progressScores.length
        ? progressScores.reduce((a: number, b: number) => a + b, 0) / progressScores.length
        : 0;
    });

    sendSuccess(res, breakdown);
  } catch (error) {
    console.error('Get readiness breakdown error:', error);
    sendError(res, 'Failed to fetch readiness breakdown', 500);
  }
};

// Quick Notes CRUD
const noteCrud = createCrudController({
  model: 'mastersPrepNote',
  orderBy: { createdAt: 'desc' },
  searchFields: ['title', 'description'],
});

export const createNote = noteCrud.create;
export const getAllNotes = noteCrud.getAll;
export const getNoteById = noteCrud.getOne;
export const updateNote = noteCrud.update;
export const deleteNote = noteCrud.delete;
