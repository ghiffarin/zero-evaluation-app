import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200,
  meta?: ApiResponse['meta']
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
    meta,
  };
  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  error: string,
  statusCode = 400
): Response => {
  const response: ApiResponse = {
    success: false,
    error,
  };
  return res.status(statusCode).json(response);
};

export const sendCreated = <T>(
  res: Response,
  data: T,
  message = 'Created successfully'
): Response => {
  return sendSuccess(res, data, message, 201);
};

export const sendNotFound = (
  res: Response,
  message = 'Resource not found'
): Response => {
  return sendError(res, message, 404);
};

export const sendUnauthorized = (
  res: Response,
  message = 'Unauthorized'
): Response => {
  return sendError(res, message, 401);
};

export const sendForbidden = (
  res: Response,
  message = 'Forbidden'
): Response => {
  return sendError(res, message, 403);
};

export const sendValidationError = (
  res: Response,
  errors: string | string[]
): Response => {
  const message = Array.isArray(errors) ? errors.join(', ') : errors;
  return sendError(res, message, 422);
};
