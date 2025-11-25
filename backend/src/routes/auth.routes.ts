import { Router } from 'express';
import { z } from 'zod';
import { validateBody } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
} from '../controllers/auth.controller.js';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional(),
  timezone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const updateProfileSchema = z.object({
  name: z.string().optional(),
  timezone: z.string().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

// Routes
router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.get('/me', authenticate, getMe);
router.patch('/profile', authenticate, validateBody(updateProfileSchema), updateProfile);
router.post('/change-password', authenticate, validateBody(changePasswordSchema), changePassword);

export default router;
