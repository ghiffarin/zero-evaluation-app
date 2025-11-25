import { Request, Response } from 'express';
import prisma from '../utils/prisma.js';
import { sendSuccess, sendCreated, sendError, sendNotFound } from '../utils/response.js';
import { createCrudController } from '../services/crud.service.js';

// Workout Sessions
const crud = createCrudController({
  model: 'workoutSession',
  include: { sets: true },
  orderBy: { date: 'desc' },
  searchFields: ['routineName', 'notes', 'postMood'],
});

export const createWorkoutSession = crud.create;
export const getAllWorkoutSessions = crud.getAll;
export const getWorkoutSessionById = crud.getOne;
export const updateWorkoutSession = crud.update;
export const deleteWorkoutSession = crud.delete;

// Add set to workout session
export const addSetToWorkout = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { sessionId } = req.params;

    // Verify session ownership
    const session = await prisma.workoutSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      sendNotFound(res, 'Workout session not found');
      return;
    }

    const set = await prisma.workoutSet.create({
      data: {
        ...req.body,
        workoutSessionId: sessionId,
      },
    });

    sendCreated(res, set, 'Set added successfully');
  } catch (error) {
    console.error('Add workout set error:', error);
    sendError(res, 'Failed to add set', 500);
  }
};

// Get workout statistics
export const getWorkoutStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { startDate, endDate } = req.query;

    const where: any = { userId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const sessions = await prisma.workoutSession.findMany({
      where,
      include: { sets: true },
    });

    // Stats by workout type
    const byType: Record<string, any> = {};
    sessions.forEach((s) => {
      if (!byType[s.workoutType]) {
        byType[s.workoutType] = {
          sessions: 0,
          totalMinutes: 0,
          totalDistance: 0,
          averageIntensity: [],
        };
      }
      byType[s.workoutType].sessions++;
      byType[s.workoutType].totalMinutes += s.durationMin || 0;
      byType[s.workoutType].totalDistance += s.distanceKm || 0;
      if (s.intensityLevel) byType[s.workoutType].averageIntensity.push(s.intensityLevel);
    });

    // Calculate averages
    Object.keys(byType).forEach((key) => {
      const type = byType[key];
      type.averageIntensity = type.averageIntensity.length
        ? type.averageIntensity.reduce((a: number, b: number) => a + b, 0) /
          type.averageIntensity.length
        : null;
    });

    const stats = {
      totalSessions: sessions.length,
      totalMinutes: sessions.reduce((sum, s) => sum + (s.durationMin || 0), 0),
      totalDistance: sessions.reduce((sum, s) => sum + (s.distanceKm || 0), 0),
      totalCalories: sessions.reduce((sum, s) => sum + (s.calories || 0), 0),
      totalSteps: sessions.reduce((sum, s) => sum + (s.steps || 0), 0),
      averageQuality: sessions.filter((s) => s.workoutQuality).length
        ? sessions.reduce((sum, s) => sum + (s.workoutQuality || 0), 0) /
          sessions.filter((s) => s.workoutQuality).length
        : null,
      byType,
    };

    sendSuccess(res, stats);
  } catch (error) {
    console.error('Get workout stats error:', error);
    sendError(res, 'Failed to fetch workout statistics', 500);
  }
};
