import { AppError, ValidationError } from '@/types';
import { Logger } from './logger';

/**
 * Custom error classes
 */
export class ApiError extends Error implements AppError {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationErrorClass extends Error {
  constructor(
    message: string,
    public errors: ValidationError[]
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Network error occurred') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/**
 * Error handler utility functions
 */
export class ErrorHandler {
  /**
   * Handle API errors and convert them to user-friendly messages
   */
  static handleApiError(error: unknown): { message: string; shouldRetry: boolean } {
    if (error instanceof ApiError) {
      return {
        message: error.message,
        shouldRetry: error.statusCode >= 500
      };
    }

    if (error instanceof NetworkError) {
      return {
        message: 'Network connection failed. Please check your internet connection.',
        shouldRetry: true
      };
    }

    if (error instanceof AuthenticationError) {
      return {
        message: 'Your session has expired. Please log in again.',
        shouldRetry: false
      };
    }

    if (error instanceof AuthorizationError) {
      return {
        message: 'You don\'t have permission to perform this action.',
        shouldRetry: false
      };
    }

    if (error instanceof ValidationErrorClass) {
      const firstError = error.errors[0];
      return {
        message: firstError ? `${firstError.field}: ${firstError.message}` : 'Validation failed',
        shouldRetry: false
      };
    }

    if (error instanceof Error) {
      return {
        message: error.message || 'An unexpected error occurred',
        shouldRetry: false
      };
    }

    return {
      message: 'An unexpected error occurred',
      shouldRetry: false
    };
  }

  /**
   * Log errors with context
   */
  static async logError(
    error: unknown,
    context: {
      user?: string;
      action?: string;
      component?: string;
      additionalInfo?: Record<string, unknown>;
    }
  ): Promise<void> {
    const user = context.user || 'Unknown';
    const errorMessage = error instanceof Error ? error.message : String(error);
    const contextStr = [
      context.component && `Component: ${context.component}`,
      context.action && `Action: ${context.action}`,
      context.additionalInfo && `Info: ${JSON.stringify(context.additionalInfo)}`
    ].filter(Boolean).join(', ');

    await Logger.systemError(user, errorMessage, contextStr);

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', { error, context });
    }
  }

  /**
   * Create a standardized error response for API routes
   */
  static createErrorResponse(
    error: unknown,
    defaultMessage: string = 'Internal server error'
  ): {
    error: string;
    success: false;
    statusCode: number;
  } {
    if (error instanceof ApiError) {
      return {
        error: error.message,
        success: false,
        statusCode: error.statusCode
      };
    }

    if (error instanceof ValidationErrorClass) {
      return {
        error: error.message,
        success: false,
        statusCode: 400
      };
    }

    if (error instanceof AuthenticationError) {
      return {
        error: error.message,
        success: false,
        statusCode: 401
      };
    }

    if (error instanceof AuthorizationError) {
      return {
        error: error.message,
        success: false,
        statusCode: 403
      };
    }

    return {
      error: defaultMessage,
      success: false,
      statusCode: 500
    };
  }

  /**
   * Wrap async functions with error handling
   */
  static wrapAsync<T extends unknown[], R>(
    fn: (...args: T) => Promise<R>,
    context?: { component?: string; action?: string }
  ) {
    return async (...args: T): Promise<R> => {
      try {
        return await fn(...args);
      } catch (error) {
        await this.logError(error, {
          component: context?.component,
          action: context?.action,
        });
        throw error;
      }
    };
  }

  /**
   * Retry a function with exponential backoff
   */
  static async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        // Don't retry on certain types of errors
        if (
          error instanceof AuthenticationError ||
          error instanceof AuthorizationError ||
          error instanceof ValidationErrorClass ||
          (error instanceof ApiError && error.statusCode < 500)
        ) {
          throw error;
        }

        if (attempt === maxRetries) {
          break;
        }

        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * Safe JSON parsing with error handling
   */
  static safeJsonParse<T>(json: string, defaultValue: T): T {
    try {
      return JSON.parse(json);
    } catch (error) {
      console.warn('Failed to parse JSON:', error);
      return defaultValue;
    }
  }

  /**
   * Validate required fields
   */
  static validateRequired(
    data: Record<string, unknown>,
    requiredFields: string[]
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const field of requiredFields) {
      const value = data[field];
      if (value === undefined || value === null || value === '') {
        errors.push({
          field,
          message: 'This field is required',
          value
        });
      }
    }

    return errors;
  }

  /**
   * Sanitize error messages for user display
   */
  static sanitizeErrorMessage(message: string): string {
    // Remove sensitive information patterns
    return message
      .replace(/password|token|key|secret/gi, '[REDACTED]')
      .replace(/\b\d{4,}\b/g, '[REDACTED]') // Remove potential IDs/tokens
      .trim();
  }
}

/**
 * Hook for handling errors in components (non-React version)
 */
export function createErrorHandler() {
  const handleError = async (
    error: unknown,
    context?: {
      component?: string;
      action?: string;
      showToast?: boolean;
    }
  ) => {
    const { message, shouldRetry } = ErrorHandler.handleApiError(error);
    
    await ErrorHandler.logError(error, {
      component: context?.component,
      action: context?.action,
    });

    // Here you could integrate with a toast notification system
    if (context?.showToast) {
      console.error('Error:', message); // Replace with actual toast implementation
    }

    return { message, shouldRetry };
  };

  return { handleError };
}
