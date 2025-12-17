import { Request, Response } from 'express';
import prisma from '../utils/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';

// Table configurations for export
const EXPORT_TABLES = {
  dailyLogs: { model: 'dailyLog', name: 'daily_logs' },
  ieltsSessions: { model: 'ieltsSession', name: 'ielts_sessions' },
  ieltsMistakes: { model: 'ieltsMistake', name: 'ielts_mistakes' },
  ieltsVocab: { model: 'ieltsVocab', name: 'ielts_vocab' },
  journalEntries: { model: 'journalEntry', name: 'journal_entries' },
  books: { model: 'book', name: 'books' },
  bookReadingSessions: { model: 'bookReadingSession', name: 'book_reading_sessions' },
  skillSessions: { model: 'skillSession', name: 'skill_sessions' },
  workoutSessions: { model: 'workoutSession', name: 'workout_sessions' },
  workoutSets: { model: 'workoutSet', name: 'workout_sets' },
  wellnessEntries: { model: 'wellnessEntry', name: 'wellness_entries' },
  financialTransactions: { model: 'financialTransaction', name: 'financial_transactions' },
  reflectionEntries: { model: 'reflectionEntry', name: 'reflection_entries' },
  careerActivities: { model: 'careerActivity', name: 'career_activities' },
  careerActivityLogs: { model: 'careerActivityLog', name: 'career_activity_logs' },
  jobApplications: { model: 'jobApplication', name: 'job_applications' },
  mastersPrepItems: { model: 'mastersPrepItem', name: 'masters_prep_items' },
  mastersPrepSessions: { model: 'mastersPrepSession', name: 'masters_prep_sessions' },
  mastersPrepNotes: { model: 'mastersPrepNote', name: 'masters_prep_notes' },
  universities: { model: 'university', name: 'universities' },
  scholarships: { model: 'scholarship', name: 'scholarships' },
  projects: { model: 'project', name: 'projects' },
  goals: { model: 'goal', name: 'goals' },
  goalProgress: { model: 'goalProgress', name: 'goal_progress' },
  tags: { model: 'tag', name: 'tags' },
  tagLinks: { model: 'tagLink', name: 'tag_links' },
  quizzes: { model: 'quiz', name: 'quizzes' },
  quizAttempts: { model: 'quizAttempt', name: 'quiz_attempts' },
} as const;

// Helper to escape CSV values
function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Helper to convert data to CSV
function toCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const headerRow = headers.map(escapeCSV).join(',');
  const dataRows = data.map(row =>
    headers.map(header => escapeCSV(row[header])).join(',')
  );

  return [headerRow, ...dataRows].join('\n');
}

// Helper to escape SQL string values
function escapeSQLValue(value: unknown): string {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (value instanceof Date) return `'${value.toISOString()}'`;
  const str = String(value);
  return `'${str.replace(/'/g, "''")}'`;
}

// Helper to convert data to SQL INSERT statements
function toSQL(tableName: string, data: Record<string, unknown>[]): string {
  if (data.length === 0) return `-- No data in ${tableName}\n`;

  const columns = Object.keys(data[0]);
  const columnList = columns.map(c => `"${c}"`).join(', ');

  const insertStatements = data.map(row => {
    const values = columns.map(col => escapeSQLValue(row[col])).join(', ');
    return `INSERT INTO "${tableName}" (${columnList}) VALUES (${values});`;
  });

  return `-- ${tableName} (${data.length} rows)\n${insertStatements.join('\n')}\n`;
}

