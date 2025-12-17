import { Request, Response } from 'express';
import prisma from '../utils/prisma.js';
import { sendSuccess, sendCreated, sendError, sendNotFound } from '../utils/response.js';

// Validate quiz JSON structure
const validateQuizJSON = (data: any): { valid: boolean; error?: string } => {
  if (!data.meta || !data.sections || !data.questions) {
    return { valid: false, error: 'Missing required fields: meta, sections, or questions' };
  }

  const { meta } = data;
  if (!meta.title || !meta.total_questions || !meta.recommended_time_minutes || !meta.scoring) {
    return { valid: false, error: 'Invalid meta structure' };
  }

  if (!meta.scoring.correct_points || meta.scoring.wrong_points === undefined || !meta.scoring.max_score) {
    return { valid: false, error: 'Invalid scoring configuration' };
  }

  if (!Array.isArray(data.sections) || !Array.isArray(data.questions)) {
    return { valid: false, error: 'Sections and questions must be arrays' };
  }

  if (data.questions.length !== meta.total_questions) {
    return { valid: false, error: 'Question count mismatch' };
  }

  // Validate each question has required fields
  for (const q of data.questions) {
    if (!q.id || !q.type || !q.prompt || !q.choices || !q.answer) {
      return { valid: false, error: `Invalid question structure: ${q.id || 'unknown'}` };
    }
  }

  return { valid: true };
};

// Create quiz from JSON
export const createQuiz = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const quizData = req.body;

    // Validate JSON structure
    const validation = validateQuizJSON(quizData);
    if (!validation.valid) {
      sendError(res, validation.error || 'Invalid quiz data', 400);
      return;
    }

    const { meta, sections, questions } = quizData;

    // Create quiz
    const quiz = await prisma.quiz.create({
      data: {
        userId,
        title: meta.title,
        language: meta.language || 'id',
        difficulty: meta.difficulty || 'medium',
        version: meta.version || '1.0.0',
        totalQuestions: meta.total_questions,
        recommendedTimeMin: meta.recommended_time_minutes,
        correctPoints: meta.scoring.correct_points,
        wrongPoints: meta.scoring.wrong_points,
        maxScore: meta.scoring.max_score,
        sectionsJson: sections,
        questionsJson: questions,
      },
    });

    sendCreated(res, quiz, 'Quiz created successfully');
  } catch (error) {
    console.error('Create quiz error:', error);
    sendError(res, 'Failed to create quiz', 500);
  }
};

// Get all quizzes for user
export const getAllQuizzes = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { page = '1', limit = '20', search, difficulty } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = { userId };

    if (search) {
      where.title = { contains: search as string, mode: 'insensitive' };
    }

    if (difficulty) {
      where.difficulty = difficulty;
    }

    // Get quizzes and total count in parallel
    const [quizzes, total] = await Promise.all([
      prisma.quiz.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          difficulty: true,
          totalQuestions: true,
          recommendedTimeMin: true,
          maxScore: true,
          createdAt: true,
        },
      }),
      prisma.quiz.count({ where }),
    ]);

    // Get all attempt statistics in a single query using groupBy
    const quizIds = quizzes.map(q => q.id);
    const allAttempts = quizIds.length > 0
      ? await prisma.quizAttempt.findMany({
          where: {
            quizId: { in: quizIds },
            status: 'completed',
          },
          select: {
            quizId: true,
            score: true,
            percentage: true,
            timeSpentSeconds: true,
          },
        })
      : [];

    // Get total attempt counts (including in-progress)
    const totalAttemptCounts = quizIds.length > 0
      ? await prisma.quizAttempt.groupBy({
          by: ['quizId'],
          where: { quizId: { in: quizIds } },
          _count: { id: true },
        })
      : [];

    // Create a map of quiz statistics
    const statsMap = new Map();
    quizzes.forEach(quiz => {
      const quizAttempts = allAttempts.filter(a => a.quizId === quiz.id);
      const totalCount = totalAttemptCounts.find(t => t.quizId === quiz.id)?._count.id || 0;

      statsMap.set(quiz.id, {
        totalAttempts: totalCount,
        completedAttempts: quizAttempts.length,
        averageScore: quizAttempts.length > 0
          ? quizAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / quizAttempts.length
          : null,
        bestScore: quizAttempts.length > 0
          ? Math.max(...quizAttempts.map(a => a.score || 0))
          : null,
        averagePercentage: quizAttempts.length > 0
          ? quizAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / quizAttempts.length
          : null,
        averageTime: quizAttempts.length > 0
          ? quizAttempts.reduce((sum, a) => sum + (a.timeSpentSeconds || 0), 0) / quizAttempts.length
          : null,
      });
    });

    // Attach stats to quizzes
    const quizzesWithStats = quizzes.map(quiz => ({
      ...quiz,
      stats: statsMap.get(quiz.id),
    }));

    sendSuccess(res, {
      data: quizzesWithStats,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get quizzes error:', error);
    sendError(res, 'Failed to fetch quizzes', 500);
  }
};

