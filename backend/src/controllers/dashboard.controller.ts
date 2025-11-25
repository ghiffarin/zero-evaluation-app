import { Request, Response } from 'express';
import prisma from '../utils/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';

// Get today's summary
export const getTodaySummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [dailyLog, wellness, reflection, workouts, skills, financial, ielts] =
      await Promise.all([
        prisma.dailyLog.findFirst({
          where: { userId, date: today },
        }),
        prisma.wellnessEntry.findFirst({
          where: { userId, date: today },
        }),
        prisma.reflectionEntry.findFirst({
          where: { userId, date: today },
        }),
        prisma.workoutSession.findMany({
          where: { userId, date: { gte: today, lt: tomorrow } },
        }),
        prisma.skillSession.findMany({
          where: { userId, date: { gte: today, lt: tomorrow } },
        }),
        prisma.financialTransaction.findMany({
          where: { userId, date: { gte: today, lt: tomorrow } },
        }),
        prisma.ieltsSession.findMany({
          where: { userId, date: { gte: today, lt: tomorrow } },
        }),
      ]);

    const spending = financial
      .filter((t) => t.direction === 'spend')
      .reduce((sum, t) => sum + t.amountIdr, 0);

    const summary = {
      date: today,
      dailyLog,
      wellness: wellness
        ? {
            sleepHours: wellness.sleepHours,
            sleepQuality: wellness.sleepQuality,
            energyLevel: wellness.energyLevel,
            moodScore: wellness.moodScore,
            wellnessScore: wellness.wellnessScore,
          }
        : null,
      reflection: reflection
        ? {
            integrityScore: reflection.integrityScore,
            disciplineScore: reflection.disciplineScore,
            emotionalState: reflection.emotionalState,
          }
        : null,
      activities: {
        workoutSessions: workouts.length,
        workoutMinutes: workouts.reduce((sum, w) => sum + (w.durationMin || 0), 0),
        skillSessions: skills.length,
        skillMinutes: skills.reduce((sum, s) => sum + (s.timeSpentMin || 0), 0),
        ieltsSessions: ielts.length,
        ieltsMinutes: ielts.reduce((sum, i) => sum + (i.timeSpentMin || 0), 0),
      },
      financial: {
        transactions: financial.length,
        totalSpending: spending,
      },
      completion: {
        hasDailyLog: !!dailyLog,
        hasWellness: !!wellness,
        hasReflection: !!reflection,
        hasWorkout: workouts.length > 0,
      },
    };

    sendSuccess(res, summary);
  } catch (error) {
    console.error('Get today summary error:', error);
    sendError(res, 'Failed to fetch today summary', 500);
  }
};

