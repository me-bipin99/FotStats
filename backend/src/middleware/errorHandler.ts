import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(err: ApiError, _req: Request, res: Response, _next: NextFunction): void {
  const statusCode = err.statusCode ?? 500;
  const code = err.code ?? 'INTERNAL_ERROR';
  res.status(statusCode).json({
    error: code,
    message: err.message || 'An unexpected error occurred',
  });
}
