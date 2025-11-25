import { Request, Response } from 'express';
import prisma from '../utils/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { createCrudController } from '../services/crud.service.js';

const crud = createCrudController({
  model: 'skillSession',
  include: { project: true },
  orderBy: { date: 'desc' },
  searchFields: ['subSkill', 'outputSummary', 'learnedPoints'],
});

export const createSkillSession = crud.create;
export const getAllSkillSessions = crud.getAll;
export const getSkillSessionById = crud.getOne;
export const updateSkillSession = crud.update;
export const deleteSkillSession = crud.delete;

// Get skill statistics
export const getSkillStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { startDate, endDate } = req.query;

    const where: any = { userId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const sessions = await prisma.skillSession.findMany({ where });

    // Stats by category
    const byCategory: Record<string, any> = {};
    sessions.forEach((s) => {
      if (!byCategory[s.skillCategory]) {
        byCategory[s.skillCategory] = {
          sessions: 0,
          totalMinutes: 0,
          averageMastery: [],
          averageQuality: [],
        };
      }
      byCategory[s.skillCategory].sessions++;
      byCategory[s.skillCategory].totalMinutes += s.timeSpentMin || 0;
      if (s.masteryLevel) byCategory[s.skillCategory].averageMastery.push(s.masteryLevel);
      if (s.qualityScore) byCategory[s.skillCategory].averageQuality.push(s.qualityScore);
    });

    // Calculate averages
    Object.keys(byCategory).forEach((key) => {
      const cat = byCategory[key];
      cat.averageMastery = cat.averageMastery.length
        ? cat.averageMastery.reduce((a: number, b: number) => a + b, 0) / cat.averageMastery.length
        : null;
      cat.averageQuality = cat.averageQuality.length
        ? cat.averageQuality.reduce((a: number, b: number) => a + b, 0) / cat.averageQuality.length
        : null;
    });

    const stats = {
      totalSessions: sessions.length,
      totalMinutes: sessions.reduce((sum, s) => sum + (s.timeSpentMin || 0), 0),
      averageMastery: sessions.filter((s) => s.masteryLevel).length
        ? sessions.reduce((sum, s) => sum + (s.masteryLevel || 0), 0) /
          sessions.filter((s) => s.masteryLevel).length
        : null,
      averageQuality: sessions.filter((s) => s.qualityScore).length
        ? sessions.reduce((sum, s) => sum + (s.qualityScore || 0), 0) /
          sessions.filter((s) => s.qualityScore).length
        : null,
      byCategory,
    };

    sendSuccess(res, stats);
  } catch (error) {
    console.error('Get skill stats error:', error);
    sendError(res, 'Failed to fetch skill statistics', 500);
  }
};
