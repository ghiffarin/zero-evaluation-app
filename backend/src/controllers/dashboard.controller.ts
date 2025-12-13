import { Request, Response } from 'express';
import prisma from '../utils/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';

// Get today's summary
export const getTodaySummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Get today's date at midnight in local timezone
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [dailyLog, wellness, reflection, workouts, skills, financial, ielts] =
      await Promise.all([
        prisma.dailyLog.findFirst({
          where: { userId, date: { gte: today, lt: tomorrow } },
        }),
        prisma.wellnessEntry.findFirst({
          where: { userId, date: { gte: today, lt: tomorrow } },
        }),
        prisma.reflectionEntry.findFirst({
          where: { userId, date: { gte: today, lt: tomorrow } },
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
      dailyLog: dailyLog
        ? {
          moodScore: dailyLog.moodScore,
          energyScore: dailyLog.energyScore,
          sleepHours: dailyLog.sleepHours,
          workHours: dailyLog.workHours,
          learningHours: dailyLog.learningHours,
        }
        : null,
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
    const offset = parseInt((req.query.offset as string) || '0');

    // Calculate date range to limit data fetched (max 100 days)
    const maxDaysToFetch = 100;
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999); // End of today
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - maxDaysToFetch);
    startDate.setHours(0, 0, 0, 0); // Start of day

    // Fetch data with date filtering for better performance
    const [
      dailyLogs,
      wellness,
      workouts,
      skills,
      ielts,
      books,
      mastersPrep,
      career,
      careerLogs,
      financial,
    ] = await Promise.all([
      prisma.dailyLog.findMany({
        where: {
          userId,
          date: { gte: startDate, lte: endDate }
        },
        orderBy: { date: 'asc' },
      }),
      prisma.wellnessEntry.findMany({
        where: {
          userId,
          date: { gte: startDate, lte: endDate }
        },
        orderBy: { date: 'asc' },
      }),
      prisma.workoutSession.findMany({
        where: {
          userId,
          date: { gte: startDate, lte: endDate }
        },
        orderBy: { date: 'asc' },
      }),
      prisma.skillSession.findMany({
        where: {
          userId,
          date: { gte: startDate, lte: endDate }
        },
        orderBy: { date: 'asc' },
      }),
      prisma.ieltsSession.findMany({
        where: {
          userId,
          date: { gte: startDate, lte: endDate }
        },
        orderBy: { date: 'asc' },
      }),
      prisma.bookReadingSession.findMany({
        where: {
          userId,
          date: { gte: startDate, lte: endDate }
        },
        orderBy: { date: 'asc' },
      }),
      prisma.mastersPrepSession.findMany({
        where: {
          userId,
          date: { gte: startDate, lte: endDate }
        },
        orderBy: { date: 'asc' },
      }),
      prisma.careerActivity.findMany({
        where: {
          userId,
          date: { gte: startDate, lte: endDate }
        },
        orderBy: { date: 'asc' },
      }),
      prisma.careerActivityLog.findMany({
        where: {
          userId,
          date: { gte: startDate, lte: endDate }
        },
        orderBy: { date: 'asc' },
      }),
      prisma.financialTransaction.findMany({
        where: {
          userId,
          date: { gte: startDate, lte: endDate }
        },
        orderBy: { date: 'asc' },
      }),
    ]);

    // Helper to format date as YYYY-MM-DD
    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    // Collect all unique dates that have ANY data
    const allDatesWithData = new Set<string>();
    dailyLogs.forEach(d => allDatesWithData.add(formatDate(d.date)));
    wellness.forEach(w => allDatesWithData.add(formatDate(w.date)));
    workouts.forEach(w => allDatesWithData.add(formatDate(w.date)));
    skills.forEach(s => allDatesWithData.add(formatDate(s.date)));
    ielts.forEach(i => allDatesWithData.add(formatDate(i.date)));
    books.forEach(b => allDatesWithData.add(formatDate(b.date)));
    mastersPrep.forEach(m => allDatesWithData.add(formatDate(m.date)));
    career.forEach(c => allDatesWithData.add(formatDate(c.date)));
    careerLogs.forEach(c => allDatesWithData.add(formatDate(c.date)));
    financial.forEach(f => allDatesWithData.add(formatDate(f.date)));

    // Sort dates and apply offset-based pagination
    const sortedDates = Array.from(allDatesWithData).sort();
    const endIndex = sortedDates.length - (offset * 14);
    const startIndex = Math.max(0, endIndex - 14);
    const dateRange = sortedDates.slice(startIndex, endIndex);

    // Calculate pagination metadata
    const hasPrevious = startIndex > 0; // Can go to older data if there are dates before startIndex
    const hasNext = offset > 0; // Can go to newer data if we're not at offset 0

    // If no data at all, return empty response
    if (dateRange.length === 0) {
      sendSuccess(res, {
        period: { start: null, end: null, days: 0 },
        timeInvestment: [],
        wellnessTrend: [],
        learningBreakdown: [],
        financialFlow: [],
        activityHeatmap: [],
        summary: {
          totalLearningHours: 0,
          totalWorkoutHours: 0,
          totalWorkHours: 0,
          avgWellnessScore: null,
          daysTracked: 0,
          streakDays: 0,
        },
      });
      return;
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

    const dailyLogsByDate = groupByDate(dailyLogs);
    const workoutsByDate = groupByDate(workouts);
    const skillsByDate = groupByDate(skills);
    const ieltsByDate = groupByDate(ielts);
    const booksByDate = groupByDate(books);
    const mastersPrepByDate = groupByDate(mastersPrep);
    const careerByDate = groupByDate(career);
    const careerLogsByDate = groupByDate(careerLogs);
    const financialByDate = groupByDate(financial);
    const wellnessByDate = groupByDate(wellness);

    // Helper to format display date as D Day
    const formatDisplayDate = (dateStr: string) => {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return `${day} ${dayNames[date.getDay()]}`;
    };

    // 1. Time Investment Chart Data - show all days of the week
    const timeInvestmentData = dateRange
      .map(date => {
        const dayDailyLog = dailyLogsByDate.get(date)?.[0];
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
        // Include work hours from DailyLog, Career activities, and Career activity logs
        const dayCareerLogs = careerLogsByDate.get(date) || [];
        const careerHours = dayCareer.reduce((sum, c) => sum + (c.timeSpentMin || 0), 0) / 60;
        const careerLogHours = dayCareerLogs.reduce((sum, c) => sum + (c.timeSpentMin || 0), 0) / 60;
        const dailyLogWorkHours = dayDailyLog?.workHours || 0;
        const workHours = careerHours + careerLogHours + dailyLogWorkHours;

        return {
          date,
          displayDate: formatDisplayDate(date),
          workout: Number(workoutHours.toFixed(2)),
          learning: Number(learningHours.toFixed(2)),
          work: Number(workHours.toFixed(2)),
          dayScore: dayDailyLog?.dayScore || null,
        };
      });

    // 2. Wellness Trend Data - show all days of the week
    const wellnessTrendData = dateRange
      .map(date => {
        const dayWellness = wellnessByDate.get(date)?.[0];

        return {
          date,
          displayDate: formatDisplayDate(date),
          sleep: dayWellness?.sleepHours || null,
          energy: dayWellness?.energyLevel || null,
          mood: dayWellness?.moodScore || null,
          stress: dayWellness?.stressLevel || null,
        };
      });

    // 3. Learning Breakdown Data (daily stacked bar chart - dates on X-axis, hours on Y-axis)
    const totalIeltsMin = ielts.reduce((sum, i) => sum + (i.timeSpentMin || 0), 0);
    const totalSkillsMin = skills.reduce((sum, s) => sum + (s.timeSpentMin || 0), 0);
    const totalBooksMin = books.reduce((sum, b) => sum + (b.timeSpentMin || 0), 0);
    const totalMastersPrepMin = mastersPrep.reduce((sum, m) => sum + (m.timeSpentMin || 0), 0);

    const learningBreakdownData = dateRange
      .map(date => {
        const dayIelts = ieltsByDate.get(date) || [];
        const daySkills = skillsByDate.get(date) || [];
        const dayBooks = booksByDate.get(date) || [];
        const dayMastersPrep = mastersPrepByDate.get(date) || [];

        const ieltsHours = dayIelts.reduce((sum, i) => sum + (i.timeSpentMin || 0), 0) / 60;
        const skillsHours = daySkills.reduce((sum, s) => sum + (s.timeSpentMin || 0), 0) / 60;
        const booksHours = dayBooks.reduce((sum, b) => sum + (b.timeSpentMin || 0), 0) / 60;
        const mastersPrepHours = dayMastersPrep.reduce((sum, m) => sum + (m.timeSpentMin || 0), 0) / 60;

        return {
          date,
          displayDate: formatDisplayDate(date),
          ielts: Number(ieltsHours.toFixed(2)),
          skills: Number(skillsHours.toFixed(2)),
          books: Number(booksHours.toFixed(2)),
          mastersPrep: Number(mastersPrepHours.toFixed(2)),
        };
      });

    // 4. Financial Flow Data - group by actual weeks with data
    const financialDates = financial.map(f => formatDate(f.date)).sort();
    const weeklyFinancialData: { week: string; spending: number; income: number; investment: number }[] = [];

    if (financialDates.length > 0) {
      const firstFinancialDate = new Date(financialDates[0]);
      const lastFinancialDate = new Date(financialDates[financialDates.length - 1]);
      const weekCount = Math.ceil((lastFinancialDate.getTime() - firstFinancialDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;

      for (let i = 0; i < Math.min(weekCount, 4); i++) { // Max 4 weeks
        const weekStart = new Date(firstFinancialDate);
        weekStart.setDate(weekStart.getDate() + i * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const weekTransactions = financial.filter(t => {
          const txDate = new Date(t.date);
          return txDate >= weekStart && txDate <= weekEnd;
        });

        if (weekTransactions.length > 0) {
          weeklyFinancialData.push({
            week: `Week ${i + 1}`,
            spending: weekTransactions.filter(t => t.direction === 'spend').reduce((sum, t) => sum + t.amountIdr, 0),
            income: weekTransactions.filter(t => t.direction === 'income').reduce((sum, t) => sum + t.amountIdr, 0),
            investment: weekTransactions.filter(t => t.direction === 'invest').reduce((sum, t) => sum + t.amountIdr, 0),
          });
        }
      }
    }

    // 5. Activity Heatmap Data - only dates with data
    const activityHeatmapData = dateRange.map(date => {
      const [year, month, day] = date.split('-').map(Number);
      const d = new Date(year, month - 1, day);

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
        day: d.getDate(),
        weekday: d.getDay(),
        intensity: activeModules,
        level: activeModules === 0 ? 0 : activeModules <= 2 ? 1 : activeModules <= 4 ? 2 : activeModules <= 5 ? 3 : 4,
      };
    });

    // 6. Summary Stats
    const summaryStats = {
      totalLearningHours: Number(((totalIeltsMin + totalSkillsMin + totalBooksMin + totalMastersPrepMin) / 60).toFixed(1)),
      totalWorkoutHours: Number((workouts.reduce((sum, w) => sum + (w.durationMin || 0), 0) / 60).toFixed(1)),
      // Include work hours from DailyLog, Career activities, and Career activity logs
      totalWorkHours: Number((
        career.reduce((sum, c) => sum + (c.timeSpentMin || 0), 0) / 60 +
        careerLogs.reduce((sum, c) => sum + (c.timeSpentMin || 0), 0) / 60 +
        dailyLogs.reduce((sum, d) => sum + (d.workHours || 0), 0)
      ).toFixed(1)),
      avgWellnessScore: wellness.length > 0
        ? Number((wellness.reduce((sum, w) => sum + (w.wellnessScore || 0), 0) / wellness.length).toFixed(1))
        : null,
      daysTracked: dateRange.length,
      streakDays: calculateStreak(dateRange, dateRange), // All dates in range have data
    };

    const periodStartDate = dateRange.length > 0 ? new Date(dateRange[0]) : null;
    const periodEndDate = dateRange.length > 0 ? new Date(dateRange[dateRange.length - 1]) : null;

    sendSuccess(res, {
      period: { start: periodStartDate, end: periodEndDate, days: dateRange.length },
      timeInvestment: timeInvestmentData,
      wellnessTrend: wellnessTrendData,
      learningBreakdown: learningBreakdownData,
      financialFlow: weeklyFinancialData,
      activityHeatmap: activityHeatmapData,
      summary: summaryStats,
      pagination: {
        hasNext,
        hasPrevious,
        currentOffset: offset,
      },
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
