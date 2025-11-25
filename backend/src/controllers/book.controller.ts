import { Request, Response } from 'express';
import prisma from '../utils/prisma.js';
import { sendSuccess, sendError, sendNotFound } from '../utils/response.js';
import { createCrudController } from '../services/crud.service.js';

// Books
const bookCrud = createCrudController({
  model: 'book',
  include: {
    readingSessions: {
      orderBy: { date: 'desc' },
      take: 5,
    },
  },
  orderBy: { createdAt: 'desc' },
  searchFields: ['title', 'author'],
  dateField: 'createdAt',
});

export const createBook = bookCrud.create;
export const getAllBooks = bookCrud.getAll;
export const getBookById = bookCrud.getOne;
export const updateBook = bookCrud.update;
export const deleteBook = bookCrud.delete;

// Get book with full reading history
export const getBookWithSessions = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const book = await prisma.book.findFirst({
      where: { id, userId },
      include: {
        readingSessions: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!book) {
      sendNotFound(res, 'Book not found');
      return;
    }

    // Calculate progress
    const totalPagesRead = book.readingSessions.reduce(
      (sum, s) => sum + (s.pagesRead || 0),
      0
    );
    const totalReadingMinutes = book.readingSessions.reduce(
      (sum, s) => sum + (s.timeSpentMin || 0),
      0
    );
    const progress = book.totalPages ? (totalPagesRead / book.totalPages) * 100 : null;

    sendSuccess(res, {
      ...book,
      stats: {
        totalPagesRead,
        totalReadingMinutes,
        progress,
        sessionsCount: book.readingSessions.length,
      },
    });
  } catch (error) {
    console.error('Get book with sessions error:', error);
    sendError(res, 'Failed to fetch book', 500);
  }
};

// Book Reading Sessions
const sessionCrud = createCrudController({
  model: 'bookReadingSession',
  include: { book: true },
  orderBy: { date: 'desc' },
  searchFields: ['summary', 'keyIdeas', 'chapterLabel'],
});

export const createReadingSession = sessionCrud.create;
export const getAllReadingSessions = sessionCrud.getAll;
export const getReadingSessionById = sessionCrud.getOne;
export const updateReadingSession = sessionCrud.update;
export const deleteReadingSession = sessionCrud.delete;

// Get reading statistics
export const getReadingStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { startDate, endDate } = req.query;

    const where: any = { userId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const [sessions, books] = await Promise.all([
      prisma.bookReadingSession.findMany({ where }),
      prisma.book.findMany({ where: { userId } }),
    ]);

    const stats = {
      totalBooks: books.length,
      booksCompleted: books.filter((b) => b.status === 'completed').length,
      booksReading: books.filter((b) => b.status === 'reading').length,
      totalSessions: sessions.length,
      totalPagesRead: sessions.reduce((sum, s) => sum + (s.pagesRead || 0), 0),
      totalReadingMinutes: sessions.reduce((sum, s) => sum + (s.timeSpentMin || 0), 0),
      averageFocusScore: sessions.filter((s) => s.focusScore).length
        ? sessions.reduce((sum, s) => sum + (s.focusScore || 0), 0) /
          sessions.filter((s) => s.focusScore).length
        : null,
      byPurpose: sessions.reduce((acc, s) => {
        acc[s.purpose] = (acc[s.purpose] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    sendSuccess(res, stats);
  } catch (error) {
    console.error('Get reading stats error:', error);
    sendError(res, 'Failed to fetch reading statistics', 500);
  }
};
