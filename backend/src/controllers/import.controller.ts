import { Request, Response } from 'express';
import prisma from '../utils/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';

// Table configurations for import (order matters for foreign key relationships)
const IMPORT_ORDER = [
  'projects',
  'goals',
  'tags',
  'dailyLogs',
  'books',
  'ieltsSessions',
  'ieltsVocab',
  'ieltsMistakes',
  'journalEntries',
  'bookReadingSessions',
  'skillSessions',
  'workoutSessions',
  'workoutSets',
  'wellnessEntries',
  'financialTransactions',
  'reflectionEntries',
  'careerActivities',
  'jobApplications',
  'mastersPrepItems',
  'mastersPrepSessions',
  'mastersPrepNotes',
  'goalProgress',
  'tagLinks',
] as const;

// Helper to strip date timezone and convert to Date object
function parseDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }
  return null;
}

// Helper to prepare data for insertion (strip id, convert dates, set userId)
function prepareRecord(record: Record<string, unknown>, userId: string, idMapping: Map<string, string>): Record<string, unknown> {
  const prepared: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(record)) {
    // Skip the original id - we'll generate new ones
    if (key === 'id') continue;

    // Replace userId with current user
    if (key === 'userId') {
      prepared[key] = userId;
      continue;
    }

    // Handle foreign key references that need remapping
    if (key === 'projectId' || key === 'goalId' || key === 'bookId' ||
        key === 'ieltsSessionId' || key === 'workoutSessionId' ||
        key === 'prepItemId' || key === 'tagId' || key === 'relatedGoalId') {
      if (value && typeof value === 'string') {
        const newId = idMapping.get(value);
        prepared[key] = newId || null;
      } else {
        prepared[key] = null;
      }
      continue;
    }

    // Handle dates
    if (key === 'date' || key === 'createdAt' || key === 'updatedAt' ||
        key === 'dueDate' || key === 'appliedDate' || key === 'expectedResponse') {
      prepared[key] = parseDate(value);
      continue;
    }

    // Keep other values as-is
    prepared[key] = value;
  }

  return prepared;
}

// Validate import data structure
export const validateImport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data } = req.body;

    if (!data || typeof data !== 'object') {
      sendError(res, 'Invalid import data structure', 400);
      return;
    }

    // Check if it's a valid export format
    if (!data.tables && !data.format) {
      sendError(res, 'Invalid export file format. Please use a JSON file exported from this application.', 400);
      return;
    }

    const tables = data.tables || data;
    const summary: Record<string, number> = {};
    let totalRecords = 0;

    for (const key of IMPORT_ORDER) {
      if (tables[key] && Array.isArray(tables[key])) {
        summary[key] = tables[key].length;
        totalRecords += tables[key].length;
      }
    }

    sendSuccess(res, {
      valid: true,
      summary,
      totalRecords,
      exportedAt: data.exportedAt || 'Unknown',
    });
  } catch (error) {
    console.error('Validate import error:', error);
    sendError(res, 'Failed to validate import data', 500);
  }
};

