import { Request, Response } from 'express';
import prisma from '../utils/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { createCrudController } from '../services/crud.service.js';

const crud = createCrudController({
  model: 'goal',
  include: { project: true, progressEntries: { orderBy: { date: 'desc' }, take: 5 } },
  orderBy: { createdAt: 'desc' },
  searchFields: ['title', 'description'],
  dateField: 'createdAt',
});

export const createGoal = crud.create;
export const getAllGoals = crud.getAll;
export const updateGoal = crud.update;
export const deleteGoal = crud.delete;

// Get goal by ID with all progress entries
export const getGoalById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const goal = await prisma.goal.findFirst({
      where: { id, userId },
      include: {
        project: true,
        progressEntries: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!goal) {
      sendError(res, 'Goal not found', 404);
      return;
    }

    sendSuccess(res, goal);
  } catch (error) {
    console.error('Get goal by ID error:', error);
    sendError(res, 'Failed to fetch goal', 500);
  }
};

// Get goals by category
export const getGoalsByCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { category } = req.params;

    const goals = await prisma.goal.findMany({
      where: { userId, category: category as any },
      include: { project: true, progressEntries: { orderBy: { date: 'desc' }, take: 5 } },
      orderBy: { createdAt: 'desc' },
    });

    sendSuccess(res, goals);
  } catch (error) {
    console.error('Get goals by category error:', error);
    sendError(res, 'Failed to fetch goals', 500);
  }
};

// Get goal statistics
export const getGoalStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const goals = await prisma.goal.findMany({
      where: { userId },
    });

    // By status
    const byStatus: Record<string, number> = {};
    goals.forEach((g) => {
      byStatus[g.status] = (byStatus[g.status] || 0) + 1;
    });

    // By category
    const byCategory: Record<string, any> = {};
    goals.forEach((g) => {
      if (!byCategory[g.category]) {
        byCategory[g.category] = {
          total: 0,
          achieved: 0,
          inProgress: 0,
        };
      }
      byCategory[g.category].total++;
      if (g.status === 'achieved') byCategory[g.category].achieved++;
      if (g.status === 'in_progress') byCategory[g.category].inProgress++;
    });

    const stats = {
      total: goals.length,
      achieved: goals.filter((g) => g.status === 'achieved').length,
      inProgress: goals.filter((g) => g.status === 'in_progress').length,
      notStarted: goals.filter((g) => g.status === 'not_started').length,
      dropped: goals.filter((g) => g.status === 'dropped').length,
      successRate:
        goals.length > 0
          ? (goals.filter((g) => g.status === 'achieved').length / goals.length) * 100
          : 0,
      byStatus,
      byCategory,
    };

    sendSuccess(res, stats);
  } catch (error) {
    console.error('Get goal stats error:', error);
    sendError(res, 'Failed to fetch goal statistics', 500);
  }
};

// ============================================
// GOAL PROGRESS ENDPOINTS
// ============================================

// Add progress entry to a goal
export const addGoalProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { goalId } = req.params;
    const { date, value, note } = req.body;

    // Verify goal belongs to user
    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId },
    });

    if (!goal) {
      sendError(res, 'Goal not found', 404);
      return;
    }

    // Create progress entry
    const progressEntry = await prisma.goalProgress.create({
      data: {
        userId,
        goalId,
        date: new Date(date),
        value: Number(value),
        note,
      },
    });

    // Update goal's currentValue (sum of all progress entries)
    const totalProgress = await prisma.goalProgress.aggregate({
      where: { goalId },
      _sum: { value: true },
    });

    const newCurrentValue = totalProgress._sum.value || 0;

    // Auto-update status based on progress
    let newStatus = goal.status;
    if (goal.targetValue && newCurrentValue >= goal.targetValue) {
      newStatus = 'achieved';
    } else if (newCurrentValue > 0 && goal.status === 'not_started') {
      newStatus = 'in_progress';
    }

    await prisma.goal.update({
      where: { id: goalId },
      data: {
        currentValue: newCurrentValue,
        status: newStatus,
      },
    });

    sendSuccess(res, progressEntry, 'Progress added successfully');
  } catch (error) {
    console.error('Add goal progress error:', error);
    sendError(res, 'Failed to add progress', 500);
  }
};

