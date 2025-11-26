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

// Aggregate daily data from all modules for a specific date
export const aggregateDailyData = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { date } = req.params;
    const targetDate = new Date(date);

    // Set date range for the day (start of day to end of day)
    const startOfDay = new Date(targetDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Fetch data from all modules in parallel
    const [
      ieltsSessions,
      skillSessions,
      bookSessions,
      workoutSessions,
      wellnessEntry,
      financialTransactions,
      careerActivities,
      careerActivityLogs,
      mastersPrepSessions,
      journalEntries,
      reflectionEntries,
    ] = await Promise.all([
      // IELTS Sessions
      prisma.ieltsSession.findMany({
        where: { userId, date: targetDate },
        select: { timeSpentMin: true, skillType: true, estimatedBand: true },
      }),
      // Skill Sessions
      prisma.skillSession.findMany({
        where: { userId, date: targetDate },
        select: { timeSpentMin: true, skillCategory: true, subSkill: true },
      }),
      // Book Reading Sessions
      prisma.bookReadingSession.findMany({
        where: { userId, date: targetDate },
        select: { timeSpentMin: true, pagesRead: true },
      }),
      // Workout Sessions
      prisma.workoutSession.findMany({
        where: { userId, date: targetDate },
        select: { durationMin: true, workoutType: true, calories: true, steps: true, distanceKm: true },
      }),
      // Wellness Entry (one per day)
      prisma.wellnessEntry.findFirst({
        where: { userId, date: targetDate },
      }),
      // Financial Transactions
      prisma.financialTransaction.findMany({
        where: { userId, date: targetDate },
        select: { amountIdr: true, direction: true, category: true },
      }),
      // Career Activities (activities created on this date)
      prisma.careerActivity.findMany({
        where: { userId, date: targetDate },
        select: { id: true, timeSpentMin: true, activityType: true, targetEntity: true },
      }),
      // Career Activity Logs (logged work on this specific date)
      prisma.careerActivityLog.findMany({
        where: { userId, date: targetDate },
        select: {
          timeSpentMin: true,
          progress: true,
          activity: {
            select: { activityType: true, targetEntity: true },
          },
        },
      }),
      // Masters Prep Sessions
      prisma.mastersPrepSession.findMany({
        where: { userId, date: targetDate },
        select: { timeSpentMin: true },
      }),
      // Journal Entries
      prisma.journalEntry.findMany({
        where: { userId, date: targetDate },
        select: { id: true, category: true },
      }),
      // Reflection Entries
      prisma.reflectionEntry.findMany({
        where: { userId, date: targetDate },
        select: { id: true },
      }),
    ]);

    // Calculate aggregated metrics
    const ieltsMinutes = ieltsSessions.reduce((sum, s) => sum + (s.timeSpentMin || 0), 0);
    const skillMinutes = skillSessions.reduce((sum, s) => sum + (s.timeSpentMin || 0), 0);
    const bookMinutes = bookSessions.reduce((sum, s) => sum + (s.timeSpentMin || 0), 0);
    const mastersPrepMinutes = mastersPrepSessions.reduce((sum, s) => sum + (s.timeSpentMin || 0), 0);

    // Career minutes comes from activity logs (time spent on this specific date)
    // Activity logs track daily progress, so this gives us the actual work done on this date
    const careerLogMinutes = careerActivityLogs.reduce((sum, s) => sum + (s.timeSpentMin || 0), 0);
    // Also include direct activity time for activities created on this date without logs
    const careerActivityMinutes = careerActivities.reduce((sum, s) => sum + (s.timeSpentMin || 0), 0);
    // Total career minutes = logs for this date + activities without logs created on this date
    const careerMinutes = careerLogMinutes > 0 ? careerLogMinutes : careerActivityMinutes;

    const totalLearningMinutes = ieltsMinutes + skillMinutes + bookMinutes + mastersPrepMinutes;
    const totalWorkMinutes = careerMinutes;
    const totalWorkoutMinutes = workoutSessions.reduce((sum, s) => sum + (s.durationMin || 0), 0);
    const totalSteps = workoutSessions.reduce((sum, s) => sum + (s.steps || 0), 0);
    const totalCalories = workoutSessions.reduce((sum, s) => sum + (s.calories || 0), 0);
    const totalPagesRead = bookSessions.reduce((sum, s) => sum + (s.pagesRead || 0), 0);

    // Financial calculations
    const spending = financialTransactions
      .filter(t => t.direction === 'spend')
      .reduce((sum, t) => sum + t.amountIdr, 0);
    const income = financialTransactions
      .filter(t => t.direction === 'income')
      .reduce((sum, t) => sum + t.amountIdr, 0);
    const investment = financialTransactions
      .filter(t => t.direction === 'invest')
      .reduce((sum, t) => sum + t.amountIdr, 0);

    // Build aggregated data object
    const aggregatedData = {
      date: date,

      // Time metrics (converted to hours where appropriate)
      workHours: totalWorkMinutes / 60,
      learningHours: totalLearningMinutes / 60,
      workoutMinutes: totalWorkoutMinutes,

      // Wellness metrics (from WellnessEntry if exists)
      sleepHours: wellnessEntry?.sleepHours || null,
      sleepQuality: wellnessEntry?.sleepQuality || null,
      moodScore: wellnessEntry?.moodScore || null,
      energyScore: wellnessEntry?.energyLevel || null,
      stressLevel: wellnessEntry?.stressLevel || null,
      hydrationLiters: wellnessEntry?.hydrationLiters || null,

      // Financial metrics
      moneySpent: spending,
      moneyEarned: income,
      moneyInvested: investment,

      // Activity counts
      steps: totalSteps || null,
      calories: totalCalories || null,
      pagesRead: totalPagesRead || null,

      // Session breakdown
      breakdown: {
        ielts: {
          sessions: ieltsSessions.length,
          minutes: ieltsMinutes,
          details: ieltsSessions,
        },
        skills: {
          sessions: skillSessions.length,
          minutes: skillMinutes,
          details: skillSessions,
        },
        books: {
          sessions: bookSessions.length,
          minutes: bookMinutes,
          pagesRead: totalPagesRead,
          details: bookSessions,
        },
        workouts: {
          sessions: workoutSessions.length,
          minutes: totalWorkoutMinutes,
          calories: totalCalories,
          steps: totalSteps,
          details: workoutSessions,
        },
        career: {
          activities: careerActivities.length,
          logs: careerActivityLogs.length,
          minutes: careerMinutes,
          logMinutes: careerLogMinutes,
          activityMinutes: careerActivityMinutes,
          details: careerActivities,
          logDetails: careerActivityLogs,
        },
        mastersPrep: {
          sessions: mastersPrepSessions.length,
          minutes: mastersPrepMinutes,
        },
        financial: {
          transactions: financialTransactions.length,
          spending,
          income,
          investment,
          byCategory: financialTransactions.reduce((acc, t) => {
            if (!acc[t.category]) acc[t.category] = 0;
            acc[t.category] += t.amountIdr;
            return acc;
          }, {} as Record<string, number>),
        },
        journals: {
          entries: journalEntries.length,
        },
        reflections: {
          entries: reflectionEntries.length,
        },
        wellness: wellnessEntry ? {
          logged: true,
          sleepHours: wellnessEntry.sleepHours,
          sleepQuality: wellnessEntry.sleepQuality,
          energyLevel: wellnessEntry.energyLevel,
          moodScore: wellnessEntry.moodScore,
          stressLevel: wellnessEntry.stressLevel,
          hydrationLiters: wellnessEntry.hydrationLiters,
          screenTimeMin: wellnessEntry.screenTimeMin,
          socialTimeMin: wellnessEntry.socialTimeMin,
          outdoorTimeMin: wellnessEntry.outdoorTimeMin,
          morningRoutine: wellnessEntry.morningRoutine,
          eveningRoutine: wellnessEntry.eveningRoutine,
        } : {
          logged: false,
        },
      },

      // Flags for what data exists
      hasData: {
        ielts: ieltsSessions.length > 0,
        skills: skillSessions.length > 0,
        books: bookSessions.length > 0,
        workouts: workoutSessions.length > 0,
        wellness: !!wellnessEntry,
        financial: financialTransactions.length > 0,
        career: careerActivities.length > 0 || careerActivityLogs.length > 0,
        mastersPrep: mastersPrepSessions.length > 0,
        journals: journalEntries.length > 0,
        reflections: reflectionEntries.length > 0,
      },
    };

    sendSuccess(res, aggregatedData);
  } catch (error) {
    console.error('Aggregate daily data error:', error);
    sendError(res, 'Failed to aggregate daily data', 500);
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
