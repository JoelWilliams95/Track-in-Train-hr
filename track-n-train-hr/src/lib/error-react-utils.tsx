import React from 'react'
import { ErrorHandler } from './error-handler'
import ErrorBoundary from '@/components/ErrorBoundary'

/**
 * Higher-order component for error boundary
 */
export function withErrorHandling<P extends object>(
  Component: React.ComponentType<P>,
  errorComponent?: React.ComponentType<{ error: Error; reset: () => void }>
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={errorComponent}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

/**
 * React hook for handling errors in components
 */
export function useErrorHandler() {
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

// Re-export ErrorBoundary for convenience
export { ErrorBoundary }
