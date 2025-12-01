import { Request, Response } from 'express';
import prisma from '../utils/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';

// Helper to get date range for a month
function getMonthDateRange(year: number, month: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);
  return { startDate, endDate };
}

// Helper to get date range for a quarter
function getQuarterDateRange(year: number, quarter: number) {
  const startMonth = (quarter - 1) * 3;
  const startDate = new Date(year, startMonth, 1);
  const endDate = new Date(year, startMonth + 3, 0, 23, 59, 59, 999);
  return { startDate, endDate };
}

// Helper to get date range for a semester
function getSemesterDateRange(year: number, semester: number) {
  const startMonth = semester === 1 ? 0 : 6;
  const startDate = new Date(year, startMonth, 1);
  const endDate = new Date(year, startMonth + 6, 0, 23, 59, 59, 999);
  return { startDate, endDate };
}

// Helper to get date range for a year
function getYearDateRange(year: number) {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
  return { startDate, endDate };
}

// Aggregate time investment data
function aggregateTimeInvestment(data: {
  dailyLogs: any[];
  ielts: any[];
  journals: any[];
  books: any[];
  skills: any[];
  workouts: any[];
  career: any[];
  mastersPrep: any[];
}) {
  const { dailyLogs, ielts, journals, books, skills, workouts, career, mastersPrep } = data;

  // Calculate hours from minutes
  const ieltsHours = ielts.reduce((sum, s) => sum + (s.timeSpentMin || 0), 0) / 60;
  const journalsHours = journals.reduce((sum, j) => sum + (j.timeSpentMin || 0), 0) / 60;
  const booksHours = books.reduce((sum, b) => sum + (b.timeSpentMin || 0), 0) / 60;
  const skillsHours = skills.reduce((sum, s) => sum + (s.timeSpentMin || 0), 0) / 60;
  const workoutsHours = workouts.reduce((sum, w) => sum + (w.durationMin || 0), 0) / 60;
  const careerHours = career.reduce((sum, c) => sum + (c.timeSpentMin || 0), 0) / 60;
  const mastersPrepHours = mastersPrep.reduce((sum, m) => sum + (m.timeSpentMin || 0), 0) / 60;

  const learningHours = ieltsHours + journalsHours + booksHours + skillsHours;
  const workHours = dailyLogs.reduce((sum, d) => sum + (d.workHours || 0), 0);

  const totalHours = learningHours + workHours + workoutsHours + careerHours + mastersPrepHours;

  // Breakdown by IELTS skill type
  const ieltsBySkill: Record<string, number> = {};
  ielts.forEach(s => {
    const skill = s.skillType || 'other';
    ieltsBySkill[skill] = (ieltsBySkill[skill] || 0) + (s.timeSpentMin || 0) / 60;
  });
  Object.keys(ieltsBySkill).forEach(key => {
    ieltsBySkill[key] = Number(ieltsBySkill[key].toFixed(2));
  });

  // Breakdown by skill category
  const skillsByCategory: Record<string, number> = {};
  skills.forEach(s => {
    const category = s.skillCategory || 'other';
    skillsByCategory[category] = (skillsByCategory[category] || 0) + (s.timeSpentMin || 0) / 60;
  });
  Object.keys(skillsByCategory).forEach(key => {
    skillsByCategory[key] = Number(skillsByCategory[key].toFixed(2));
  });

  // Breakdown by workout type
  const workoutsByType: Record<string, number> = {};
  workouts.forEach(w => {
    const type = w.workoutType || 'other';
    workoutsByType[type] = (workoutsByType[type] || 0) + (w.durationMin || 0) / 60;
  });
  Object.keys(workoutsByType).forEach(key => {
    workoutsByType[key] = Number(workoutsByType[key].toFixed(2));
  });

  // Breakdown by career activity type
  const careerByType: Record<string, number> = {};
  career.forEach(c => {
    const type = c.activityType || 'other';
    careerByType[type] = (careerByType[type] || 0) + (c.timeSpentMin || 0) / 60;
  });
  Object.keys(careerByType).forEach(key => {
    careerByType[key] = Number(careerByType[key].toFixed(2));
  });

  // Breakdown by masters prep category
  const mastersPrepByCategory: Record<string, number> = {};
  mastersPrep.forEach(m => {
    const category = m.category || 'other';
    mastersPrepByCategory[category] = (mastersPrepByCategory[category] || 0) + (m.timeSpentMin || 0) / 60;
  });
  Object.keys(mastersPrepByCategory).forEach(key => {
    mastersPrepByCategory[key] = Number(mastersPrepByCategory[key].toFixed(2));
  });

  return {
    total: Number(totalHours.toFixed(2)),
    learning: Number(learningHours.toFixed(2)),
    work: Number(workHours.toFixed(2)),
    fitness: Number(workoutsHours.toFixed(2)),
    career: Number(careerHours.toFixed(2)),
    mastersPrep: Number(mastersPrepHours.toFixed(2)),
    breakdown: {
      ielts: Number(ieltsHours.toFixed(2)),
      ieltsBySkill,
      journals: Number(journalsHours.toFixed(2)),
      books: Number(booksHours.toFixed(2)),
      skills: Number(skillsHours.toFixed(2)),
      skillsByCategory,
      workoutsByType,
      careerByType,
      mastersPrepByCategory,
    },
    dailyAverage: Number((totalHours / Math.max(dailyLogs.length, 1)).toFixed(2)),
  };
}

