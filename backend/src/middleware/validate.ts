import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendValidationError } from '../utils/response.js';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map(
          (e) => `${e.path.slice(1).join('.')}: ${e.message}`
        );
        sendValidationError(res, messages);
        return;
      }
      next(error);
    }
  };
};

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map(
          (e) => `${e.path.join('.')}: ${e.message}`
        );
        sendValidationError(res, messages);
        return;
      }
      next(error);
    }
  };
};
