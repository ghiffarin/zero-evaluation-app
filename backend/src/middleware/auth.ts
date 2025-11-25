import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { sendUnauthorized } from '../utils/response.js';

interface JwtPayload {
  id: string;
  email: string;
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendUnauthorized(res, 'No token provided');
      return;
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      sendUnauthorized(res, 'JWT secret not configured');
      return;
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;

    req.user = {
      id: decoded.id,
      email: decoded.email,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      sendUnauthorized(res, 'Token expired');
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      sendUnauthorized(res, 'Invalid token');
      return;
    }
    sendUnauthorized(res, 'Authentication failed');
  }
};

export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      next();
      return;
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;

    req.user = {
      id: decoded.id,
      email: decoded.email,
    };

    next();
  } catch {
    next();
  }
};
