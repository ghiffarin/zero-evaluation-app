import { Request, Response } from 'express';
import prisma from '../utils/prisma.js';
import { sendSuccess, sendCreated, sendError, sendNotFound } from '../utils/response.js';

// Shuffle array utility
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Randomize questions within sections
const randomizeQuestions = (sections: any[], questions: any[]): { order: string[]; sectionsOrder: any[] } => {
  const questionMap = new Map(questions.map(q => [q.id, q]));
  const randomizedOrder: string[] = [];
  const sectionsOrder = sections.map(section => {
    const sectionQuestions = section.question_ids.map((id: string) => questionMap.get(id)).filter(Boolean);
    const shuffled = shuffleArray(sectionQuestions);
    const shuffledIds = shuffled.map((q: any) => q.id);
    randomizedOrder.push(...shuffledIds);
    return {
      ...section,
      question_ids: shuffledIds,
    };
  });

  return { order: randomizedOrder, sectionsOrder };
};

// Start new quiz attempt
export const startQuizAttempt = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { quizId } = req.params;
    const { mode, randomize = false } = req.body;

    if (!mode || !['practice', 'test'].includes(mode)) {
      sendError(res, 'Invalid mode. Must be "practice" or "test"', 400);
      return;
    }

    // Get quiz
    const quiz = await prisma.quiz.findFirst({
      where: { id: quizId, userId },
    });

    if (!quiz) {
      sendNotFound(res, 'Quiz not found');
      return;
    }

    // Check for existing in-progress attempt
    const existingAttempt = await prisma.quizAttempt.findFirst({
      where: {
        quizId,
        userId,
        status: 'in_progress',
      },
    });

    if (existingAttempt) {
      // Abandon existing attempt
      await prisma.quizAttempt.update({
        where: { id: existingAttempt.id },
        data: { status: 'abandoned' },
      });
    }

    // Prepare randomized order if requested
    let randomizedOrderJson: any = undefined;
    if (randomize) {
      const { order, sectionsOrder } = randomizeQuestions(
        quiz.sectionsJson as any[],
        quiz.questionsJson as any[]
      );
      randomizedOrderJson = { order, sections: sectionsOrder };
    }

    // Create new attempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        userId,
        quizId,
        mode,
        maxScore: quiz.maxScore,
        isRandomized: randomize,
        ...(randomizedOrderJson && { randomizedOrderJson }),
      },
      include: {
        quiz: {
          select: {
            title: true,
            totalQuestions: true,
            recommendedTimeMin: true,
            sectionsJson: true,
            questionsJson: true,
          },
        },
      },
    });

    sendCreated(res, attempt, 'Quiz attempt started');
  } catch (error) {
    console.error('Start quiz attempt error:', error);
    sendError(res, 'Failed to start quiz attempt', 500);
  }
};

// Get quiz attempt by ID
export const getQuizAttempt = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { attemptId } = req.params;

    const attempt = await prisma.quizAttempt.findFirst({
      where: { id: attemptId, userId },
      include: {
        quiz: true,
      },
    });

    if (!attempt) {
      sendNotFound(res, 'Quiz attempt not found');
      return;
    }

    sendSuccess(res, attempt);
  } catch (error) {
    console.error('Get quiz attempt error:', error);
    sendError(res, 'Failed to fetch quiz attempt', 500);
  }
};

// Submit answer for a question
export const submitAnswer = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { attemptId } = req.params;
    const { questionId, answer } = req.body;

    if (!questionId || answer === undefined) {
      sendError(res, 'Question ID and answer are required', 400);
      return;
    }

    const attempt = await prisma.quizAttempt.findFirst({
      where: { id: attemptId, userId },
      include: { quiz: true },
    });

    if (!attempt) {
      sendNotFound(res, 'Quiz attempt not found');
      return;
    }

    if (attempt.status !== 'in_progress') {
      sendError(res, 'Quiz attempt is not in progress', 400);
      return;
    }

    // Update answers
    const answers = attempt.answersJson as Record<string, string>;
    answers[questionId] = answer;

    await prisma.quizAttempt.update({
      where: { id: attemptId },
      data: { answersJson: answers },
    });

    // For practice mode, provide immediate feedback
    if (attempt.mode === 'practice') {
      const questions = attempt.quiz.questionsJson as any[];
      const question = questions.find(q => q.id === questionId);

      if (question) {
        const isCorrect = answer.toLowerCase() === question.answer.toLowerCase();
        sendSuccess(res, {
          correct: isCorrect,
          correctAnswer: question.answer,
        });
        return;
      }
    }

    sendSuccess(res, { message: 'Answer submitted' });
  } catch (error) {
    console.error('Submit answer error:', error);
    sendError(res, 'Failed to submit answer', 500);
  }
};

