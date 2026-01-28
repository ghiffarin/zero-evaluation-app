import { Request, Response } from 'express';
import prisma from '../utils/prisma.js';
import { sendSuccess, sendError, sendCreated } from '../utils/response.js';
import { createCrudController } from '../services/crud.service.js';

const crud = createCrudController({
  model: 'budget',
  orderBy: { startDate: 'desc' },
  searchFields: ['name'],
  dateField: 'startDate',
});

// Helper to parse date strings to proper Date objects for @db.Date fields
function parseDateString(dateStr: string): Date {
  // If already an ISO string with time, extract the date part
  const datePart = dateStr.split('T')[0];
  // Create date at midnight UTC to avoid timezone shifts
  return new Date(datePart + 'T00:00:00.000Z');
}

// Custom create to handle date parsing
export const createBudget = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { startDate, endDate, ...rest } = req.body;

    const data = {
      ...rest,
      userId,
      startDate: parseDateString(startDate),
      endDate: parseDateString(endDate),
    };

    const budget = await prisma.budget.create({ data });
    sendCreated(res, budget, 'Budget created successfully');
  } catch (error) {
    console.error('Create budget error:', error);
    sendError(res, 'Failed to create budget', 500);
  }
};

export const getAllBudgets = crud.getAll;
export const getBudgetById = crud.getOne;

// Custom update to handle date parsing
export const updateBudget = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { startDate, endDate, ...rest } = req.body;

    // Check ownership
    const existing = await prisma.budget.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      sendError(res, 'Budget not found', 404);
      return;
    }

    const data: Record<string, unknown> = { ...rest };
    if (startDate) data.startDate = parseDateString(startDate);
    if (endDate) data.endDate = parseDateString(endDate);

    const budget = await prisma.budget.update({
      where: { id },
      data,
    });

    sendSuccess(res, budget, 'Budget updated successfully');
  } catch (error) {
    console.error('Update budget error:', error);
    sendError(res, 'Failed to update budget', 500);
  }
};

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

    // Use date-only comparison to avoid timezone issues
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const todayDate = new Date(todayStr + 'T00:00:00.000Z');

    // Get all active budgets that haven't ended
    const budgets = await prisma.budget.findMany({
      where: {
        userId,
        isActive: true,
        endDate: { gte: todayDate },
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
            (budget.endDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24)
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

    // Use date-only comparison to avoid timezone issues
    // Create today's date at midnight UTC
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0]; // "YYYY-MM-DD"
    const todayDate = new Date(todayStr + 'T00:00:00.000Z');

    // Find active budget for this category that covers today
    const budget = await prisma.budget.findFirst({
      where: {
        userId,
        category: category as any,
        isActive: true,
        startDate: { lte: todayDate },
        endDate: { gte: todayDate },
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
      (budget.endDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24)
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
