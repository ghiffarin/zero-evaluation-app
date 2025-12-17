import { Router } from 'express';
import * as quizController from '../controllers/quiz.controller.js';
import * as quizAttemptController from '../controllers/quiz-attempt.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Quiz management routes
router.post('/', quizController.createQuiz);
router.get('/', quizController.getAllQuizzes);
router.get('/stats', quizController.getQuizStats);
router.get('/:id', quizController.getQuizById);
router.delete('/:id', quizController.deleteQuiz);

// Quiz attempt routes
router.post('/:quizId/start', quizAttemptController.startQuizAttempt);
router.get('/:id/history', quizController.getQuizHistory);

// Quiz attempt management
router.get('/attempts/all', quizAttemptController.getAllQuizAttempts);
router.get('/attempts/:attemptId', quizAttemptController.getQuizAttempt);
router.put('/attempts/:attemptId/answer', quizAttemptController.submitAnswer);
router.put('/attempts/:attemptId/save', quizAttemptController.saveProgress);
router.post('/attempts/:attemptId/complete', quizAttemptController.completeQuizAttempt);
router.get('/attempts/:attemptId/results', quizAttemptController.getQuizAttemptResults);

export default router;
