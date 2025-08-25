import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAsync, useDebounceAsync, useApiCall, useFormSubmission, usePolling } from '../useAsync'
import { ApiError } from '@/lib/error-handler'

// Mock the error handler
jest.mock('@/lib/error-handler', () => ({
  ErrorHandler: {
    handleApiError: jest.fn((error) => ({
      message: error.message || 'Unknown error',
      shouldRetry: false,
    })),
    retryWithBackoff: jest.fn(),
  },
  ApiError: class ApiError extends Error {
    constructor(message: string, public statusCode: number = 500) {
      super(message)
      this.name = 'ApiError'
    }
  },
}))

describe('useAsync', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('initializes with default state', () => {
    const mockFn = jest.fn()
    const { result } = renderHook(() => useAsync(mockFn))

    expect(result.current.data).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('executes async function successfully', async () => {
    const mockFn = jest.fn().mockResolvedValue('success')
    const { result } = renderHook(() => useAsync(mockFn))

    act(() => {
      result.current.execute()
    })

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.data).toBe('success')
    expect(result.current.error).toBeNull()
    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  it('handles async function errors', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('Test error'))
    const { result } = renderHook(() => useAsync(mockFn))

    act(() => {
      result.current.execute()
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.data).toBeNull()
    expect(result.current.error).toBe('Test error')
  })

  it('calls onSuccess callback on successful execution', async () => {
    const mockFn = jest.fn().mockResolvedValue('success')
    const onSuccess = jest.fn()
    const { result } = renderHook(() => useAsync(mockFn, { onSuccess }))

    act(() => {
      result.current.execute()
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(onSuccess).toHaveBeenCalledWith('success')
  })

  it('calls onError callback on failed execution', async () => {
    const error = new Error('Test error')
    const mockFn = jest.fn().mockRejectedValue(error)
    const onError = jest.fn()
    const { result } = renderHook(() => useAsync(mockFn, { onError }))

    act(() => {
      result.current.execute()
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(onError).toHaveBeenCalledWith(error)
  })

  it('executes immediately when immediate option is true', async () => {
    const mockFn = jest.fn().mockResolvedValue('immediate')
    renderHook(() => useAsync(mockFn, { immediate: true }))

    await waitFor(() => {
      expect(mockFn).toHaveBeenCalledTimes(1)
    })
  })

  it('resets state correctly', async () => {
    const mockFn = jest.fn().mockResolvedValue('success')
    const { result } = renderHook(() => useAsync(mockFn))

    act(() => {
      result.current.execute()
    })

    await waitFor(() => {
      expect(result.current.data).toBe('success')
    })

    act(() => {
      result.current.reset()
    })

    expect(result.current.data).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('handles race conditions correctly', async () => {
    let resolveFirst: (value: string) => void
    let resolveSecond: (value: string) => void

    const firstPromise = new Promise<string>((resolve) => {
      resolveFirst = resolve
    })
    const secondPromise = new Promise<string>((resolve) => {
      resolveSecond = resolve
    })

    const mockFn = jest.fn()
      .mockReturnValueOnce(firstPromise)
      .mockReturnValueOnce(secondPromise)

    const { result } = renderHook(() => useAsync(mockFn))

    // Start first call
    act(() => {
      result.current.execute()
    })

    // Start second call immediately
    act(() => {
      result.current.execute()
    })

    // Resolve first call (should be ignored)
    act(() => {
      resolveFirst('first')
    })

    // Resolve second call (should be used)
    act(() => {
      resolveSecond('second')
    })

    await waitFor(() => {
      expect(result.current.data).toBe('second')
    })
  })

  it('uses executeWithRetry with ErrorHandler.retryWithBackoff', async () => {
    const { ErrorHandler } = require('@/lib/error-handler')
    const mockFn = jest.fn().mockResolvedValue('retry success')
    ErrorHandler.retryWithBackoff.mockResolvedValue('retry success')

    const { result } = renderHook(() => useAsync(mockFn))

    act(() => {
      result.current.executeWithRetry()
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(ErrorHandler.retryWithBackoff).toHaveBeenCalled()
    expect(result.current.data).toBe('retry success')
  })
})

describe('useDebounceAsync', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('debounces function calls', async () => {
    const mockFn = jest.fn().mockResolvedValue('debounced')
    const { result } = renderHook(() => useDebounceAsync(mockFn, 300))

    // Call multiple times rapidly
    act(() => {
      result.current.execute('arg1')
      result.current.execute('arg2')
      result.current.execute('arg3')
    })

    // Should not execute yet
    expect(mockFn).not.toHaveBeenCalled()

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(300)
    })

    await waitFor(() => {
      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('arg3') // Only last call should execute
    })
  })

  it('cancels previous debounced calls', () => {
    const mockFn = jest.fn().mockResolvedValue('test')
    const { result } = renderHook(() => useDebounceAsync(mockFn, 300))

    act(() => {
      result.current.execute('first')
    })

    act(() => {
      jest.advanceTimersByTime(200) // Not enough to trigger
    })

    act(() => {
      result.current.execute('second') // Should cancel first
    })

    act(() => {
      jest.advanceTimersByTime(300)
    })

    expect(mockFn).toHaveBeenCalledTimes(1)
    expect(mockFn).toHaveBeenCalledWith('second')
  })
})

describe('useApiCall', () => {
  it('transforms API responses', async () => {
    const mockApiFunction = jest.fn().mockResolvedValue({ data: 'raw' })
    const transformData = jest.fn((data) => ({ transformed: data.data }))
    
    const { result } = renderHook(() => 
      useApiCall(mockApiFunction, { transformData })
    )

    act(() => {
      result.current.execute()
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(transformData).toHaveBeenCalledWith({ data: 'raw' })
    expect(result.current.data).toEqual({ transformed: 'raw' })
  })

  it('handles Response objects as errors', async () => {
    const mockResponse = {
      json: jest.fn().mockResolvedValue({ message: 'API Error' }),
      status: 400,
    } as unknown as Response

    const mockApiFunction = jest.fn().mockRejectedValue(mockResponse)
    const { result } = renderHook(() => useApiCall(mockApiFunction))

    act(() => {
      result.current.execute()
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('API Error')
  })

  it('handles Response objects with no JSON body', async () => {
    const mockResponse = {
      json: jest.fn().mockRejectedValue(new Error('No JSON')),
      status: 500,
    } as unknown as Response

    const mockApiFunction = jest.fn().mockRejectedValue(mockResponse)
    const { result } = renderHook(() => useApiCall(mockApiFunction))

    act(() => {
      result.current.execute()
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('API request failed')
  })
})

describe('useFormSubmission', () => {
  it('validates form data before submission', async () => {
    const mockSubmit = jest.fn().mockResolvedValue('success')
    const validate = jest.fn().mockReturnValue(['Validation error'])
    
    const { result } = renderHook(() => 
      useFormSubmission(mockSubmit, { validate })
    )

    act(() => {
      result.current.execute({ field: 'invalid' })
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(validate).toHaveBeenCalledWith({ field: 'invalid' })
    expect(result.current.validationErrors).toEqual(['Validation error'])
    expect(mockSubmit).not.toHaveBeenCalled()
    expect(result.current.error).toBe('Validation error')
  })

  it('submits when validation passes', async () => {
    const mockSubmit = jest.fn().mockResolvedValue('success')
    const validate = jest.fn().mockReturnValue(null)
    
    const { result } = renderHook(() => 
      useFormSubmission(mockSubmit, { validate })
    )

    act(() => {
      result.current.execute({ field: 'valid' })
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(validate).toHaveBeenCalledWith({ field: 'valid' })
    expect(result.current.validationErrors).toEqual([])
    expect(mockSubmit).toHaveBeenCalledWith({ field: 'valid' })
    expect(result.current.data).toBe('success')
  })

  it('clears validation errors on successful submission', async () => {
    const mockSubmit = jest.fn().mockResolvedValue('success')
    const { result } = renderHook(() => useFormSubmission(mockSubmit))

    // Simulate having validation errors
    act(() => {
      result.current.execute({ field: 'test' })
    })

    await waitFor(() => {
      expect(result.current.data).toBe('success')
    })

    expect(result.current.validationErrors).toEqual([])
  })

  it('provides clearValidationErrors function', () => {
    const mockSubmit = jest.fn()
    const { result } = renderHook(() => useFormSubmission(mockSubmit))

    act(() => {
      result.current.clearValidationErrors()
    })

    expect(result.current.validationErrors).toEqual([])
  })
})

describe('usePolling', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('starts polling automatically when enabled', async () => {
    const mockFn = jest.fn().mockResolvedValue('polled data')
    renderHook(() => usePolling(mockFn, 1000, { enabled: true }))

    // Should execute immediately
    await waitFor(() => {
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    // Should execute again after interval
    act(() => {
      jest.advanceTimersByTime(1000)
    })

    await waitFor(() => {
      expect(mockFn).toHaveBeenCalledTimes(2)
    })
  })

  it('does not start polling when disabled', () => {
    const mockFn = jest.fn().mockResolvedValue('data')
    renderHook(() => usePolling(mockFn, 1000, { enabled: false }))

    act(() => {
      jest.advanceTimersByTime(1000)
    })

    expect(mockFn).not.toHaveBeenCalled()
  })

  it('provides manual start/stop controls', async () => {
    const mockFn = jest.fn().mockResolvedValue('data')
    const { result } = renderHook(() => usePolling(mockFn, 1000, { enabled: false }))

    expect(result.current.isPolling).toBe(false)

    act(() => {
      result.current.startPolling()
    })

    expect(result.current.isPolling).toBe(true)

    act(() => {
      result.current.stopPolling()
    })

    expect(result.current.isPolling).toBe(false)
  })

  it('pauses polling on error when pauseOnError is true', async () => {
    const mockFn = jest.fn()
      .mockResolvedValueOnce('success')
      .mockRejectedValueOnce(new Error('polling error'))
      .mockResolvedValue('success after error')

    const { result } = renderHook(() => 
      usePolling(mockFn, 1000, { enabled: true, pauseOnError: true })
    )

    // Wait for first successful call
    await waitFor(() => {
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    // Advance to trigger second call (which will error)
    act(() => {
      jest.advanceTimersByTime(1000)
    })

    await waitFor(() => {
      expect(result.current.isPolling).toBe(false)
    })

    // Should not call again automatically
    act(() => {
      jest.advanceTimersByTime(1000)
    })

    expect(mockFn).toHaveBeenCalledTimes(2) // Still only 2 calls
  })

  it('continues polling on error when pauseOnError is false', async () => {
    const mockFn = jest.fn()
      .mockResolvedValueOnce('success')
      .mockRejectedValueOnce(new Error('polling error'))
      .mockResolvedValue('success after error')

    renderHook(() => 
      usePolling(mockFn, 1000, { enabled: true, pauseOnError: false })
    )

    // Wait for first call
    await waitFor(() => {
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    // Advance to trigger error
    act(() => {
      jest.advanceTimersByTime(1000)
    })

    // Advance to trigger call after error
    act(() => {
      jest.advanceTimersByTime(1000)
    })

    await waitFor(() => {
      expect(mockFn).toHaveBeenCalledTimes(3) // Should continue polling
    })
  })

  it('cleans up intervals on unmount', () => {
    const mockFn = jest.fn().mockResolvedValue('data')
    const { unmount } = renderHook(() => 
      usePolling(mockFn, 1000, { enabled: true })
    )

    // Verify polling started
    act(() => {
      jest.advanceTimersByTime(1000)
    })

    unmount()

    // Clear any pending timers and advance
    act(() => {
      jest.advanceTimersByTime(2000)
    })

    // Should not continue calling after unmount
    expect(mockFn).toHaveBeenCalledTimes(1) // Only initial call
  })
})
