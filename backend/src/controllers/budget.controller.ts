import { Request, Response } from 'express';
import prisma from '../utils/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { createCrudController } from '../services/crud.service.js';

const crud = createCrudController({
  model: 'budget',
  orderBy: { startDate: 'desc' },
  searchFields: ['name'],
  dateField: 'startDate',
});

export const createBudget = crud.create;
export const getAllBudgets = crud.getAll;
export const getBudgetById = crud.getOne;
export const updateBudget = crud.update;
export const deleteBudget = crud.delete;

// Helper: Calculate spending for a budget
async function calculateBudgetSpending(
  userId: string,
  category: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const result = await prisma.financialTransaction.aggregate({
    where: {
      userId,
      category: category as any,
      direction: 'spend',
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    _sum: { amountIdr: true },
  });
  return result._sum.amountIdr || 0;
}

// Get budget statistics
export const getBudgetStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Get all active budgets
    const budgets = await prisma.budget.findMany({
      where: { userId, isActive: true },
    });

    if (budgets.length === 0) {
      sendSuccess(res, {
        totalBudgets: 0,
        totalBudgeted: 0,
        totalSpent: 0,
        overBudget: 0,
        warning: 0,
        onTrack: 0,
      });
      return;
    }

    // Calculate spending for each budget
    const enrichedBudgets = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await calculateBudgetSpending(
          userId,
          budget.category,
          budget.startDate,
          budget.endDate
        );
        return { ...budget, currentSpent: spent };
      })
    );

    const totalBudgeted = enrichedBudgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = enrichedBudgets.reduce((sum, b) => sum + b.currentSpent, 0);
    const overBudget = enrichedBudgets.filter((b) => b.currentSpent > b.amount).length;
    const warning = enrichedBudgets.filter(
      (b) => b.currentSpent >= b.amount * b.alertThreshold && b.currentSpent <= b.amount
    ).length;
    const onTrack = enrichedBudgets.filter((b) => b.currentSpent < b.amount * b.alertThreshold).length;

    sendSuccess(res, {
      totalBudgets: budgets.length,
      totalBudgeted,
      totalSpent,
      overBudget,
      warning,
      onTrack,
    });
  } catch (error) {
    console.error('Get budget stats error:', error);
    sendError(res, 'Failed to fetch budget statistics', 500);
  }
};

// Get budget vs actual comparison
export const getBudgetComparison = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Get all active budgets
    const budgets = await prisma.budget.findMany({
      where: { userId, isActive: true },
      orderBy: { category: 'asc' },
    });

    // Calculate spending for each budget
    const comparison = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await calculateBudgetSpending(
          userId,
          budget.category,
          budget.startDate,
          budget.endDate
        );
        const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

        let status: 'under' | 'warning' | 'over' = 'under';
        if (spent > budget.amount) {
          status = 'over';
        } else if (spent >= budget.amount * budget.alertThreshold) {
          status = 'warning';
        }

        return {
          budgetId: budget.id,
          name: budget.name,
          category: budget.category,
          period: budget.period,
          budgeted: budget.amount,
          actual: spent,
          percentage: Math.round(percentage * 100) / 100,
          status,
          startDate: budget.startDate,
          endDate: budget.endDate,
        };
      })
    );

    sendSuccess(res, comparison);
  } catch (error) {
    console.error('Get budget comparison error:', error);
    sendError(res, 'Failed to fetch budget comparison', 500);
  }
};