// Get weekly overview
export const getWeeklyOverview = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { startDate } = req.query;

    const start = startDate
      ? new Date(startDate as string)
      : new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    const [dailyLogs, wellness, workouts, skills, ielts, financial, journals, books] =
      await Promise.all([
        prisma.dailyLog.findMany({
          where: { userId, date: { gte: start, lt: end } },
          orderBy: { date: 'asc' },
        }),
        prisma.wellnessEntry.findMany({
          where: { userId, date: { gte: start, lt: end } },
          orderBy: { date: 'asc' },
        }),
        prisma.workoutSession.findMany({
          where: { userId, date: { gte: start, lt: end } },
        }),
        prisma.skillSession.findMany({
          where: { userId, date: { gte: start, lt: end } },
        }),
        prisma.ieltsSession.findMany({
          where: { userId, date: { gte: start, lt: end } },
        }),
        prisma.financialTransaction.findMany({
          where: { userId, date: { gte: start, lt: end } },
        }),
        prisma.journalEntry.findMany({
          where: { userId, date: { gte: start, lt: end } },
        }),
        prisma.bookReadingSession.findMany({
          where: { userId, date: { gte: start, lt: end } },
        }),
      ]);

    // Calculate averages and totals
    const calculateAverage = (arr: any[], field: string) => {
      const valid = arr.filter((item) => item[field] !== null && item[field] !== undefined);
      return valid.length
        ? valid.reduce((sum, item) => sum + item[field], 0) / valid.length
        : null;
    };

    const spending = financial
      .filter((t) => t.direction === 'spend')
      .reduce((sum, t) => sum + t.amountIdr, 0);

    const overview = {
      period: { start, end },
      dailyLogs: {
        daysLogged: dailyLogs.length,
        averageDayScore: calculateAverage(dailyLogs, 'dayScore'),
        averageMoodScore: calculateAverage(dailyLogs, 'moodScore'),
        averageEnergyScore: calculateAverage(dailyLogs, 'energyScore'),
        totalWorkHours: dailyLogs.reduce((sum, d) => sum + (d.workHours || 0), 0),
        totalLearningHours: dailyLogs.reduce((sum, d) => sum + (d.learningHours || 0), 0),
      },
      wellness: {
        daysTracked: wellness.length,
        averageSleepHours: calculateAverage(wellness, 'sleepHours'),
        averageSleepQuality: calculateAverage(wellness, 'sleepQuality'),
        averageEnergyLevel: calculateAverage(wellness, 'energyLevel'),
        averageWellnessScore: calculateAverage(wellness, 'wellnessScore'),
      },
      fitness: {
        workoutSessions: workouts.length,
        totalWorkoutMinutes: workouts.reduce((sum, w) => sum + (w.durationMin || 0), 0),
        totalDistance: workouts.reduce((sum, w) => sum + (w.distanceKm || 0), 0),
        totalCalories: workouts.reduce((sum, w) => sum + (w.calories || 0), 0),
      },
      learning: {
        skillSessions: skills.length,
        skillMinutes: skills.reduce((sum, s) => sum + (s.timeSpentMin || 0), 0),
        ieltsSessions: ielts.length,
        ieltsMinutes: ielts.reduce((sum, i) => sum + (i.timeSpentMin || 0), 0),
        journalEntries: journals.length,
        journalMinutes: journals.reduce((sum, j) => sum + (j.timeSpentMin || 0), 0),
        bookSessions: books.length,
        pagesRead: books.reduce((sum, b) => sum + (b.pagesRead || 0), 0),
      },
      financial: {
        totalTransactions: financial.length,
        totalSpending: spending,
        averageDailySpending: spending / 7,
      },
      trends: {
        dailyScores: dailyLogs.map((d) => ({ date: d.date, score: d.dayScore })),
        wellnessScores: wellness.map((w) => ({ date: w.date, score: w.wellnessScore })),
      },
    };

    sendSuccess(res, overview);
  } catch (error) {
    console.error('Get weekly overview error:', error);
    sendError(res, 'Failed to fetch weekly overview', 500);
  }
};

// Get monthly stats
export const getMonthlyStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { year, month } = req.query;

    const now = new Date();
    const targetYear = year ? parseInt(year as string) : now.getFullYear();
    const targetMonth = month ? parseInt(month as string) - 1 : now.getMonth();

    const start = new Date(targetYear, targetMonth, 1);
    const end = new Date(targetYear, targetMonth + 1, 1);

    const [dailyLogs, goals, ielts, workouts, financial] = await Promise.all([
      prisma.dailyLog.count({ where: { userId, date: { gte: start, lt: end } } }),
      prisma.goal.findMany({ where: { userId } }),
      prisma.ieltsSession.findMany({ where: { userId, date: { gte: start, lt: end } } }),
      prisma.workoutSession.findMany({ where: { userId, date: { gte: start, lt: end } } }),
      prisma.financialTransaction.findMany({ where: { userId, date: { gte: start, lt: end } } }),
    ]);

    const daysInMonth = Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    const spending = financial.filter((t) => t.direction === 'spend').reduce((sum, t) => sum + t.amountIdr, 0);
    const income = financial.filter((t) => t.direction === 'income').reduce((sum, t) => sum + t.amountIdr, 0);

    const stats = {
      month: targetMonth + 1,
      year: targetYear,
      consistency: {
        daysLogged: dailyLogs,
        totalDays: daysInMonth,
        percentage: (dailyLogs / daysInMonth) * 100,
      },
      goals: {
        total: goals.length,
        achieved: goals.filter((g) => g.status === 'achieved').length,
        inProgress: goals.filter((g) => g.status === 'in_progress').length,
      },
      ielts: {
        sessions: ielts.length,
        totalMinutes: ielts.reduce((sum, i) => sum + (i.timeSpentMin || 0), 0),
        averageBand:
          ielts.filter((i) => i.estimatedBand).length > 0
            ? ielts.reduce((sum, i) => sum + (i.estimatedBand || 0), 0) /
              ielts.filter((i) => i.estimatedBand).length
            : null,
      },
      fitness: {
        workouts: workouts.length,
        totalMinutes: workouts.reduce((sum, w) => sum + (w.durationMin || 0), 0),
        totalDistance: workouts.reduce((sum, w) => sum + (w.distanceKm || 0), 0),
      },
      financial: {
        totalSpending: spending,
        totalIncome: income,
        netSavings: income - spending,
        savingsRate: income > 0 ? ((income - spending) / income) * 100 : 0,
      },
    };

    sendSuccess(res, stats);
  } catch (error) {
    console.error('Get monthly stats error:', error);
    sendError(res, 'Failed to fetch monthly stats', 500);
  }
};

