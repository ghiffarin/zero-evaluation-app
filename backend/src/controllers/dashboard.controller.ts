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

// Get chart data for dashboard visualizations
export const getChartData = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const days = parseInt((req.query.days as string) || '14');
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days + 1);
    startDate.setHours(0, 0, 0, 0);

    // Fetch all data for the period
    const [
      dailyLogs,
      wellness,
      workouts,
      skills,
      ielts,
      books,
      mastersPrep,
      career,
      financial,
    ] = await Promise.all([
      prisma.dailyLog.findMany({
        where: { userId, date: { gte: startDate, lte: endDate } },
        orderBy: { date: 'asc' },
      }),
      prisma.wellnessEntry.findMany({
        where: { userId, date: { gte: startDate, lte: endDate } },
        orderBy: { date: 'asc' },
      }),
      prisma.workoutSession.findMany({
        where: { userId, date: { gte: startDate, lte: endDate } },
        orderBy: { date: 'asc' },
      }),
      prisma.skillSession.findMany({
        where: { userId, date: { gte: startDate, lte: endDate } },
        orderBy: { date: 'asc' },
      }),
      prisma.ieltsSession.findMany({
        where: { userId, date: { gte: startDate, lte: endDate } },
        orderBy: { date: 'asc' },
      }),
      prisma.bookReadingSession.findMany({
        where: { userId, date: { gte: startDate, lte: endDate } },
        orderBy: { date: 'asc' },
      }),
      prisma.mastersPrepSession.findMany({
        where: { userId, date: { gte: startDate, lte: endDate } },
        orderBy: { date: 'asc' },
      }),
      prisma.careerActivity.findMany({
        where: { userId, date: { gte: startDate, lte: endDate } },
        orderBy: { date: 'asc' },
      }),
      prisma.financialTransaction.findMany({
        where: { userId, date: { gte: startDate, lte: endDate } },
        orderBy: { date: 'asc' },
      }),
    ]);

    // Helper to format date as YYYY-MM-DD
    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    // Create date range array
    const dateRange: string[] = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      dateRange.push(formatDate(current));
      current.setDate(current.getDate() + 1);
    }

    // Group data by date
    const groupByDate = <T extends { date: Date }>(items: T[]) => {
      const map = new Map<string, T[]>();
      items.forEach(item => {
        const dateKey = formatDate(item.date);
        if (!map.has(dateKey)) map.set(dateKey, []);
        map.get(dateKey)!.push(item);
      });
      return map;
    };

    const workoutsByDate = groupByDate(workouts);
    const skillsByDate = groupByDate(skills);
    const ieltsByDate = groupByDate(ielts);
    const booksByDate = groupByDate(books);
    const mastersPrepByDate = groupByDate(mastersPrep);
    const careerByDate = groupByDate(career);
    const financialByDate = groupByDate(financial);
    const wellnessByDate = groupByDate(wellness);

    // 1. Time Investment Chart Data (stacked bar chart)
    const timeInvestmentData = dateRange.map(date => {
      const dayWorkouts = workoutsByDate.get(date) || [];
      const daySkills = skillsByDate.get(date) || [];
      const dayIelts = ieltsByDate.get(date) || [];
      const dayBooks = booksByDate.get(date) || [];
      const dayMastersPrep = mastersPrepByDate.get(date) || [];
      const dayCareer = careerByDate.get(date) || [];

      const workoutHours = dayWorkouts.reduce((sum, w) => sum + (w.durationMin || 0), 0) / 60;
      const learningHours = (
        daySkills.reduce((sum, s) => sum + (s.timeSpentMin || 0), 0) +
        dayIelts.reduce((sum, i) => sum + (i.timeSpentMin || 0), 0) +
        dayBooks.reduce((sum, b) => sum + (b.timeSpentMin || 0), 0) +
        dayMastersPrep.reduce((sum, m) => sum + (m.timeSpentMin || 0), 0)
      ) / 60;
      const workHours = dayCareer.reduce((sum, c) => sum + (c.timeSpentMin || 0), 0) / 60;

      return {
        date,
        displayDate: new Date(date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
        workout: Number(workoutHours.toFixed(2)),
        learning: Number(learningHours.toFixed(2)),
        work: Number(workHours.toFixed(2)),
      };
    });

    // 2. Wellness Trend Data (line chart)
    const wellnessTrendData = dateRange.map(date => {
      const dayWellness = wellnessByDate.get(date)?.[0];
      return {
        date,
        displayDate: new Date(date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
        sleep: dayWellness?.sleepHours || null,
        energy: dayWellness?.energyLevel || null,
        mood: dayWellness?.moodScore || null,
        stress: dayWellness?.stressLevel || null,
      };
    });

    // 3. Learning Breakdown Data (pie/donut chart)
    const totalIeltsMin = ielts.reduce((sum, i) => sum + (i.timeSpentMin || 0), 0);
    const totalSkillsMin = skills.reduce((sum, s) => sum + (s.timeSpentMin || 0), 0);
    const totalBooksMin = books.reduce((sum, b) => sum + (b.timeSpentMin || 0), 0);
    const totalMastersPrepMin = mastersPrep.reduce((sum, m) => sum + (m.timeSpentMin || 0), 0);

    const learningBreakdownData = [
      { name: 'IELTS', value: totalIeltsMin, color: '#3b82f6' },
      { name: 'Skills', value: totalSkillsMin, color: '#10b981' },
      { name: 'Books', value: totalBooksMin, color: '#f59e0b' },
      { name: 'Masters Prep', value: totalMastersPrepMin, color: '#8b5cf6' },
    ].filter(item => item.value > 0);

    // 4. Financial Flow Data (grouped bar chart - weekly)
    const weeklyFinancialData: { week: string; spending: number; income: number; investment: number }[] = [];
    const weeks = Math.ceil(days / 7);

    for (let i = 0; i < weeks; i++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(weekStart.getDate() + i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const weekTransactions = financial.filter(t => {
        const txDate = new Date(t.date);
        return txDate >= weekStart && txDate <= weekEnd;
      });

      weeklyFinancialData.push({
        week: `Week ${i + 1}`,
        spending: weekTransactions.filter(t => t.direction === 'spend').reduce((sum, t) => sum + t.amountIdr, 0),
        income: weekTransactions.filter(t => t.direction === 'income').reduce((sum, t) => sum + t.amountIdr, 0),
        investment: weekTransactions.filter(t => t.direction === 'invest').reduce((sum, t) => sum + t.amountIdr, 0),
      });
    }

    // 5. Activity Heatmap Data
    const activityHeatmapData = dateRange.map(date => {
      const activities = [
        (workoutsByDate.get(date) || []).length > 0,
        (skillsByDate.get(date) || []).length > 0,
        (ieltsByDate.get(date) || []).length > 0,
        (booksByDate.get(date) || []).length > 0,
        (wellnessByDate.get(date) || []).length > 0,
        (financialByDate.get(date) || []).length > 0,
        (careerByDate.get(date) || []).length > 0,
      ];
      const activeModules = activities.filter(Boolean).length;

      return {
        date,
        day: new Date(date).getDate(),
        weekday: new Date(date).getDay(),
        intensity: activeModules,
        level: activeModules === 0 ? 0 : activeModules <= 2 ? 1 : activeModules <= 4 ? 2 : activeModules <= 5 ? 3 : 4,
      };
    });

    // 6. Summary Stats
    const summaryStats = {
      totalLearningHours: Number(((totalIeltsMin + totalSkillsMin + totalBooksMin + totalMastersPrepMin) / 60).toFixed(1)),
      totalWorkoutHours: Number((workouts.reduce((sum, w) => sum + (w.durationMin || 0), 0) / 60).toFixed(1)),
      totalWorkHours: Number((career.reduce((sum, c) => sum + (c.timeSpentMin || 0), 0) / 60).toFixed(1)),
      avgWellnessScore: wellness.length > 0
        ? Number((wellness.reduce((sum, w) => sum + (w.wellnessScore || 0), 0) / wellness.length).toFixed(1))
        : null,
      daysTracked: new Set([
        ...workouts.map(w => formatDate(w.date)),
        ...skills.map(s => formatDate(s.date)),
        ...wellness.map(w => formatDate(w.date)),
        ...financial.map(f => formatDate(f.date)),
      ]).size,
      streakDays: calculateStreak(dateRange, [
        ...workouts.map(w => formatDate(w.date)),
        ...skills.map(s => formatDate(s.date)),
        ...wellness.map(w => formatDate(w.date)),
      ]),
    };

    sendSuccess(res, {
      period: { start: startDate, end: endDate, days },
      timeInvestment: timeInvestmentData,
      wellnessTrend: wellnessTrendData,
      learningBreakdown: learningBreakdownData,
      financialFlow: weeklyFinancialData,
      activityHeatmap: activityHeatmapData,
      summary: summaryStats,
    });
  } catch (error) {
    console.error('Get chart data error:', error);
    sendError(res, 'Failed to fetch chart data', 500);
  }
};

// Helper to calculate streak
function calculateStreak(dateRange: string[], activeDates: string[]): number {
  const activeSet = new Set(activeDates);
  let streak = 0;

  // Start from today and go backwards
  for (let i = dateRange.length - 1; i >= 0; i--) {
    if (activeSet.has(dateRange[i])) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

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