// Fetch all data for a user from all tables
async function fetchUserData(userId: string) {
  const data: Record<string, unknown[]> = {};

  // Fetch all user-related data
  data.dailyLogs = await prisma.dailyLog.findMany({ where: { userId }, orderBy: { date: 'desc' } });
  data.ieltsSessions = await prisma.ieltsSession.findMany({ where: { userId }, orderBy: { date: 'desc' } });
  data.ieltsVocab = await prisma.ieltsVocab.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  data.journalEntries = await prisma.journalEntry.findMany({ where: { userId }, orderBy: { date: 'desc' } });
  data.books = await prisma.book.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  data.bookReadingSessions = await prisma.bookReadingSession.findMany({ where: { userId }, orderBy: { date: 'desc' } });
  data.skillSessions = await prisma.skillSession.findMany({ where: { userId }, orderBy: { date: 'desc' } });
  data.workoutSessions = await prisma.workoutSession.findMany({ where: { userId }, orderBy: { date: 'desc' } });
  data.wellnessEntries = await prisma.wellnessEntry.findMany({ where: { userId }, orderBy: { date: 'desc' } });
  data.financialTransactions = await prisma.financialTransaction.findMany({ where: { userId }, orderBy: { date: 'desc' } });
  data.reflectionEntries = await prisma.reflectionEntry.findMany({ where: { userId }, orderBy: { date: 'desc' } });
  data.careerActivities = await prisma.careerActivity.findMany({ where: { userId }, orderBy: { date: 'desc' } });
  data.jobApplications = await prisma.jobApplication.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  data.mastersPrepItems = await prisma.mastersPrepItem.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  data.mastersPrepSessions = await prisma.mastersPrepSession.findMany({ where: { userId }, orderBy: { date: 'desc' } });
  data.mastersPrepNotes = await prisma.mastersPrepNote.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  data.projects = await prisma.project.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  data.goals = await prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  data.goalProgress = await prisma.goalProgress.findMany({ where: { userId }, orderBy: { date: 'desc' } });
  data.tags = await prisma.tag.findMany({ where: { userId } });

  // Fetch IELTS mistakes through sessions
  const sessionIds = data.ieltsSessions.map((s: any) => s.id);
  if (sessionIds.length > 0) {
    data.ieltsMistakes = await prisma.ieltsMistake.findMany({ where: { ieltsSessionId: { in: sessionIds } } });
  } else {
    data.ieltsMistakes = [];
  }

  // Fetch workout sets through sessions
  const workoutIds = data.workoutSessions.map((s: any) => s.id);
  if (workoutIds.length > 0) {
    data.workoutSets = await prisma.workoutSet.findMany({ where: { workoutSessionId: { in: workoutIds } } });
  } else {
    data.workoutSets = [];
  }

  // Fetch tag links through tags
  const tagIds = data.tags.map((t: any) => t.id);
  if (tagIds.length > 0) {
    data.tagLinks = await prisma.tagLink.findMany({ where: { tagId: { in: tagIds } } });
  } else {
    data.tagLinks = [];
  }

  // Fetch career activity logs through career activities
  const careerActivityIds = data.careerActivities.map((a: any) => a.id);
  if (careerActivityIds.length > 0) {
    data.careerActivityLogs = await prisma.careerActivityLog.findMany({
      where: { activityId: { in: careerActivityIds } },
      orderBy: { date: 'desc' }
    });
  } else {
    data.careerActivityLogs = [];
  }

  // Fetch universities and scholarships
  data.universities = await prisma.university.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  data.scholarships = await prisma.scholarship.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });

  // Fetch quizzes
  data.quizzes = await prisma.quiz.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });

  // Fetch quiz attempts through quizzes
  const quizIds = data.quizzes.map((q: any) => q.id);
  if (quizIds.length > 0) {
    data.quizAttempts = await prisma.quizAttempt.findMany({
      where: { quizId: { in: quizIds } },
      orderBy: { startedAt: 'desc' }
    });
  } else {
    data.quizAttempts = [];
  }

  return data;
}

