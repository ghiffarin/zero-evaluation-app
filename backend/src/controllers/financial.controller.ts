import { Request, Response } from 'express';
import prisma from '../utils/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { createCrudController } from '../services/crud.service.js';

const crud = createCrudController({
  model: 'financialTransaction',
  orderBy: { date: 'desc' },
  searchFields: ['description', 'notes'],
});

export const createTransaction = crud.create;
export const getAllTransactions = crud.getAll;
export const getTransactionById = crud.getOne;
export const updateTransaction = crud.update;
export const deleteTransaction = crud.delete;

// Get financial statistics
export const getFinancialStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { startDate, endDate } = req.query;

    const where: any = { userId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const transactions = await prisma.financialTransaction.findMany({ where });

    // Calculate by direction
    const spending = transactions.filter((t) => t.direction === 'spend');
    const income = transactions.filter((t) => t.direction === 'income');
    const investments = transactions.filter((t) => t.direction === 'invest');

    // Calculate by category for spending
    const spendingByCategory: Record<string, number> = {};
    spending.forEach((t) => {
      spendingByCategory[t.category] = (spendingByCategory[t.category] || 0) + t.amountIdr;
    });

    // Calculate by investment type
    const investmentByType: Record<string, number> = {};
    investments.forEach((t) => {
      if (t.investmentType) {
        investmentByType[t.investmentType] = (investmentByType[t.investmentType] || 0) + t.amountIdr;
      }
    });

    // Necessary vs unnecessary spending
    const necessarySpending = spending
      .filter((t) => t.isNecessary)
      .reduce((sum, t) => sum + t.amountIdr, 0);
    const unnecessarySpending = spending
      .filter((t) => t.isNecessary === false)
      .reduce((sum, t) => sum + t.amountIdr, 0);

    const totalIncome = income.reduce((sum, t) => sum + t.amountIdr, 0);
    const totalSpending = spending.reduce((sum, t) => sum + t.amountIdr, 0);
    const totalInvestment = investments.reduce((sum, t) => sum + t.amountIdr, 0);

    const stats = {
      totalTransactions: transactions.length,
      summary: {
        totalIncome,
        totalSpending,
        totalInvestment,
        netBalance: totalIncome - totalSpending - totalInvestment,
        savingsRate: totalIncome > 0 ? ((totalIncome - totalSpending) / totalIncome) * 100 : 0,
      },
      spending: {
        total: totalSpending,
        necessary: necessarySpending,
        unnecessary: unnecessarySpending,
        necessaryPercentage: totalSpending > 0 ? (necessarySpending / totalSpending) * 100 : 0,
        byCategory: spendingByCategory,
      },
      investments: {
        total: totalInvestment,
        byType: investmentByType,
      },
      byPaymentMethod: spending.reduce((acc, t) => {
        if (t.paymentMethod) {
          acc[t.paymentMethod] = (acc[t.paymentMethod] || 0) + t.amountIdr;
        }
        return acc;
      }, {} as Record<string, number>),
    };

    sendSuccess(res, stats);
  } catch (error) {
    console.error('Get financial stats error:', error);
    sendError(res, 'Failed to fetch financial statistics', 500);
  }
};

// Get daily spending summary
export const getDailySpending = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { date } = req.params;
    const dateObj = new Date(date);
    const nextDay = new Date(dateObj);
    nextDay.setDate(nextDay.getDate() + 1);

    const transactions = await prisma.financialTransaction.findMany({
      where: {
        userId,
        date: {
          gte: dateObj,
          lt: nextDay,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const spending = transactions.filter((t) => t.direction === 'spend');
    const totalSpending = spending.reduce((sum, t) => sum + t.amountIdr, 0);

    sendSuccess(res, {
      date,
      transactions,
      summary: {
        totalSpending,
        transactionCount: spending.length,
      },
    });
  } catch (error) {
    console.error('Get daily spending error:', error);
    sendError(res, 'Failed to fetch daily spending', 500);
  }
};
