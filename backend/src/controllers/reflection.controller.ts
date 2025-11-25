import { Request, Response } from 'express';
import prisma from '../utils/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { createCrudController } from '../services/crud.service.js';

const crud = createCrudController({
  model: 'reflectionEntry',
  orderBy: { date: 'desc' },
  searchFields: ['wentWell', 'wentWrong', 'learnedToday', 'gratitude'],
});

export const createReflectionEntry = crud.create;
export const getAllReflectionEntries = crud.getAll;
export const getReflectionEntryById = crud.getOne;
export const getReflectionEntryByDate = crud.getByDate;
export const updateReflectionEntry = crud.update;
export const deleteReflectionEntry = crud.delete;

// Upsert reflection entry by date
export const upsertReflectionEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { date } = req.params;
    const dateObj = new Date(date);

    const record = await prisma.reflectionEntry.upsert({
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

    sendSuccess(res, record, 'Reflection entry saved successfully');
  } catch (error) {
    console.error('Upsert reflection entry error:', error);
    sendError(res, 'Failed to save reflection entry', 500);
  }
};

// Get reflection statistics
export const getReflectionStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { startDate, endDate } = req.query;

    const where: any = { userId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const entries = await prisma.reflectionEntry.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    const stats = {
      totalEntries: entries.length,
      averageIntegrityScore: entries.filter((e) => e.integrityScore).length
        ? entries.reduce((sum, e) => sum + (e.integrityScore || 0), 0) /
          entries.filter((e) => e.integrityScore).length
        : null,
      averageDisciplineScore: entries.filter((e) => e.disciplineScore).length
        ? entries.reduce((sum, e) => sum + (e.disciplineScore || 0), 0) /
          entries.filter((e) => e.disciplineScore).length
        : null,
      emotionalStateBreakdown: entries.reduce((acc, e) => {
        if (e.emotionalState) {
          acc[e.emotionalState] = (acc[e.emotionalState] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>),
      trend: entries.map((e) => ({
        date: e.date,
        integrityScore: e.integrityScore,
        disciplineScore: e.disciplineScore,
        emotionalState: e.emotionalState,
      })),
    };

    sendSuccess(res, stats);
  } catch (error) {
    console.error('Get reflection stats error:', error);
    sendError(res, 'Failed to fetch reflection statistics', 500);
  }
};
