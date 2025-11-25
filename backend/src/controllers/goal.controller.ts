import { Request, Response } from 'express';
import prisma from '../utils/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { createCrudController } from '../services/crud.service.js';

const crud = createCrudController({
  model: 'goal',
  include: { project: true },
  orderBy: { createdAt: 'desc' },
  searchFields: ['title', 'description'],
  dateField: 'createdAt',
});

export const createGoal = crud.create;
export const getAllGoals = crud.getAll;
export const getGoalById = crud.getOne;
export const updateGoal = crud.update;
export const deleteGoal = crud.delete;

// Get goals by category
export const getGoalsByCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { category } = req.params;

    const goals = await prisma.goal.findMany({
      where: { userId, category: category as any },
      include: { project: true },
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
