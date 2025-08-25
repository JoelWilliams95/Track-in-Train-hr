import {
  ApiError,
  ValidationErrorClass,
  NetworkError,
  AuthenticationError,
  AuthorizationError,
  ErrorHandler,
  useErrorHandler,
} from '../error-handler'

// Mock the logger
jest.mock('../logger', () => ({
  Logger: {
    systemError: jest.fn(),
  },
}))

describe('Custom Error Classes', () => {
  describe('ApiError', () => {
    it('creates ApiError with default status code', () => {
      const error = new ApiError('Test error')
      
      expect(error.message).toBe('Test error')
      expect(error.statusCode).toBe(500)
      expect(error.name).toBe('ApiError')
    })

    it('creates ApiError with custom status code and context', () => {
      const context = { userId: '123', action: 'create' }
      const error = new ApiError('Custom error', 400, 'VALIDATION_ERROR', context)
      
      expect(error.message).toBe('Custom error')
      expect(error.statusCode).toBe(400)
      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.context).toEqual(context)
    })
  })

  describe('ValidationErrorClass', () => {
    it('creates validation error with multiple field errors', () => {
      const errors = [
        { field: 'email', message: 'Invalid email', value: 'invalid-email' },
        { field: 'password', message: 'Too short', value: '123' },
      ]
      const error = new ValidationErrorClass('Validation failed', errors)
      
      expect(error.message).toBe('Validation failed')
      expect(error.errors).toEqual(errors)
      expect(error.name).toBe('ValidationError')
    })
  })

  describe('NetworkError', () => {
    it('creates network error with default message', () => {
      const error = new NetworkError()
      
      expect(error.message).toBe('Network error occurred')
      expect(error.name).toBe('NetworkError')
    })
  })

  describe('AuthenticationError', () => {
    it('creates authentication error', () => {
      const error = new AuthenticationError('Session expired')
      
      expect(error.message).toBe('Session expired')
      expect(error.name).toBe('AuthenticationError')
    })
  })

  describe('AuthorizationError', () => {
    it('creates authorization error', () => {
      const error = new AuthorizationError('Access denied')
      
      expect(error.message).toBe('Access denied')
      expect(error.name).toBe('AuthorizationError')
    })
  })
})

