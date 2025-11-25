import { Request, Response } from 'express';
import prisma from '../utils/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { createCrudController } from '../services/crud.service.js';

const crud = createCrudController({
  model: 'dailyLog',
  orderBy: { date: 'desc' },
  searchFields: ['mainFocus', 'notes'],
});

export const createDailyLog = crud.create;
export const getAllDailyLogs = crud.getAll;
export const getDailyLogById = crud.getOne;
export const getDailyLogByDate = crud.getByDate;
export const updateDailyLog = crud.update;
export const deleteDailyLog = crud.delete;

// Upsert daily log by date
export const upsertDailyLog = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { date } = req.params;
    const dateObj = new Date(date);

    const record = await prisma.dailyLog.upsert({
      where: {
        userId_date: {
          userId,
          date: dateObj,
        },
      },
      update: req.body,
      create: {
        ...req.body,
        userId,
        date: dateObj,
      },
    });

    sendSuccess(res, record, 'Daily log saved successfully');
  } catch (error) {
    console.error('Upsert daily log error:', error);
    sendError(res, 'Failed to save daily log', 500);
  }
};

// Get weekly summary
export const getWeeklySummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { startDate } = req.query;

    const start = startDate
      ? new Date(startDate as string)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);

    const logs = await prisma.dailyLog.findMany({
      where: {
        userId,
        date: {
          gte: start,
          lt: end,
        },
      },
      orderBy: { date: 'asc' },
    });

    // Calculate averages
    const validLogs = logs.filter((log) => log.dayScore !== null);
    const summary = {
      totalDays: logs.length,
      averageDayScore: validLogs.length
        ? validLogs.reduce((sum, log) => sum + (log.dayScore || 0), 0) / validLogs.length
        : null,
      averageMoodScore: logs.filter((l) => l.moodScore).length
        ? logs.reduce((sum, log) => sum + (log.moodScore || 0), 0) /
          logs.filter((l) => l.moodScore).length
        : null,
      averageEnergyScore: logs.filter((l) => l.energyScore).length
        ? logs.reduce((sum, log) => sum + (log.energyScore || 0), 0) /
          logs.filter((l) => l.energyScore).length
        : null,
      totalWorkHours: logs.reduce((sum, log) => sum + (log.workHours || 0), 0),
      totalLearningHours: logs.reduce((sum, log) => sum + (log.learningHours || 0), 0),
      totalWorkoutMinutes: logs.reduce((sum, log) => sum + (log.workoutMinutes || 0), 0),
      totalMoneySpent: logs.reduce((sum, log) => sum + (log.moneySpent || 0), 0),
      logs,
    };

    sendSuccess(res, summary);
  } catch (error) {
    console.error('Get weekly summary error:', error);
    sendError(res, 'Failed to fetch weekly summary', 500);
  }
};