// Get budget alerts (budgets needing attention)
export const getBudgetAlerts = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const today = new Date();

    // Get all active budgets that haven't ended
    const budgets = await prisma.budget.findMany({
      where: {
        userId,
        isActive: true,
        endDate: { gte: today },
      },
    });

    // Filter to those at or above alert threshold
    const alerts = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await calculateBudgetSpending(
          userId,
          budget.category,
          budget.startDate,
          budget.endDate
        );
        const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

        if (spent >= budget.amount * budget.alertThreshold) {
          // Calculate days remaining
          const daysRemaining = Math.ceil(
            (budget.endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );

          return {
            id: budget.id,
            name: budget.name,
            category: budget.category,
            amount: budget.amount,
            currentSpent: spent,
            percentage: Math.round(percentage * 100) / 100,
            endDate: budget.endDate,
            daysRemaining,
            isOver: spent > budget.amount,
          };
        }
        return null;
      })
    );

    // Filter out nulls and sort by percentage descending
    const filteredAlerts = alerts
      .filter((a): a is NonNullable<typeof a> => a !== null)
      .sort((a, b) => b.percentage - a.percentage);

    sendSuccess(res, filteredAlerts);
  } catch (error) {
    console.error('Get budget alerts error:', error);
    sendError(res, 'Failed to fetch budget alerts', 500);
  }
};

// Get budget with current spending
export const getBudgetWithSpending = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const budget = await prisma.budget.findFirst({
      where: { id, userId },
    });

    if (!budget) {
      sendError(res, 'Budget not found', 404);
      return;
    }

    const spent = await calculateBudgetSpending(
      userId,
      budget.category,
      budget.startDate,
      budget.endDate
    );

    const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
    let status: 'under' | 'warning' | 'over' = 'under';
    if (spent > budget.amount) {
      status = 'over';
    } else if (spent >= budget.amount * budget.alertThreshold) {
      status = 'warning';
    }

    sendSuccess(res, {
      ...budget,
      currentSpent: spent,
      percentage: Math.round(percentage * 100) / 100,
      status,
    });
  } catch (error) {
    console.error('Get budget with spending error:', error);
    sendError(res, 'Failed to fetch budget', 500);
  }
};

// Get budget status for a specific category (for transaction modal)
export const getBudgetByCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { category } = req.params;
    const today = new Date();

    // Find active budget for this category that covers today
    const budget = await prisma.budget.findFirst({
      where: {
        userId,
        category: category as any,
        isActive: true,
        startDate: { lte: today },
        endDate: { gte: today },
      },
      orderBy: { startDate: 'desc' },
    });

    if (!budget) {
      // No budget for this category
      sendSuccess(res, null);
      return;
    }

    const spent = await calculateBudgetSpending(
      userId,
      budget.category,
      budget.startDate,
      budget.endDate
    );

    const remaining = budget.amount - spent;
    const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

    let status: 'under' | 'warning' | 'over' = 'under';
    if (spent > budget.amount) {
      status = 'over';
    } else if (spent >= budget.amount * budget.alertThreshold) {
      status = 'warning';
    }

    // Calculate days remaining in budget period
    const daysRemaining = Math.ceil(
      (budget.endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    sendSuccess(res, {
      id: budget.id,
      name: budget.name,
      category: budget.category,
      amount: budget.amount,
      spent,
      remaining,
      percentage: Math.round(percentage * 100) / 100,
      status,
      alertThreshold: budget.alertThreshold,
      startDate: budget.startDate,
      endDate: budget.endDate,
      daysRemaining,
    });
  } catch (error) {
    console.error('Get budget by category error:', error);
    sendError(res, 'Failed to fetch budget for category', 500);
  }
};

// Get transactions for a specific budget
export const getBudgetTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get the budget first
    const budget = await prisma.budget.findFirst({
      where: { id, userId },
    });

    if (!budget) {
      sendError(res, 'Budget not found', 404);
      return;
    }

    // Get transactions for this budget's category and date range
    const [transactions, total] = await Promise.all([
      prisma.financialTransaction.findMany({
        where: {
          userId,
          category: budget.category,
          direction: 'spend',
          date: {
            gte: budget.startDate,
            lte: budget.endDate,
          },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.financialTransaction.count({
        where: {
          userId,
          category: budget.category,
          direction: 'spend',
          date: {
            gte: budget.startDate,
            lte: budget.endDate,
          },
        },
      }),
    ]);

    sendSuccess(res, transactions, undefined, 200, {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error('Get budget transactions error:', error);
    sendError(res, 'Failed to fetch budget transactions', 500);
  }
};
