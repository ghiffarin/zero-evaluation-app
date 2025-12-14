import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { sendError } from '../utils/response.js';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Error:', err);

  // Ensure response hasn't been sent yet
  if (res.headersSent) {
    return;
  }

  // Custom App Error
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode);
    return;
  }

  // Prisma Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        sendError(res, 'A record with this value already exists', 409);
        return;
      case 'P2025':
        sendError(res, 'Record not found', 404);
        return;
      case 'P2003':
        sendError(res, 'Foreign key constraint failed', 400);
        return;
      default:
        sendError(res, 'Database error occurred', 500);
        return;
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    sendError(res, 'Invalid data provided', 400);
    return;
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    sendError(res, 'Database connection failed. Please check your database configuration.', 500);
    return;
  }

  if (err instanceof Prisma.PrismaClientRustPanicError) {
    sendError(res, 'Database engine error. Please try again.', 500);
    return;
  }

  // Validation Error
  if (err.name === 'ValidationError') {
    sendError(res, err.message, 422);
    return;
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    sendError(res, 'Invalid token', 401);
    return;
  }

  if (err.name === 'TokenExpiredError') {
    sendError(res, 'Token expired', 401);
    return;
  }

  // Default Error - Always return JSON
  const isDev = process.env.NODE_ENV === 'development';
  sendError(
    res,
    isDev ? err.message || 'Internal server error' : 'Internal server error',
    500
  );
};

export const notFoundHandler = (
  req: Request,
  res: Response
): void => {
  sendError(res, `Route ${req.originalUrl} not found`, 404);
};