// Get quiz by ID
export const getQuizById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const quiz = await prisma.quiz.findFirst({
      where: { id, userId },
      include: {
        attempts: {
          where: { status: 'in_progress' },
          orderBy: { startedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!quiz) {
      sendNotFound(res, 'Quiz not found');
      return;
    }

    // Get statistics
    const attempts = await prisma.quizAttempt.findMany({
      where: {
        quizId: quiz.id,
        status: 'completed',
      },
      select: {
        score: true,
        percentage: true,
        timeSpentSeconds: true,
        completedAt: true,
      },
      orderBy: { completedAt: 'desc' },
    });

    const stats = {
      totalAttempts: attempts.length,
      averageScore: attempts.length > 0
        ? attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length
        : null,
      bestScore: attempts.length > 0
        ? Math.max(...attempts.map(a => a.score || 0))
        : null,
      averagePercentage: attempts.length > 0
        ? attempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / attempts.length
        : null,
      averageTime: attempts.length > 0
        ? attempts.reduce((sum, a) => sum + (a.timeSpentSeconds || 0), 0) / attempts.length
        : null,
      lastAttempt: attempts[0]?.completedAt || null,
    };

    sendSuccess(res, {
      ...quiz,
      stats,
      hasInProgressAttempt: quiz.attempts.length > 0,
      inProgressAttempt: quiz.attempts[0] || null,
    });
  } catch (error) {
    console.error('Get quiz error:', error);
    sendError(res, 'Failed to fetch quiz', 500);
  }
};

// Delete quiz
export const deleteQuiz = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const quiz = await prisma.quiz.findFirst({
      where: { id, userId },
    });

    if (!quiz) {
      sendNotFound(res, 'Quiz not found');
      return;
    }

    await prisma.quiz.delete({
      where: { id },
    });

    sendSuccess(res, null, 'Quiz deleted successfully');
  } catch (error) {
    console.error('Delete quiz error:', error);
    sendError(res, 'Failed to delete quiz', 500);
  }
};

// Get quiz history (all completed attempts)
export const getQuizHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { mode, sortBy = 'date', order = 'desc' } = req.query;

    // Verify quiz exists and belongs to user
    const quiz = await prisma.quiz.findFirst({
      where: { id, userId },
    });

    if (!quiz) {
      sendNotFound(res, 'Quiz not found');
      return;
    }

    // Build where clause
    const where: any = {
      quizId: id,
      status: 'completed',
    };

    if (mode) {
      where.mode = mode;
    }

    // Determine sort field
    let orderBy: any = { completedAt: 'desc' };
    if (sortBy === 'score') {
      orderBy = { score: order };
    } else if (sortBy === 'percentage') {
      orderBy = { percentage: order };
    } else if (sortBy === 'time') {
      orderBy = { timeSpentSeconds: order };
    }

    // Get all completed attempts
    const attempts = await prisma.quizAttempt.findMany({
      where,
      orderBy,
      select: {
        id: true,
        mode: true,
        score: true,
        maxScore: true,
        percentage: true,
        timeSpentSeconds: true,
        completedAt: true,
        isRandomized: true,
      },
    });

    sendSuccess(res, {
      quizId: quiz.id,
      quizTitle: quiz.title,
      attempts,
      totalAttempts: attempts.length,
    });
  } catch (error) {
    console.error('Get quiz history error:', error);
    sendError(res, 'Failed to fetch quiz history', 500);
  }
};

// Get quiz statistics
export const getQuizStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Get total quizzes
    const totalQuizzes = await prisma.quiz.count({
      where: { userId },
    });

    // Get all completed attempts
    const completedAttempts = await prisma.quizAttempt.findMany({
      where: {
        quiz: { userId },
        status: 'completed',
      },
      select: {
        percentage: true,
        timeSpentSeconds: true,
      },
    });

    const totalAttempts = completedAttempts.length;

    // Calculate average score
    let averageScore = null;
    if (totalAttempts > 0) {
      const totalPercentage = completedAttempts.reduce((sum, attempt) => sum + (attempt.percentage || 0), 0);
      averageScore = totalPercentage / totalAttempts;
    }

    // Calculate total study time (in minutes)
    const totalStudyTimeMinutes = completedAttempts.reduce(
      (sum, attempt) => sum + (attempt.timeSpentSeconds || 0),
      0
    ) / 60;

    sendSuccess(res, {
      totalQuizzes,
      totalAttempts,
      averageScore,
      totalStudyTimeMinutes,
    });
  } catch (error) {
    console.error('Get quiz stats error:', error);
    sendError(res, 'Failed to fetch quiz statistics', 500);
  }
};
