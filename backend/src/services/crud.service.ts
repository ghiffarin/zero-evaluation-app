import { Request, Response } from 'express';
import prisma from '../utils/prisma.js';
import {
  sendSuccess,
  sendCreated,
  sendError,
  sendNotFound,
} from '../utils/response.js';

type PrismaModelName =
  | 'dailyLog'
  | 'ieltsSession'
  | 'ieltsMistake'
  | 'ieltsVocab'
  | 'journalEntry'
  | 'book'
  | 'bookReadingSession'
  | 'skillSession'
  | 'workoutSession'
  | 'workoutSet'
  | 'wellnessEntry'
  | 'financialTransaction'
  | 'reflectionEntry'
  | 'careerActivity'
  | 'jobApplication'
  | 'mastersPrepItem'
  | 'mastersPrepSession'
  | 'project'
  | 'goal'
  | 'tag';

interface CrudOptions {
  model: PrismaModelName;
  include?: Record<string, boolean | object>;
  orderBy?: Record<string, 'asc' | 'desc'>;
  searchFields?: string[];
  dateField?: string;
}

export const createCrudController = (options: CrudOptions) => {
  const { model, include, orderBy = { createdAt: 'desc' }, searchFields = [], dateField = 'date' } = options;

  // Get the Prisma model dynamically
  const getModel = () => (prisma as any)[model];

  return {
    // Create
    create: async (req: Request, res: Response): Promise<void> => {
      try {
        const userId = req.user!.id;
        const data = { ...req.body, userId };

        const record = await getModel().create({
          data,
          include,
        });

        sendCreated(res, record, `${model} created successfully`);
      } catch (error) {
        console.error(`Create ${model} error:`, error);
        sendError(res, `Failed to create ${model}`, 500);
      }
    },

    // Get all with pagination and filters
    getAll: async (req: Request, res: Response): Promise<void> => {
      try {
        const userId = req.user!.id;
        const {
          page = '1',
          limit = '20',
          search,
          startDate,
          endDate,
          ...filters
        } = req.query;

        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);
        const skip = (pageNum - 1) * limitNum;

        // Build where clause
        const where: Record<string, any> = { userId };

        // Date range filter
        if (startDate || endDate) {
          where[dateField] = {};
          if (startDate) where[dateField].gte = new Date(startDate as string);
          if (endDate) where[dateField].lte = new Date(endDate as string);
        }

        // Search filter
        if (search && searchFields.length > 0) {
          where.OR = searchFields.map((field) => ({
            [field]: { contains: search as string, mode: 'insensitive' },
          }));
        }

        // Additional filters
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== '') {
            where[key] = value;
          }
        });

        const [records, total] = await Promise.all([
          getModel().findMany({
            where,
            include,
            orderBy,
            skip,
            take: limitNum,
          }),
          getModel().count({ where }),
        ]);

        sendSuccess(res, records, undefined, 200, {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        });
      } catch (error) {
        console.error(`GetAll ${model} error:`, error);
        sendError(res, `Failed to fetch ${model}s`, 500);
      }
    },

    // Get one by ID
    getOne: async (req: Request, res: Response): Promise<void> => {
      try {
        const userId = req.user!.id;
        const { id } = req.params;

        const record = await getModel().findFirst({
          where: { id, userId },
          include,
        });

        if (!record) {
          sendNotFound(res, `${model} not found`);
          return;
        }

        sendSuccess(res, record);
      } catch (error) {
        console.error(`GetOne ${model} error:`, error);
        sendError(res, `Failed to fetch ${model}`, 500);
      }
    },

    // Get by date (for daily entries)
    getByDate: async (req: Request, res: Response): Promise<void> => {
      try {
        const userId = req.user!.id;
        const { date } = req.params;

        const record = await getModel().findFirst({
          where: {
            userId,
            [dateField]: new Date(date),
          },
          include,
        });

        if (!record) {
          sendNotFound(res, `${model} not found for this date`);
          return;
        }

        sendSuccess(res, record);
      } catch (error) {
        console.error(`GetByDate ${model} error:`, error);
        sendError(res, `Failed to fetch ${model}`, 500);
      }
    },

    // Update
    update: async (req: Request, res: Response): Promise<void> => {
      try {
        const userId = req.user!.id;
        const { id } = req.params;

        // Check ownership
        const existing = await getModel().findFirst({
          where: { id, userId },
        });

        if (!existing) {
          sendNotFound(res, `${model} not found`);
          return;
        }

        const record = await getModel().update({
          where: { id },
          data: req.body,
          include,
        });

        sendSuccess(res, record, `${model} updated successfully`);
      } catch (error) {
        console.error(`Update ${model} error:`, error);
        sendError(res, `Failed to update ${model}`, 500);
      }
    },

    // Upsert by date (for daily entries)
    upsertByDate: async (req: Request, res: Response): Promise<void> => {
      try {
        const userId = req.user!.id;
        const { date } = req.params;
        const dateObj = new Date(date);

        const record = await getModel().upsert({
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
            [dateField]: dateObj,
          },
          include,
        });

        sendSuccess(res, record, `${model} saved successfully`);
      } catch (error) {
        console.error(`Upsert ${model} error:`, error);
        sendError(res, `Failed to save ${model}`, 500);
      }
    },

    // Delete
    delete: async (req: Request, res: Response): Promise<void> => {
      try {
        const userId = req.user!.id;
        const { id } = req.params;

        // Check ownership
        const existing = await getModel().findFirst({
          where: { id, userId },
        });

        if (!existing) {
          sendNotFound(res, `${model} not found`);
          return;
        }

        await getModel().delete({
          where: { id },
        });

        sendSuccess(res, null, `${model} deleted successfully`);
      } catch (error) {
        console.error(`Delete ${model} error:`, error);
        sendError(res, `Failed to delete ${model}`, 500);
      }
    },
  };
};
