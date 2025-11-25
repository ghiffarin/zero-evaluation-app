import { Request, Response } from 'express';
import prisma from '../utils/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { createCrudController } from '../services/crud.service.js';

const crud = createCrudController({
  model: 'wellnessEntry',
  orderBy: { date: 'desc' },
  searchFields: ['physicalSymptoms', 'wellnessNote'],
});

export const createWellnessEntry = crud.create;
export const getAllWellnessEntries = crud.getAll;
export const getWellnessEntryById = crud.getOne;
export const getWellnessEntryByDate = crud.getByDate;
export const updateWellnessEntry = crud.update;
export const deleteWellnessEntry = crud.delete;

// Upsert wellness entry by date
export const upsertWellnessEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { date } = req.params;
    const dateObj = new Date(date);

    // Calculate wellness score
    const data = req.body;
    const scores = [
      data.sleepQuality,
      data.energyLevel,
      data.moodScore,
      data.mentalClarity,
      data.dietDiscipline,
      data.hygieneScore,
    ].filter((s) => s !== null && s !== undefined);

    const wellnessScore = scores.length
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : null;

    const record = await prisma.wellnessEntry.upsert({
      where: {
        userId_date: {
          userId,
          date: dateObj,
        },
      },
      update: { ...data, wellnessScore },
      create: {
        ...data,
        userId,
        date: dateObj,
        wellnessScore,
      },
    });

    sendSuccess(res, record, 'Wellness entry saved successfully');
  } catch (error) {
    console.error('Upsert wellness entry error:', error);
    sendError(res, 'Failed to save wellness entry', 500);
  }
};

// Get wellness statistics
export const getWellnessStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { startDate, endDate } = req.query;

    const where: any = { userId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const entries = await prisma.wellnessEntry.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    const calculateAverage = (field: keyof typeof entries[0]) => {
      const valid = entries.filter((e) => e[field] !== null);
      return valid.length
        ? valid.reduce((sum, e) => sum + (e[field] as number || 0), 0) / valid.length
        : null;
    };

    const stats = {
      totalEntries: entries.length,
      averages: {
        sleepHours: calculateAverage('sleepHours'),
        sleepQuality: calculateAverage('sleepQuality'),
        energyLevel: calculateAverage('energyLevel'),
        moodScore: calculateAverage('moodScore'),
        stressLevel: calculateAverage('stressLevel'),
        mentalClarity: calculateAverage('mentalClarity'),
        anxietyLevel: calculateAverage('anxietyLevel'),
        dietDiscipline: calculateAverage('dietDiscipline'),
        wellnessScore: calculateAverage('wellnessScore'),
      },
      totals: {
        screenTimeMin: entries.reduce((sum, e) => sum + (e.screenTimeMin || 0), 0),
        socialTimeMin: entries.reduce((sum, e) => sum + (e.socialTimeMin || 0), 0),
        outdoorTimeMin: entries.reduce((sum, e) => sum + (e.outdoorTimeMin || 0), 0),
        sunlightMinutes: entries.reduce((sum, e) => sum + (e.sunlightMinutes || 0), 0),
      },
      habits: {
        morningRoutineDays: entries.filter((e) => e.morningRoutine).length,
        eveningRoutineDays: entries.filter((e) => e.eveningRoutine).length,
        noLateSnacksDays: entries.filter((e) => e.noLateSnacks).length,
      },
      trend: entries.map((e) => ({
        date: e.date,
        wellnessScore: e.wellnessScore,
        sleepHours: e.sleepHours,
        energyLevel: e.energyLevel,
        moodScore: e.moodScore,
      })),
    };

    sendSuccess(res, stats);
  } catch (error) {
    console.error('Get wellness stats error:', error);
    sendError(res, 'Failed to fetch wellness statistics', 500);
  }
};