// Get all progress entries for a goal
export const getGoalProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { goalId } = req.params;

    // Verify goal belongs to user
    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId },
    });

    if (!goal) {
      sendError(res, 'Goal not found', 404);
      return;
    }

    const progressEntries = await prisma.goalProgress.findMany({
      where: { goalId },
      orderBy: { date: 'desc' },
    });

    sendSuccess(res, progressEntries);
  } catch (error) {
    console.error('Get goal progress error:', error);
    sendError(res, 'Failed to fetch progress', 500);
  }
};

// Update a progress entry
export const updateGoalProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { progressId } = req.params;
    const { date, value, note } = req.body;

    // Verify progress entry belongs to user
    const existingProgress = await prisma.goalProgress.findFirst({
      where: { id: progressId, userId },
    });

    if (!existingProgress) {
      sendError(res, 'Progress entry not found', 404);
      return;
    }

    // Update progress entry
    const updated = await prisma.goalProgress.update({
      where: { id: progressId },
      data: {
        date: date ? new Date(date) : undefined,
        value: value !== undefined ? Number(value) : undefined,
        note,
      },
    });

    // Recalculate goal's currentValue
    const totalProgress = await prisma.goalProgress.aggregate({
      where: { goalId: existingProgress.goalId },
      _sum: { value: true },
    });

    const newCurrentValue = totalProgress._sum.value || 0;

    // Get goal to check target
    const goal = await prisma.goal.findUnique({
      where: { id: existingProgress.goalId },
    });

    // Auto-update status
    let newStatus = goal?.status;
    if (goal?.targetValue && newCurrentValue >= goal.targetValue) {
      newStatus = 'achieved';
    } else if (newCurrentValue > 0 && goal?.status === 'not_started') {
      newStatus = 'in_progress';
    } else if (newCurrentValue === 0 && goal?.status === 'in_progress') {
      newStatus = 'not_started';
    } else if (goal?.targetValue && newCurrentValue < goal.targetValue && goal?.status === 'achieved') {
      newStatus = 'in_progress';
    }

    await prisma.goal.update({
      where: { id: existingProgress.goalId },
      data: {
        currentValue: newCurrentValue,
        status: newStatus,
      },
    });

    sendSuccess(res, updated, 'Progress updated successfully');
  } catch (error) {
    console.error('Update goal progress error:', error);
    sendError(res, 'Failed to update progress', 500);
  }
};

// Delete a progress entry
export const deleteGoalProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { progressId } = req.params;

    // Verify progress entry belongs to user
    const existingProgress = await prisma.goalProgress.findFirst({
      where: { id: progressId, userId },
    });

    if (!existingProgress) {
      sendError(res, 'Progress entry not found', 404);
      return;
    }

    const goalId = existingProgress.goalId;

    // Delete progress entry
    await prisma.goalProgress.delete({
      where: { id: progressId },
    });

    // Recalculate goal's currentValue
    const totalProgress = await prisma.goalProgress.aggregate({
      where: { goalId },
      _sum: { value: true },
    });

    const newCurrentValue = totalProgress._sum.value || 0;

    // Get goal to check target
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
    });

    // Auto-update status
    let newStatus = goal?.status;
    if (newCurrentValue === 0 && goal?.status === 'in_progress') {
      newStatus = 'not_started';
    } else if (goal?.targetValue && newCurrentValue < goal.targetValue && goal?.status === 'achieved') {
      newStatus = 'in_progress';
    }

    await prisma.goal.update({
      where: { id: goalId },
      data: {
        currentValue: newCurrentValue,
        status: newStatus,
      },
    });

    sendSuccess(res, null, 'Progress deleted successfully');
  } catch (error) {
    console.error('Delete goal progress error:', error);
    sendError(res, 'Failed to delete progress', 500);
  }
};
