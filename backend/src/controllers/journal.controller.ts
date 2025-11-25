import { Request, Response } from 'express';
import prisma from '../utils/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { createCrudController } from '../services/crud.service.js';

const crud = createCrudController({
  model: 'journalEntry',
  orderBy: { date: 'desc' },
  searchFields: ['title', 'authors', 'summary', 'keyInsights'],
});

export const createJournalEntry = crud.create;
export const getAllJournalEntries = crud.getAll;
export const getJournalEntryById = crud.getOne;
export const updateJournalEntry = crud.update;
export const deleteJournalEntry = crud.delete;

// Get journal statistics
export const getJournalStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { startDate, endDate } = req.query;

    const where: any = { userId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const entries = await prisma.journalEntry.findMany({ where });

    // Stats by category
    const byCategory: Record<string, number> = {};
    const byContentType: Record<string, number> = {};

    entries.forEach((entry) => {
      byCategory[entry.category] = (byCategory[entry.category] || 0) + 1;
      byContentType[entry.contentType] = (byContentType[entry.contentType] || 0) + 1;
    });

    const stats = {
      totalEntries: entries.length,
      totalReadingMinutes: entries.reduce((sum, e) => sum + (e.timeSpentMin || 0), 0),
      averageUsefulness: entries.filter((e) => e.ratingUsefulness).length
        ? entries.reduce((sum, e) => sum + (e.ratingUsefulness || 0), 0) /
          entries.filter((e) => e.ratingUsefulness).length
        : null,
      byCategory,
      byContentType,
    };

    sendSuccess(res, stats);
  } catch (error) {
    console.error('Get journal stats error:', error);
    sendError(res, 'Failed to fetch journal statistics', 500);
  }
};