// Export data summary (count of records per table)
export const getExportSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const counts: Record<string, number> = {};

    counts.dailyLogs = await prisma.dailyLog.count({ where: { userId } });
    counts.ieltsSessions = await prisma.ieltsSession.count({ where: { userId } });
    counts.ieltsVocab = await prisma.ieltsVocab.count({ where: { userId } });
    counts.journalEntries = await prisma.journalEntry.count({ where: { userId } });
    counts.books = await prisma.book.count({ where: { userId } });
    counts.bookReadingSessions = await prisma.bookReadingSession.count({ where: { userId } });
    counts.skillSessions = await prisma.skillSession.count({ where: { userId } });
    counts.workoutSessions = await prisma.workoutSession.count({ where: { userId } });
    counts.wellnessEntries = await prisma.wellnessEntry.count({ where: { userId } });
    counts.financialTransactions = await prisma.financialTransaction.count({ where: { userId } });
    counts.reflectionEntries = await prisma.reflectionEntry.count({ where: { userId } });
    counts.careerActivities = await prisma.careerActivity.count({ where: { userId } });
    counts.careerActivityLogs = await prisma.careerActivityLog.count({ where: { userId } });
    counts.jobApplications = await prisma.jobApplication.count({ where: { userId } });
    counts.mastersPrepItems = await prisma.mastersPrepItem.count({ where: { userId } });
    counts.mastersPrepSessions = await prisma.mastersPrepSession.count({ where: { userId } });
    counts.mastersPrepNotes = await prisma.mastersPrepNote.count({ where: { userId } });
    counts.universities = await prisma.university.count({ where: { userId } });
    counts.scholarships = await prisma.scholarship.count({ where: { userId } });
    counts.projects = await prisma.project.count({ where: { userId } });
    counts.goals = await prisma.goal.count({ where: { userId } });
    counts.goalProgress = await prisma.goalProgress.count({ where: { userId } });
    counts.tags = await prisma.tag.count({ where: { userId } });

    const totalRecords = Object.values(counts).reduce((sum, count) => sum + count, 0);

    sendSuccess(res, { counts, totalRecords });
  } catch (error) {
    console.error('Get export summary error:', error);
    sendError(res, 'Failed to get export summary', 500);
  }
};

// Export all data as CSV (zip file with multiple CSVs)
export const exportCSV = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { table } = req.query;

    const data = await fetchUserData(userId);

    // If specific table requested
    if (table && typeof table === 'string' && table in EXPORT_TABLES) {
      const tableData = data[table] as Record<string, unknown>[];
      const tableName = EXPORT_TABLES[table as keyof typeof EXPORT_TABLES].name;
      const csv = toCSV(tableData);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${tableName}_export.csv"`);
      res.send(csv);
      return;
    }

    // Export all tables as JSON with CSV data
    const csvData: Record<string, string> = {};
    for (const [key, tableData] of Object.entries(data)) {
      if (key in EXPORT_TABLES) {
        csvData[EXPORT_TABLES[key as keyof typeof EXPORT_TABLES].name] = toCSV(tableData as Record<string, unknown>[]);
      }
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="pd_os_export_csv.json"');
    res.json({ format: 'csv', exportedAt: new Date().toISOString(), tables: csvData });
  } catch (error) {
    console.error('Export CSV error:', error);
    sendError(res, 'Failed to export data as CSV', 500);
  }
};

// Export all data as SQL
export const exportSQL = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { table } = req.query;

    const data = await fetchUserData(userId);

    // Header with metadata
    let sql = `-- PD-OS Data Export\n`;
    sql += `-- Exported at: ${new Date().toISOString()}\n`;
    sql += `-- User ID: ${userId}\n\n`;

    // If specific table requested
    if (table && typeof table === 'string' && table in EXPORT_TABLES) {
      const tableData = data[table] as Record<string, unknown>[];
      const tableName = EXPORT_TABLES[table as keyof typeof EXPORT_TABLES].name;
      sql += toSQL(tableName, tableData);

      res.setHeader('Content-Type', 'application/sql');
      res.setHeader('Content-Disposition', `attachment; filename="${tableName}_export.sql"`);
      res.send(sql);
      return;
    }

    // Export all tables
    for (const [key, tableData] of Object.entries(data)) {
      if (key in EXPORT_TABLES) {
        const tableName = EXPORT_TABLES[key as keyof typeof EXPORT_TABLES].name;
        sql += toSQL(tableName, tableData as Record<string, unknown>[]);
        sql += '\n';
      }
    }

    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', 'attachment; filename="pd_os_export.sql"');
    res.send(sql);
  } catch (error) {
    console.error('Export SQL error:', error);
    sendError(res, 'Failed to export data as SQL', 500);
  }
};

// Export all data as JSON
export const exportJSON = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { table } = req.query;

    const data = await fetchUserData(userId);

    // If specific table requested
    if (table && typeof table === 'string' && table in data) {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${table}_export.json"`);
      res.json({
        format: 'json',
        table,
        exportedAt: new Date().toISOString(),
        data: data[table],
      });
      return;
    }

    // Export all tables
    const exportData = {
      format: 'json',
      exportedAt: new Date().toISOString(),
      userId,
      tables: data,
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="pd_os_export.json"');
    res.json(exportData);
  } catch (error) {
    console.error('Export JSON error:', error);
    sendError(res, 'Failed to export data as JSON', 500);
  }
};