// Aggregate wellness data
function aggregateWellness(wellness: any[], dailyLogs: any[]) {
  if (wellness.length === 0) {
    return {
      totalEntries: 0,
      averages: {},
      trends: [],
    };
  }

  const averages = {
    sleepHours: wellness.reduce((sum, w) => sum + (w.sleepHours || 0), 0) / wellness.length,
    sleepQuality: wellness.reduce((sum, w) => sum + (w.sleepQuality || 0), 0) / wellness.length,
    energyLevel: wellness.reduce((sum, w) => sum + (w.energyLevel || 0), 0) / wellness.length,
    moodScore: wellness.reduce((sum, w) => sum + (w.moodScore || 0), 0) / wellness.length,
    stressLevel: wellness.reduce((sum, w) => sum + (w.stressLevel || 0), 0) / wellness.length,
    mentalClarity: wellness.reduce((sum, w) => sum + (w.mentalClarity || 0), 0) / wellness.length,
    anxietyLevel: wellness.reduce((sum, w) => sum + (w.anxietyLevel || 0), 0) / wellness.length,
    wellnessScore: wellness.reduce((sum, w) => sum + (w.wellnessScore || 0), 0) / wellness.length,
    hydrationLiters: wellness.reduce((sum, w) => sum + (w.hydrationLiters || 0), 0) / wellness.length,
    dietDiscipline: wellness.reduce((sum, w) => sum + (w.dietDiscipline || 0), 0) / wellness.length,
    screenTimeMin: wellness.reduce((sum, w) => sum + (w.screenTimeMin || 0), 0) / wellness.length,
    outdoorTimeMin: wellness.reduce((sum, w) => sum + (w.outdoorTimeMin || 0), 0) / wellness.length,
  };

  // Calculate compliance rates
  const morningRoutineCompliance = (wellness.filter(w => w.morningRoutine).length / wellness.length) * 100;
  const eveningRoutineCompliance = (wellness.filter(w => w.eveningRoutine).length / wellness.length) * 100;
  const noLateSnacksCompliance = (wellness.filter(w => w.noLateSnacks).length / wellness.length) * 100;

  return {
    totalEntries: wellness.length,
    averages: {
      sleepHours: Number(averages.sleepHours.toFixed(2)),
      sleepQuality: Number(averages.sleepQuality.toFixed(2)),
      energyLevel: Number(averages.energyLevel.toFixed(2)),
      moodScore: Number(averages.moodScore.toFixed(2)),
      stressLevel: Number(averages.stressLevel.toFixed(2)),
      mentalClarity: Number(averages.mentalClarity.toFixed(2)),
      anxietyLevel: Number(averages.anxietyLevel.toFixed(2)),
      wellnessScore: Number(averages.wellnessScore.toFixed(2)),
      hydrationLiters: Number(averages.hydrationLiters.toFixed(2)),
      dietDiscipline: Number(averages.dietDiscipline.toFixed(2)),
      screenTimeMin: Number(averages.screenTimeMin.toFixed(0)),
      outdoorTimeMin: Number(averages.outdoorTimeMin.toFixed(0)),
    },
    compliance: {
      morningRoutine: Number(morningRoutineCompliance.toFixed(1)),
      eveningRoutine: Number(eveningRoutineCompliance.toFixed(1)),
      noLateSnacks: Number(noLateSnacksCompliance.toFixed(1)),
    },
  };
}

