import { Request, Response } from 'express';
import prisma from '../utils/prisma.js';
import { sendSuccess, sendCreated, sendError, sendNotFound } from '../utils/response.js';
import { createCrudController } from '../services/crud.service.js';

// IELTS Sessions
const sessionCrud = createCrudController({
  model: 'ieltsSession',
  include: { mistakes: true, vocab: true },
  orderBy: { date: 'desc' },
  searchFields: ['materialName', 'subSkill', 'notes'],
});

export const createIeltsSession = sessionCrud.create;
export const getAllIeltsSessions = sessionCrud.getAll;
export const getIeltsSessionById = sessionCrud.getOne;
export const updateIeltsSession = sessionCrud.update;
export const deleteIeltsSession = sessionCrud.delete;

// Get IELTS statistics
export const getIeltsStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { startDate, endDate } = req.query;

    const where: any = { userId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const sessions = await prisma.ieltsSession.findMany({
      where,
      include: { mistakes: true },
    });

    // Calculate stats by skill type
    const statsBySkill: Record<string, any> = {};
    const skillTypes = ['listening', 'reading', 'writing_task1', 'writing_task2', 'speaking'];

    skillTypes.forEach((skill) => {
      const skillSessions = sessions.filter((s) => s.skillType === skill);
      if (skillSessions.length > 0) {
        const withBand = skillSessions.filter((s) => s.estimatedBand !== null);
        statsBySkill[skill] = {
          totalSessions: skillSessions.length,
          totalMinutes: skillSessions.reduce((sum, s) => sum + (s.timeSpentMin || 0), 0),
          averageBand: withBand.length
            ? withBand.reduce((sum, s) => sum + (s.estimatedBand || 0), 0) / withBand.length
            : null,
          latestBand: withBand.length ? withBand[0].estimatedBand : null,
          averageConfidence: skillSessions.filter((s) => s.confidenceScore).length
            ? skillSessions.reduce((sum, s) => sum + (s.confidenceScore || 0), 0) /
              skillSessions.filter((s) => s.confidenceScore).length
            : null,
        };
      }
    });

    // Calculate overall stats
    const withBand = sessions.filter((s) => s.estimatedBand !== null);
    const overallStats = {
      totalSessions: sessions.length,
      totalMinutes: sessions.reduce((sum, s) => sum + (s.timeSpentMin || 0), 0),
      averageBand: withBand.length
        ? withBand.reduce((sum, s) => sum + (s.estimatedBand || 0), 0) / withBand.length
        : null,
      totalVocab: sessions.reduce((sum, s) => sum + (s.newVocabCount || 0), 0),
    };

    // Get mistake categories
    const allMistakes = sessions.flatMap((s) => s.mistakes);
    const mistakesByCategory: Record<string, number> = {};
    allMistakes.forEach((m) => {
      mistakesByCategory[m.category] = (mistakesByCategory[m.category] || 0) + 1;
    });

    sendSuccess(res, {
      overall: overallStats,
      bySkill: statsBySkill,
      mistakesByCategory,
    });
  } catch (error) {
    console.error('Get IELTS stats error:', error);
    sendError(res, 'Failed to fetch IELTS statistics', 500);
  }
};

// IELTS Vocab
const vocabCrud = createCrudController({
  model: 'ieltsVocab',
  orderBy: { createdAt: 'desc' },
  searchFields: ['phrase', 'meaning'],
  dateField: 'createdAt',
});

export const createIeltsVocab = vocabCrud.create;
export const getAllIeltsVocab = vocabCrud.getAll;
export const getIeltsVocabById = vocabCrud.getOne;
export const updateIeltsVocab = vocabCrud.update;
export const deleteIeltsVocab = vocabCrud.delete;

// Add mistake to session
export const addMistakeToSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { sessionId } = req.params;

    // Verify session ownership
    const session = await prisma.ieltsSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      sendNotFound(res, 'IELTS session not found');
      return;
    }

    const mistake = await prisma.ieltsMistake.create({
      data: {
        ...req.body,
        ieltsSessionId: sessionId,
      },
    });

    sendCreated(res, mistake, 'Mistake added successfully');
  } catch (error) {
    console.error('Add mistake error:', error);
    sendError(res, 'Failed to add mistake', 500);
  }
};