// Import data from JSON export
export const importJSON = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { data, mode = 'merge' } = req.body;

    if (!data || typeof data !== 'object') {
      sendError(res, 'Invalid import data', 400);
      return;
    }

    const tables = data.tables || data;
    const idMapping = new Map<string, string>();
    const results: Record<string, { imported: number; skipped: number; errors: number }> = {};

    // If mode is 'replace', delete existing data first
    if (mode === 'replace') {
      // Delete in reverse order to respect foreign keys
      await prisma.tagLink.deleteMany({ where: { tag: { userId } } });
      await prisma.goalProgress.deleteMany({ where: { userId } });
      await prisma.mastersPrepNote.deleteMany({ where: { userId } });
      await prisma.mastersPrepSession.deleteMany({ where: { userId } });
      await prisma.mastersPrepItem.deleteMany({ where: { userId } });
      await prisma.jobApplication.deleteMany({ where: { userId } });
      await prisma.careerActivity.deleteMany({ where: { userId } });
      await prisma.reflectionEntry.deleteMany({ where: { userId } });
      await prisma.financialTransaction.deleteMany({ where: { userId } });
      await prisma.wellnessEntry.deleteMany({ where: { userId } });
      await prisma.workoutSet.deleteMany({ where: { workoutSession: { userId } } });
      await prisma.workoutSession.deleteMany({ where: { userId } });
      await prisma.skillSession.deleteMany({ where: { userId } });
      await prisma.bookReadingSession.deleteMany({ where: { userId } });
      await prisma.journalEntry.deleteMany({ where: { userId } });
      await prisma.ieltsMistake.deleteMany({ where: { ieltsSession: { userId } } });
      await prisma.ieltsVocab.deleteMany({ where: { userId } });
      await prisma.ieltsSession.deleteMany({ where: { userId } });
      await prisma.book.deleteMany({ where: { userId } });
      await prisma.dailyLog.deleteMany({ where: { userId } });
      await prisma.tag.deleteMany({ where: { userId } });
      await prisma.goal.deleteMany({ where: { userId } });
      await prisma.project.deleteMany({ where: { userId } });
    }

    // Import each table in order
    for (const tableKey of IMPORT_ORDER) {
      const tableData = tables[tableKey];
      if (!tableData || !Array.isArray(tableData) || tableData.length === 0) {
        continue;
      }

      results[tableKey] = { imported: 0, skipped: 0, errors: 0 };

      for (const record of tableData) {
        try {
          const originalId = record.id;
          const preparedData = prepareRecord(record, userId, idMapping);

          let created: { id: string } | null = null;

          switch (tableKey) {
            case 'projects':
              created = await prisma.project.create({ data: preparedData as any });
              break;
            case 'goals':
              created = await prisma.goal.create({ data: preparedData as any });
              break;
            case 'tags':
              // Check for duplicate tags
              const existingTag = await prisma.tag.findFirst({
                where: { userId, label: preparedData.label as string }
              });
              if (existingTag) {
                idMapping.set(originalId, existingTag.id);
                results[tableKey].skipped++;
                continue;
              }
              created = await prisma.tag.create({ data: preparedData as any });
              break;
            case 'dailyLogs':
              // Check for duplicate date
              const existingLog = await prisma.dailyLog.findFirst({
                where: { userId, date: preparedData.date as Date }
              });
              if (existingLog && mode === 'merge') {
                idMapping.set(originalId, existingLog.id);
                results[tableKey].skipped++;
                continue;
              }
              created = await prisma.dailyLog.create({ data: preparedData as any });
              break;
            case 'books':
              created = await prisma.book.create({ data: preparedData as any });
              break;
            case 'ieltsSessions':
              created = await prisma.ieltsSession.create({ data: preparedData as any });
              break;
            case 'ieltsVocab':
              created = await prisma.ieltsVocab.create({ data: preparedData as any });
              break;
            case 'ieltsMistakes':
              if (!preparedData.ieltsSessionId) {
                results[tableKey].skipped++;
                continue;
              }
              created = await prisma.ieltsMistake.create({ data: preparedData as any });
              break;
            case 'journalEntries':
              created = await prisma.journalEntry.create({ data: preparedData as any });
              break;
            case 'bookReadingSessions':
              if (!preparedData.bookId) {
                results[tableKey].skipped++;
                continue;
              }
              created = await prisma.bookReadingSession.create({ data: preparedData as any });
              break;
            case 'skillSessions':
              created = await prisma.skillSession.create({ data: preparedData as any });
              break;
            case 'workoutSessions':
              created = await prisma.workoutSession.create({ data: preparedData as any });
              break;
            case 'workoutSets':
              if (!preparedData.workoutSessionId) {
                results[tableKey].skipped++;
                continue;
              }
              created = await prisma.workoutSet.create({ data: preparedData as any });
              break;
            case 'wellnessEntries':
              // Check for duplicate date
              const existingWellness = await prisma.wellnessEntry.findFirst({
                where: { userId, date: preparedData.date as Date }
              });
              if (existingWellness && mode === 'merge') {
                idMapping.set(originalId, existingWellness.id);
                results[tableKey].skipped++;
                continue;
              }
              created = await prisma.wellnessEntry.create({ data: preparedData as any });
              break;
            case 'financialTransactions':
              created = await prisma.financialTransaction.create({ data: preparedData as any });
              break;
            case 'reflectionEntries':
              // Check for duplicate date
              const existingReflection = await prisma.reflectionEntry.findFirst({
                where: { userId, date: preparedData.date as Date }
              });
              if (existingReflection && mode === 'merge') {
                idMapping.set(originalId, existingReflection.id);
                results[tableKey].skipped++;
                continue;
              }
              created = await prisma.reflectionEntry.create({ data: preparedData as any });
              break;
            case 'careerActivities':
              created = await prisma.careerActivity.create({ data: preparedData as any });
              break;
            case 'jobApplications':
              created = await prisma.jobApplication.create({ data: preparedData as any });
              break;
            case 'mastersPrepItems':
              created = await prisma.mastersPrepItem.create({ data: preparedData as any });
              break;
            case 'mastersPrepSessions':
              if (!preparedData.prepItemId) {
                results[tableKey].skipped++;
                continue;
              }
              created = await prisma.mastersPrepSession.create({ data: preparedData as any });
              break;
            case 'mastersPrepNotes':
              created = await prisma.mastersPrepNote.create({ data: preparedData as any });
              break;
            case 'goalProgress':
              if (!preparedData.goalId) {
                results[tableKey].skipped++;
                continue;
              }
              created = await prisma.goalProgress.create({ data: preparedData as any });
              break;
            case 'tagLinks':
              if (!preparedData.tagId) {
                results[tableKey].skipped++;
                continue;
              }
              created = await prisma.tagLink.create({ data: preparedData as any });
              break;
          }

          if (created) {
            idMapping.set(originalId, created.id);
            results[tableKey].imported++;
          }
        } catch (error) {
          console.error(`Error importing ${tableKey} record:`, error);
          results[tableKey].errors++;
        }
      }
    }

    // Calculate totals
    let totalImported = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (const result of Object.values(results)) {
      totalImported += result.imported;
      totalSkipped += result.skipped;
      totalErrors += result.errors;
    }

    sendSuccess(res, {
      message: 'Import completed',
      mode,
      results,
      totals: {
        imported: totalImported,
        skipped: totalSkipped,
        errors: totalErrors,
      },
    });
  } catch (error) {
    console.error('Import JSON error:', error);
    sendError(res, 'Failed to import data', 500);
  }
};