// Save progress
export const saveProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { attemptId } = req.params;
    const { currentQuestionIndex } = req.body;

    const attempt = await prisma.quizAttempt.findFirst({
      where: { id: attemptId, userId },
    });

    if (!attempt) {
      sendNotFound(res, 'Quiz attempt not found');
      return;
    }

    if (attempt.status !== 'in_progress') {
      sendError(res, 'Quiz attempt is not in progress', 400);
      return;
    }

    await prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        currentQuestionIndex: currentQuestionIndex ?? attempt.currentQuestionIndex,
        lastSavedAt: new Date(),
      },
    });

    sendSuccess(res, null, 'Progress saved');
  } catch (error) {
    console.error('Save progress error:', error);
    sendError(res, 'Failed to save progress', 500);
  }
};

// Complete quiz attempt
export const completeQuizAttempt = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { attemptId } = req.params;

    const attempt = await prisma.quizAttempt.findFirst({
      where: { id: attemptId, userId },
      include: { quiz: true },
    });

    if (!attempt) {
      sendNotFound(res, 'Quiz attempt not found');
      return;
    }

    if (attempt.status !== 'in_progress') {
      sendError(res, 'Quiz attempt is not in progress', 400);
      return;
    }

    // Calculate results
    const questions = attempt.quiz.questionsJson as any[];
    const answers = attempt.answersJson as Record<string, string>;
    const results: Record<string, any> = {};
    let score = 0;

    questions.forEach(question => {
      const userAnswer = answers[question.id];
      const isCorrect = userAnswer && userAnswer.toLowerCase() === question.answer.toLowerCase();

      if (isCorrect) {
        score += attempt.quiz.correctPoints;
      } else {
        score += attempt.quiz.wrongPoints;
      }

      results[question.id] = {
        correct: isCorrect,
        userAnswer: userAnswer || null,
        correctAnswer: question.answer,
      };
    });

    const percentage = (score / attempt.quiz.maxScore) * 100;
    const timeSpent = Math.floor((new Date().getTime() - attempt.startedAt.getTime()) / 1000);

    // Update attempt
    const completedAttempt = await prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        status: 'completed',
        score,
        percentage,
        timeSpentSeconds: timeSpent,
        completedAt: new Date(),
        resultsJson: results,
      },
      include: {
        quiz: {
          select: {
            title: true,
            totalQuestions: true,
            maxScore: true,
          },
        },
      },
    });

    sendSuccess(res, completedAttempt, 'Quiz completed');
  } catch (error) {
    console.error('Complete quiz attempt error:', error);
    sendError(res, 'Failed to complete quiz attempt', 500);
  }
};

// Get quiz attempt results
export const getQuizAttemptResults = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { attemptId } = req.params;

    const attempt = await prisma.quizAttempt.findFirst({
      where: { id: attemptId, userId },
      include: {
        quiz: true,
      },
    });

    if (!attempt) {
      sendNotFound(res, 'Quiz attempt not found');
      return;
    }

    if (attempt.status !== 'completed') {
      sendError(res, 'Quiz attempt is not completed yet', 400);
      return;
    }

    sendSuccess(res, attempt);
  } catch (error) {
    console.error('Get quiz attempt results error:', error);
    sendError(res, 'Failed to fetch results', 500);
  }
};

// Get quiz history (all attempts for a quiz)
export const getQuizHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { quizId } = req.params;
    const { status } = req.query;

    const where: any = { userId, quizId };
    if (status) {
      where.status = status;
    }

    const attempts = await prisma.quizAttempt.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      include: {
        quiz: {
          select: {
            title: true,
            maxScore: true,
          },
        },
      },
    });

    sendSuccess(res, attempts);
  } catch (error) {
    console.error('Get quiz history error:', error);
    sendError(res, 'Failed to fetch quiz history', 500);
  }
};

// Get all quiz attempts for user
export const getAllQuizAttempts = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { page = '1', limit = '20', status, mode } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { userId };
    if (status) where.status = status;
    if (mode) where.mode = mode;

    const [attempts, total] = await Promise.all([
      prisma.quizAttempt.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { startedAt: 'desc' },
        include: {
          quiz: {
            select: {
              title: true,
              difficulty: true,
              maxScore: true,
            },
          },
        },
      }),
      prisma.quizAttempt.count({ where }),
    ]);

    sendSuccess(res, {
      data: attempts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get all quiz attempts error:', error);
    sendError(res, 'Failed to fetch quiz attempts', 500);
  }
};