// Aggregate financial data
function aggregateFinancial(transactions: any[]) {
  const income = transactions
    .filter(t => t.direction === 'income')
    .reduce((sum, t) => sum + t.amountIdr, 0);

  const spending = transactions
    .filter(t => t.direction === 'spend')
    .reduce((sum, t) => sum + t.amountIdr, 0);

  const investment = transactions
    .filter(t => t.direction === 'invest')
    .reduce((sum, t) => sum + t.amountIdr, 0);

  const necessarySpending = transactions
    .filter(t => t.direction === 'spend' && t.isNecessary)
    .reduce((sum, t) => sum + t.amountIdr, 0);

  const discretionarySpending = spending - necessarySpending;

  const netSavings = income - spending - investment;
  const savingsRate = income > 0 ? ((netSavings / income) * 100) : 0;

  // Spending by category
  const spendingByCategory: Record<string, number> = {};
  transactions
    .filter(t => t.direction === 'spend')
    .forEach(t => {
      const category = t.category || 'other';
      spendingByCategory[category] = (spendingByCategory[category] || 0) + t.amountIdr;
    });

  return {
    income,
    spending,
    investment,
    netSavings,
    savingsRate: Number(savingsRate.toFixed(2)),
    necessarySpending,
    discretionarySpending,
    spendingByCategory,
    transactionCount: transactions.length,
    dailyAverageSpending: Number((spending / 30).toFixed(0)), // Approximate
  };
}

// Aggregate learning data
function aggregateLearning(data: {
  ielts: any[];
  journals: any[];
  books: any[];
  bookReadingSessions: any[];
  skills: any[];
}) {
  const { ielts, journals, books, bookReadingSessions, skills } = data;

  // IELTS stats
  const ieltsStats = {
    sessionsCount: ielts.length,
    totalHours: Number((ielts.reduce((sum, s) => sum + (s.timeSpentMin || 0), 0) / 60).toFixed(2)),
    averageBand: ielts.filter(s => s.estimatedBand).length > 0
      ? Number((ielts.reduce((sum, s) => sum + (s.estimatedBand || 0), 0) / ielts.filter(s => s.estimatedBand).length).toFixed(2))
      : 0,
    bySkill: {} as Record<string, { count: number; hours: number; avgBand: number }>,
    newVocabCount: ielts.reduce((sum, s) => sum + (s.newVocabCount || 0), 0),
  };

  // Group IELTS by skill
  ielts.forEach(s => {
    const skill = s.skillType || 'other';
    if (!ieltsStats.bySkill[skill]) {
      ieltsStats.bySkill[skill] = { count: 0, hours: 0, avgBand: 0 };
    }
    ieltsStats.bySkill[skill].count++;
    ieltsStats.bySkill[skill].hours += (s.timeSpentMin || 0) / 60;
    if (s.estimatedBand) {
      ieltsStats.bySkill[skill].avgBand += s.estimatedBand;
    }
  });

  // Calculate average bands and format hours
  Object.keys(ieltsStats.bySkill).forEach(skill => {
    const data = ieltsStats.bySkill[skill];
    data.hours = Number(data.hours.toFixed(2));
    data.avgBand = Number((data.avgBand / data.count).toFixed(2));
  });

  // Books stats
  const booksCompleted = books.filter(b => b.status === 'completed').length;
  const totalPagesRead = bookReadingSessions.reduce((sum, s) => sum + (s.pagesRead || 0), 0);
  const totalReadingHours = Number((bookReadingSessions.reduce((sum, s) => sum + (s.timeSpentMin || 0), 0) / 60).toFixed(2));
  const avgReadingSpeed = totalReadingHours > 0 ? Number((totalPagesRead / totalReadingHours).toFixed(1)) : 0;

  // Skills stats
  const skillsByCategory: Record<string, { count: number; hours: number; avgMastery: number }> = {};
  skills.forEach(s => {
    const category = s.skillCategory || 'other';
    if (!skillsByCategory[category]) {
      skillsByCategory[category] = { count: 0, hours: 0, avgMastery: 0 };
    }
    skillsByCategory[category].count++;
    skillsByCategory[category].hours += (s.timeSpentMin || 0) / 60;
    skillsByCategory[category].avgMastery += (s.masteryLevel || 0);
  });

  Object.keys(skillsByCategory).forEach(category => {
    const data = skillsByCategory[category];
    data.hours = Number(data.hours.toFixed(2));
    data.avgMastery = Number((data.avgMastery / data.count).toFixed(2));
  });

  return {
    ielts: ieltsStats,
    journals: {
      count: journals.length,
      totalHours: Number((journals.reduce((sum, j) => sum + (j.timeSpentMin || 0), 0) / 60).toFixed(2)),
      avgUsefulness: journals.filter(j => j.ratingUsefulness).length > 0
        ? Number((journals.reduce((sum, j) => sum + (j.ratingUsefulness || 0), 0) / journals.filter(j => j.ratingUsefulness).length).toFixed(2))
        : 0,
    },
    books: {
      totalBooks: books.length,
      completed: booksCompleted,
      reading: books.filter(b => b.status === 'reading').length,
      totalPagesRead,
      totalHours: totalReadingHours,
      avgReadingSpeed,
    },
    skills: {
      totalSessions: skills.length,
      totalHours: Number((skills.reduce((sum, s) => sum + (s.timeSpentMin || 0), 0) / 60).toFixed(2)),
      byCategory: skillsByCategory,
    },
  };
}

