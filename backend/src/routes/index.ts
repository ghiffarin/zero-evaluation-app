import { Router } from 'express';

import authRoutes from './auth.routes.js';
import dailyLogRoutes from './daily-log.routes.js';
import ieltsRoutes from './ielts.routes.js';
import journalRoutes from './journal.routes.js';
import bookRoutes from './book.routes.js';
import skillRoutes from './skill.routes.js';
import workoutRoutes from './workout.routes.js';
import wellnessRoutes from './wellness.routes.js';
import financialRoutes from './financial.routes.js';
import reflectionRoutes from './reflection.routes.js';
import careerRoutes from './career.routes.js';
import mastersPrepRoutes from './masters-prep.routes.js';
import projectRoutes from './project.routes.js';
import goalRoutes from './goal.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import reportsRoutes from './reports.routes.js';
import exportRoutes from './export.routes.js';
import importRoutes from './import.routes.js';
import quizRoutes from './quiz.routes.js';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes
router.use('/auth', authRoutes);

// Dashboard routes
router.use('/dashboard', dashboardRoutes);

// Reports routes
router.use('/reports', reportsRoutes);

// Module routes
router.use('/daily-logs', dailyLogRoutes);
router.use('/ielts', ieltsRoutes);
router.use('/journals', journalRoutes);
router.use('/books', bookRoutes);
router.use('/skills', skillRoutes);
router.use('/workouts', workoutRoutes);
router.use('/wellness', wellnessRoutes);
router.use('/financial', financialRoutes);
router.use('/reflections', reflectionRoutes);
router.use('/career', careerRoutes);
router.use('/masters-prep', mastersPrepRoutes);

// Core routes
router.use('/projects', projectRoutes);
router.use('/goals', goalRoutes);

// Quiz routes
router.use('/quizzes', quizRoutes);

// Export routes
router.use('/export', exportRoutes);

// Import routes
router.use('/import', importRoutes);

export default router;
