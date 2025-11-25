import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import prisma from '../utils/prisma.js';
import {
  sendSuccess,
  sendCreated,
  sendError,
  sendUnauthorized,
} from '../utils/response.js';

const generateToken = (id: string, email: string): string => {
  const secret = process.env.JWT_SECRET!;
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  const options: SignOptions = { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] };
  return jwt.sign({ id, email }, secret, options);
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, timezone } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      sendError(res, 'Email already registered', 409);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        timezone: timezone || 'Asia/Jakarta',
      },
      select: {
        id: true,
        email: true,
        name: true,
        timezone: true,
        createdAt: true,
      },
    });

    // Generate token
    const token = generateToken(user.id, user.email);

    sendCreated(res, { user, token }, 'Registration successful');
  } catch (error) {
    console.error('Register error:', error);
    sendError(res, 'Registration failed', 500);
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      sendUnauthorized(res, 'Invalid email or password');
      return;
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      sendUnauthorized(res, 'Invalid email or password');
      return;
    }

    // Generate token
    const token = generateToken(user.id, user.email);

    sendSuccess(res, {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        timezone: user.timezone,
      },
      token,
    }, 'Login successful');
  } catch (error) {
    console.error('Login error:', error);
    sendError(res, 'Login failed', 500);
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        timezone: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      sendUnauthorized(res, 'User not found');
      return;
    }

    sendSuccess(res, user);
  } catch (error) {
    console.error('GetMe error:', error);
    sendError(res, 'Failed to fetch user', 500);
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { name, timezone } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }),
        ...(timezone !== undefined && { timezone }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        timezone: true,
        updatedAt: true,
      },
    });

    sendSuccess(res, user, 'Profile updated');
  } catch (error) {
    console.error('UpdateProfile error:', error);
    sendError(res, 'Failed to update profile', 500);
  }
};

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      sendUnauthorized(res, 'User not found');
      return;
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isValidPassword) {
      sendError(res, 'Current password is incorrect', 400);
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    sendSuccess(res, null, 'Password changed successfully');
  } catch (error) {
    console.error('ChangePassword error:', error);
    sendError(res, 'Failed to change password', 500);
  }
};