// Get monthly report
export const getMonthlyReport = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Monthly report request started');
    const userId = req.user!.id;
    const { year, month } = req.query;
    console.log('User ID:', userId, 'Year:', year, 'Month:', month);

    if (!year || !month) {
      console.log('Missing year or month parameters');
      sendError(res, 'Year and month are required', 400);
      return;
    }

    const yearNum = parseInt(year as string, 10);
    const monthNum = parseInt(month as string, 10);

    if (monthNum < 1 || monthNum > 12) {
      console.log('Invalid month:', monthNum);
      sendError(res, 'Month must be between 1 and 12', 400);
      return;
    }

    const { startDate, endDate } = getMonthDateRange(yearNum, monthNum);
    console.log('Date range:', startDate, 'to', endDate);

    console.log('Starting parallel data fetch...');
    // Fetch all data in parallel
    const [
      dailyLogs,
      ielts,
      journals,
      books,
      bookReadingSessions,
      skills,
      workouts,
      wellness,
      financial,
      career,
      mastersPrep,
      goals,
    ] = await Promise.all([
      prisma.dailyLog.findMany({ where: { userId, date: { gte: startDate, lte: endDate } } }),
      prisma.ieltsSession.findMany({ where: { userId, date: { gte: startDate, lte: endDate } } }),
      prisma.journalEntry.findMany({ where: { userId, date: { gte: startDate, lte: endDate } } }),
      prisma.book.findMany({ where: { userId } }),
      prisma.bookReadingSession.findMany({
        where: {
          userId,
          date: { gte: startDate, lte: endDate },
        },
      }),
      prisma.skillSession.findMany({ where: { userId, date: { gte: startDate, lte: endDate } } }),
      prisma.workoutSession.findMany({ where: { userId, date: { gte: startDate, lte: endDate } } }),
      prisma.wellnessEntry.findMany({ where: { userId, date: { gte: startDate, lte: endDate } } }),
      prisma.financialTransaction.findMany({ where: { userId, date: { gte: startDate, lte: endDate } } }),
      prisma.careerActivity.findMany({ where: { userId, date: { gte: startDate, lte: endDate } } }),
      prisma.mastersPrepSession.findMany({ where: { userId, date: { gte: startDate, lte: endDate } } }),
      prisma.goal.findMany({ where: { userId } }),
    ]);
    console.log('Data fetched successfully, building report...');

    // Build report data
    const report = {
      period: {
        type: 'monthly',
        year: yearNum,
        month: monthNum,
        startDate,
        endDate,
      },
      timeInvestment: aggregateTimeInvestment({
        dailyLogs,
        ielts,
        journals,
        books: bookReadingSessions,
        skills,
        workouts,
        career,
        mastersPrep,
      }),
      wellness: aggregateWellness(wellness, dailyLogs),
      financial: aggregateFinancial(financial),
      learning: aggregateLearning({ ielts, journals, books, bookReadingSessions, skills }),
      summary: {
        daysLogged: dailyLogs.length,
        totalActivities: ielts.length + journals.length + bookReadingSessions.length + skills.length + workouts.length + career.length,
        activeGoals: goals.filter(g => g.status === 'in_progress').length,
        achievedGoals: goals.filter(g => g.status === 'achieved' && g.updatedAt >= startDate && g.updatedAt <= endDate).length,
      },
    };

    console.log('Report built successfully, sending response...');
    sendSuccess(res, report);
    console.log('Response sent');
  } catch (error) {
    console.error('Get monthly report error:', error);
    sendError(res, 'Failed to generate monthly report', 500);
  }
};

// Get quarterly report (placeholder for now)
export const getQuarterlyReport = async (req: Request, res: Response): Promise<void> => {
  try {
    sendSuccess(res, { message: 'Quarterly report endpoint (coming soon)' });
  } catch (error) {
    console.error('Get quarterly report error:', error);
    sendError(res, 'Failed to generate quarterly report', 500);
  }
};

// Get yearly report (placeholder for now)
export const getYearlyReport = async (req: Request, res: Response): Promise<void> => {
  try {
    sendSuccess(res, { message: 'Yearly report endpoint (coming soon)' });
  } catch (error) {
    console.error('Get yearly report error:', error);
    sendError(res, 'Failed to generate yearly report', 500);
  }
};