describe('ErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('handleApiError', () => {
    it('handles ApiError correctly', () => {
      const error = new ApiError('API failed', 500)
      const result = ErrorHandler.handleApiError(error)
      
      expect(result.message).toBe('API failed')
      expect(result.shouldRetry).toBe(true) // 5xx errors should retry
    })

    it('handles client errors without retry', () => {
      const error = new ApiError('Bad request', 400)
      const result = ErrorHandler.handleApiError(error)
      
      expect(result.message).toBe('Bad request')
      expect(result.shouldRetry).toBe(false) // 4xx errors should not retry
    })

    it('handles NetworkError with retry', () => {
      const error = new NetworkError()
      const result = ErrorHandler.handleApiError(error)
      
      expect(result.message).toBe('Network connection failed. Please check your internet connection.')
      expect(result.shouldRetry).toBe(true)
    })

    it('handles AuthenticationError without retry', () => {
      const error = new AuthenticationError()
      const result = ErrorHandler.handleApiError(error)
      
      expect(result.message).toBe('Your session has expired. Please log in again.')
      expect(result.shouldRetry).toBe(false)
    })

    it('handles ValidationErrorClass with first error message', () => {
      const errors = [
        { field: 'email', message: 'Invalid email', value: 'test' },
        { field: 'password', message: 'Too short', value: 'pw' },
      ]
      const error = new ValidationErrorClass('Validation failed', errors)
      const result = ErrorHandler.handleApiError(error)
      
      expect(result.message).toBe('email: Invalid email')
      expect(result.shouldRetry).toBe(false)
    })

    it('handles generic Error', () => {
      const error = new Error('Generic error')
      const result = ErrorHandler.handleApiError(error)
      
      expect(result.message).toBe('Generic error')
      expect(result.shouldRetry).toBe(false)
    })

    it('handles unknown error types', () => {
      const error = 'String error'
      const result = ErrorHandler.handleApiError(error)
      
      expect(result.message).toBe('An unexpected error occurred')
      expect(result.shouldRetry).toBe(false)
    })
  })

  describe('createErrorResponse', () => {
    it('creates response for ApiError', () => {
      const error = new ApiError('API error', 404)
      const response = ErrorHandler.createErrorResponse(error)
      
      expect(response).toEqual({
        error: 'API error',
        success: false,
        statusCode: 404,
      })
    })

    it('creates response for ValidationErrorClass', () => {
      const errors = [{ field: 'test', message: 'Test error', value: 'test' }]
      const error = new ValidationErrorClass('Validation failed', errors)
      const response = ErrorHandler.createErrorResponse(error)
      
      expect(response).toEqual({
        error: 'Validation failed',
        success: false,
        statusCode: 400,
      })
    })

    it('creates generic error response', () => {
      const error = new Error('Generic error')
      const response = ErrorHandler.createErrorResponse(error)
      
      expect(response).toEqual({
        error: 'Internal server error',
        success: false,
        statusCode: 500,
      })
    })
  })

  describe('retryWithBackoff', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('succeeds on first attempt', async () => {
      const mockFn = jest.fn().mockResolvedValue('success')
      
      const result = await ErrorHandler.retryWithBackoff(mockFn, 3, 1000)
      
      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('retries on failure and eventually succeeds', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValue('success')
      
      const promise = ErrorHandler.retryWithBackoff(mockFn, 3, 1000)
      
      // Fast-forward timers for retries
      jest.runAllTimers()
      
      const result = await promise
      
      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(3)
    })

    it('does not retry authentication errors', async () => {
      const mockFn = jest.fn().mockRejectedValue(new AuthenticationError())
      
      await expect(ErrorHandler.retryWithBackoff(mockFn, 3, 1000)).rejects.toThrow(AuthenticationError)
      
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('does not retry validation errors', async () => {
      const errors = [{ field: 'test', message: 'Test error', value: 'test' }]
      const mockFn = jest.fn().mockRejectedValue(new ValidationErrorClass('Validation failed', errors))
      
      await expect(ErrorHandler.retryWithBackoff(mockFn, 3, 1000)).rejects.toThrow(ValidationErrorClass)
      
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('exhausts retries and throws last error', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Persistent failure'))
      
      const promise = ErrorHandler.retryWithBackoff(mockFn, 2, 1000)
      
      jest.runAllTimers()
      
      await expect(promise).rejects.toThrow('Persistent failure')
      expect(mockFn).toHaveBeenCalledTimes(3) // Initial + 2 retries
    })
  })

  describe('validateRequired', () => {
    it('validates required fields successfully', () => {
      const data = { name: 'John', email: 'john@example.com' }
      const requiredFields = ['name', 'email']
      
      const errors = ErrorHandler.validateRequired(data, requiredFields)
      
      expect(errors).toEqual([])
    })

    it('returns errors for missing required fields', () => {
      const data = { name: 'John' }
      const requiredFields = ['name', 'email', 'phone']
      
      const errors = ErrorHandler.validateRequired(data, requiredFields)
      
      expect(errors).toHaveLength(2)
      expect(errors[0]).toEqual({
        field: 'email',
        message: 'This field is required',
        value: undefined,
      })
      expect(errors[1]).toEqual({
        field: 'phone',
        message: 'This field is required',
        value: undefined,
      })
    })

    it('treats empty strings as missing', () => {
      const data = { name: '', email: null }
      const requiredFields = ['name', 'email']
      
      const errors = ErrorHandler.validateRequired(data, requiredFields)
      
      expect(errors).toHaveLength(2)
    })
  })

  describe('safeJsonParse', () => {
    it('parses valid JSON', () => {
      const jsonString = '{"name": "John", "age": 30}'
      const result = ErrorHandler.safeJsonParse(jsonString, {})
      
      expect(result).toEqual({ name: 'John', age: 30 })
    })

    it('returns default value for invalid JSON', () => {
      const invalidJson = '{"name": John}' // Missing quotes
      const defaultValue = { error: 'Invalid JSON' }
      const result = ErrorHandler.safeJsonParse(invalidJson, defaultValue)
      
      expect(result).toEqual(defaultValue)
    })
  })

  describe('sanitizeErrorMessage', () => {
    it('removes sensitive information', () => {
      const message = 'Database error: password=secret123, token=abc123def'
      const sanitized = ErrorHandler.sanitizeErrorMessage(message)
      
      expect(sanitized).toBe('Database error: [REDACTED], [REDACTED]')
    })

    it('removes potential ID numbers', () => {
      const message = 'User 123456 not found'
      const sanitized = ErrorHandler.sanitizeErrorMessage(message)
      
      expect(sanitized).toBe('User [REDACTED] not found')
    })

    it('handles empty or normal messages', () => {
      expect(ErrorHandler.sanitizeErrorMessage('')).toBe('')
      expect(ErrorHandler.sanitizeErrorMessage('Normal error message')).toBe('Normal error message')
    })
  })

  describe('logError', () => {
    it('logs error with context', async () => {
      const { Logger } = require('../logger')
      const error = new Error('Test error')
      const context = {
        user: 'testUser',
        action: 'testAction',
        component: 'TestComponent',
      }
      
      await ErrorHandler.logError(error, context)
      
      expect(Logger.systemError).toHaveBeenCalledWith(
        'testUser',
        'Test error',
        'Component: TestComponent, Action: testAction'
      )
    })

    it('handles missing context gracefully', async () => {
      const { Logger } = require('../logger')
      const error = new Error('Test error')
      
      await ErrorHandler.logError(error, {})
      
      expect(Logger.systemError).toHaveBeenCalledWith(
        'Unknown',
        'Test error',
        ''
      )
    })
  })

  describe('wrapAsync', () => {
    it('wraps async function and logs errors', async () => {
      const { Logger } = require('../logger')
      const mockFn = jest.fn().mockRejectedValue(new Error('Async error'))
      const context = { component: 'TestComponent' }
      
      const wrappedFn = ErrorHandler.wrapAsync(mockFn, context)
      
      await expect(wrappedFn()).rejects.toThrow('Async error')
      expect(Logger.systemError).toHaveBeenCalled()
    })

    it('passes through successful results', async () => {
      const mockFn = jest.fn().mockResolvedValue('success')
      const wrappedFn = ErrorHandler.wrapAsync(mockFn)
      
      const result = await wrappedFn()
      
      expect(result).toBe('success')
    })
  })
})