// Get insights (cross-module correlations)
export const getInsights = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const days = parseInt((req.query.days as string) || '30');
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [dailyLogs, wellness, workouts] = await Promise.all([
      prisma.dailyLog.findMany({
        where: { userId, date: { gte: start } },
        orderBy: { date: 'asc' },
      }),
      prisma.wellnessEntry.findMany({
        where: { userId, date: { gte: start } },
        orderBy: { date: 'asc' },
      }),
      prisma.workoutSession.findMany({
        where: { userId, date: { gte: start } },
      }),
    ]);

    const insights: string[] = [];

    // Sleep vs Day Score correlation
    const daysWithBothSleepAndScore = dailyLogs.filter(
      (d) => d.sleepHours !== null && d.dayScore !== null
    );
    if (daysWithBothSleepAndScore.length >= 7) {
      const goodSleepDays = daysWithBothSleepAndScore.filter((d) => (d.sleepHours || 0) >= 7);
      const poorSleepDays = daysWithBothSleepAndScore.filter((d) => (d.sleepHours || 0) < 6);

      const avgScoreGoodSleep =
        goodSleepDays.reduce((sum, d) => sum + (d.dayScore || 0), 0) / goodSleepDays.length;
      const avgScorePoorSleep =
        poorSleepDays.reduce((sum, d) => sum + (d.dayScore || 0), 0) / poorSleepDays.length;

      if (goodSleepDays.length > 0 && poorSleepDays.length > 0) {
        if (avgScoreGoodSleep > avgScorePoorSleep + 1) {
          insights.push(
            `Your day score is ${(avgScoreGoodSleep - avgScorePoorSleep).toFixed(1)} points higher when you sleep 7+ hours`
          );
        }
      }
    }

    // Workout vs Energy correlation
    const workoutDates = new Set(workouts.map((w) => w.date.toISOString().split('T')[0]));
    const wellnessWithWorkout = wellness.filter((w) =>
      workoutDates.has(w.date.toISOString().split('T')[0])
    );
    const wellnessWithoutWorkout = wellness.filter(
      (w) => !workoutDates.has(w.date.toISOString().split('T')[0])
    );

    if (wellnessWithWorkout.length >= 5 && wellnessWithoutWorkout.length >= 5) {
      const avgEnergyWithWorkout =
        wellnessWithWorkout.reduce((sum, w) => sum + (w.energyLevel || 0), 0) /
        wellnessWithWorkout.length;
      const avgEnergyWithoutWorkout =
        wellnessWithoutWorkout.reduce((sum, w) => sum + (w.energyLevel || 0), 0) /
        wellnessWithoutWorkout.length;

      if (avgEnergyWithWorkout > avgEnergyWithoutWorkout + 0.3) {
        insights.push(
          `Your energy level is ${((avgEnergyWithWorkout - avgEnergyWithoutWorkout) * 20).toFixed(0)}% higher on workout days`
        );
      }
    }

    // Consistency insights
    const totalDays = Math.min(days, Math.floor((Date.now() - start.getTime()) / (24 * 60 * 60 * 1000)));
    const loggedDays = dailyLogs.length;
    const consistencyRate = (loggedDays / totalDays) * 100;

    if (consistencyRate < 50) {
      insights.push(`You've only logged ${consistencyRate.toFixed(0)}% of days. Try to log daily for better insights`);
    } else if (consistencyRate >= 80) {
      insights.push(`Great consistency! You've logged ${consistencyRate.toFixed(0)}% of days`);
    }

    // Workout frequency
    if (workouts.length < totalDays / 7 * 3) {
      insights.push(`Consider working out more frequently. You averaged ${(workouts.length / (totalDays / 7)).toFixed(1)} workouts per week`);
    }

    sendSuccess(res, { insights, period: { start, days } });
  } catch (error) {
    console.error('Get insights error:', error);
    sendError(res, 'Failed to fetch insights', 500);
  }
};
