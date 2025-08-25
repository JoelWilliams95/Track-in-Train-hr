import { useState, useCallback, useRef, useEffect } from 'react';
import { UseAsyncState } from '@/types';
import { ErrorHandler, ApiError } from '@/lib/error-handler';

interface UseAsyncOptions {
  immediate?: boolean;
  onSuccess?: (data: unknown) => void;
  onError?: (error: Error) => void;
  retries?: number;
  retryDelay?: number;
}

/**
 * Custom hook for handling async operations with proper error handling and loading states
 */
export function useAsync<T>(
  asyncFunction: (...args: unknown[]) => Promise<T>,
  options: UseAsyncOptions = {}
): UseAsyncState<T> & {
  executeWithRetry: (...args: unknown[]) => Promise<void>;
} {
  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: string | null;
  }>({
    data: null,
    loading: false,
    error: null,
  });

  const activeRef = useRef(true);
  const lastCallId = useRef(0);

  useEffect(() => {
    return () => {
      activeRef.current = false;
    };
  }, []);

  const execute = useCallback(async (...args: unknown[]): Promise<void> => {
    const callId = ++lastCallId.current;

    if (!activeRef.current) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await asyncFunction(...args);
      
      if (!activeRef.current || callId !== lastCallId.current) return;
      
      setState({ data, loading: false, error: null });
      options.onSuccess?.(data);
    } catch (error) {
      if (!activeRef.current || callId !== lastCallId.current) return;

      const { message } = ErrorHandler.handleApiError(error);
      setState(prev => ({ ...prev, loading: false, error: message }));
      options.onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  }, [asyncFunction, options]);

  const executeWithRetry = useCallback(async (...args: unknown[]): Promise<void> => {
    const retryWrapper = async () => {
      return await asyncFunction(...args);
    };

    const callId = ++lastCallId.current;

    if (!activeRef.current) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await ErrorHandler.retryWithBackoff(
        retryWrapper,
        options.retries || 3,
        options.retryDelay || 1000
      );

      if (!activeRef.current || callId !== lastCallId.current) return;

      setState({ data, loading: false, error: null });
      options.onSuccess?.(data);
    } catch (error) {
      if (!activeRef.current || callId !== lastCallId.current) return;

      const { message } = ErrorHandler.handleApiError(error);
      setState(prev => ({ ...prev, loading: false, error: message }));
      options.onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  }, [asyncFunction, options]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  // Execute immediately if requested
  useEffect(() => {
    if (options.immediate) {
      execute();
    }
  }, [execute, options.immediate]);

  return {
    ...state,
    execute,
    executeWithRetry,
    reset,
  };
}

/**
 * Hook for debounced async operations (useful for search)
 */
export function useDebounceAsync<T>(
  asyncFunction: (...args: unknown[]) => Promise<T>,
  delay: number = 300,
  options: UseAsyncOptions = {}
) {
  const [debouncedArgs, setDebouncedArgs] = useState<unknown[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const asyncState = useAsync(asyncFunction, {
    ...options,
    immediate: false,
  });

  const debouncedExecute = useCallback((...args: unknown[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedArgs(args);
    }, delay);
  }, [delay]);

  useEffect(() => {
    if (debouncedArgs.length > 0) {
      asyncState.execute(...debouncedArgs);
    }
  }, [debouncedArgs, asyncState]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    ...asyncState,
    execute: debouncedExecute,
  };
}

/**
 * Hook for handling API calls with automatic error handling
 */
export function useApiCall<TData = unknown, TError = unknown>(
  apiFunction: (...args: unknown[]) => Promise<TData>,
  options: UseAsyncOptions & {
    transformData?: (data: TData) => TData;
    transformError?: (error: TError) => string;
  } = {}
) {
  const wrappedFunction = useCallback(async (...args: unknown[]) => {
    try {
      const response = await apiFunction(...args);
      return options.transformData ? options.transformData(response) : response;
    } catch (error) {
      // Transform API errors to our standard format
      if (error instanceof Response) {
        const errorData = await error.json().catch(() => ({}));
        throw new ApiError(
          errorData.message || errorData.error || 'API request failed',
          error.status
        );
      }
      throw error;
    }
  }, [apiFunction, options.transformData]);

  return useAsync(wrappedFunction, options);
}

/**
 * Hook for handling form submissions with validation
 */
export function useFormSubmission<TData>(
  submitFunction: (data: TData) => Promise<unknown>,
  options: UseAsyncOptions & {
    validate?: (data: TData) => string[] | null;
    resetOnSuccess?: boolean;
  } = {}
) {
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const wrappedSubmit = useCallback(async (data: TData) => {
    // Client-side validation
    if (options.validate) {
      const errors = options.validate(data);
      if (errors && errors.length > 0) {
        setValidationErrors(errors);
        throw new Error(errors[0]);
      }
    }

    setValidationErrors([]);
    return await submitFunction(data);
  }, [submitFunction, options.validate]);

  const asyncState = useAsync(wrappedSubmit, {
    ...options,
    onSuccess: (data) => {
      if (options.resetOnSuccess !== false) {
        setValidationErrors([]);
      }
      options.onSuccess?.(data);
    },
  });

  return {
    ...asyncState,
    validationErrors,
    clearValidationErrors: () => setValidationErrors([]),
  };
}

/**
 * Hook for polling data at regular intervals
 */
export function usePolling<T>(
  asyncFunction: () => Promise<T>,
  interval: number,
  options: UseAsyncOptions & {
    enabled?: boolean;
    pauseOnError?: boolean;
  } = {}
) {
  const intervalRef = useRef<NodeJS.Timeout>();
  const [isPolling, setIsPolling] = useState(false);

  const asyncState = useAsync(asyncFunction, {
    ...options,
    immediate: options.enabled !== false,
    onError: (error) => {
      if (options.pauseOnError !== false) {
        setIsPolling(false);
      }
      options.onError?.(error);
    },
  });

  const startPolling = useCallback(() => {
    if (intervalRef.current) return;

    setIsPolling(true);
    intervalRef.current = setInterval(() => {
      asyncState.execute();
    }, interval);
  }, [asyncState, interval]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
    setIsPolling(false);
  }, []);

  useEffect(() => {
    if (options.enabled !== false) {
      startPolling();
    }

    return () => {
      stopPolling();
    };
  }, [startPolling, stopPolling, options.enabled]);

  return {
    ...asyncState,
    isPolling,
    startPolling,
    stopPolling,
  };
}
