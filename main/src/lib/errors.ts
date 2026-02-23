// Error Handling Utilities

import { ERROR_MESSAGES } from './constants';
import type { ApiError, ValidationError } from '@/types/api';

// ============================================
// ERROR CLASSES
// ============================================

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;
  }
}

export class ValidationErrorClass extends AppError {
  public fields?: Record<string, string>;

  constructor(message: string, fields?: Record<string, string>) {
    super(message, 400);
    this.fields = fields;
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = ERROR_MESSAGES.AUTH_UNAUTHORIZED) {
    super(message, 401);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

// ============================================
// ERROR HANDLER FUNCTION
// ============================================

export function handleApiError(error: unknown): ApiError {
  // Already an ApiError
  if (isApiError(error)) {
    return error;
  }

  // AppError instance
  if (error instanceof AppError) {
    return {
      error: error.message,
    };
  }

  // Standard Error
  if (error instanceof Error) {
    return {
      error: error.message || ERROR_MESSAGES.SERVER_ERROR,
    };
  }

  // Unknown error
  return {
    error: ERROR_MESSAGES.SERVER_ERROR,
  };
}

// ============================================
// TYPE GUARDS
// ============================================

export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    typeof (error as ApiError).error === 'string'
  );
}

export function isValidationError(error: unknown): error is ValidationError {
  return (
    isApiError(error) &&
    'fields' in error &&
    typeof (error as ValidationError).fields === 'object'
  );
}

// ============================================
// ERROR RESPONSE BUILDERS
// ============================================

export function createErrorResponse(
  message: string,
  statusCode: number = 500
): Response {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

export function createValidationErrorResponse(
  message: string,
  fields?: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({ error: message, fields }),
    {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

// ============================================
// ERROR LOGGING
// ============================================

export function logError(error: unknown, context?: string): void {
  const timestamp = new Date().toISOString();
  const prefix = context ? `[${context}]` : '[Error]';
  
  console.error(`${prefix} ${timestamp}:`, error);
  
  // In production, send to error tracking service (e.g., Sentry)
  if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
    // TODO: Implement Sentry error tracking
    // Sentry.captureException(error);
  }
}

// ============================================
// USER-FRIENDLY ERROR MESSAGES
// ============================================

export function getUserFriendlyError(error: unknown): string {
  if (error instanceof AuthenticationError) {
    return ERROR_MESSAGES.AUTH_UNAUTHORIZED;
  }

  if (error instanceof ValidationErrorClass) {
    return error.message;
  }

  if (error instanceof NotFoundError) {
    return error.message;
  }

  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    // Map common error messages to user-friendly ones
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }
    
    if (message.includes('unauthorized') || message.includes('401')) {
      return ERROR_MESSAGES.AUTH_UNAUTHORIZED;
    }
    
    if (message.includes('not found') || message.includes('404')) {
      return 'Resource tidak ditemukan';
    }
    
    if (message.includes('timeout')) {
      return 'Request timeout, silakan coba lagi';
    }
    
    return error.message;
  }

  return ERROR_MESSAGES.SERVER_ERROR;
}

// ============================================
// ASYNC ERROR WRAPPER
// ============================================

export function catchAsync<T>(
  fn: (...args: any[]) => Promise<T>
): (...args: any[]) => Promise<T | ApiError> {
  return async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(error, fn.name);
      return handleApiError(error);
    }
  };
}

// ============================================
// RETRY UTILITY
// ============================================

export async function retryAsync<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: unknown;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (i < maxRetries - 1) {
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, i)));
      }
    }
  }
  
  throw lastError;
}
