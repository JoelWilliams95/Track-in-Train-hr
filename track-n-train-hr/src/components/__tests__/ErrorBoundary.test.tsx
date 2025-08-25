import React from 'react'
import { render, screen } from '@/lib/test-utils'
import ErrorBoundary from '../ErrorBoundary'
import { ErrorBoundaryTestComponent } from '@/lib/test-utils'

// Mock the logger
jest.mock('@/lib/logger', () => ({
  Logger: {
    systemError: jest.fn(),
  },
}))

describe('ErrorBoundary', () => {
  // Suppress console.error in tests since we're intentionally throwing errors
  const originalConsoleError = console.error
  beforeAll(() => {
    console.error = jest.fn()
  })

  afterAll(() => {
    console.error = originalConsoleError
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ErrorBoundaryTestComponent shouldError={false} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Test component')).toBeInTheDocument()
  })

  it('catches errors and displays fallback UI', () => {
    render(
      <ErrorBoundary>
        <ErrorBoundaryTestComponent shouldError={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText(/We're sorry, but something unexpected happened/)).toBeInTheDocument()
  })

  it('displays error message in development mode', () => {
    const originalNodeEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    render(
      <ErrorBoundary>
        <ErrorBoundaryTestComponent shouldError={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Test error')).toBeInTheDocument()

    process.env.NODE_ENV = originalNodeEnv
  })

  it('provides try again button that resets the error', async () => {
    const { user } = render(
      <ErrorBoundary>
        <ErrorBoundaryTestComponent shouldError={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    
    const tryAgainButton = screen.getByRole('button', { name: /try again/i })
    await user.click(tryAgainButton)

    // Error should be cleared and children should render normally
    expect(screen.getByText('Test component')).toBeInTheDocument()
  })

  it('provides reload page button', async () => {
    // Mock window.location.reload
    const mockReload = jest.fn()
    Object.defineProperty(window, 'location', {
      value: {
        reload: mockReload,
      },
      writable: true,
    })

    const { user } = render(
      <ErrorBoundary>
        <ErrorBoundaryTestComponent shouldError={true} />
      </ErrorBoundary>
    )

    const reloadButton = screen.getByRole('button', { name: /reload page/i })
    await user.click(reloadButton)

    expect(mockReload).toHaveBeenCalled()
  })

  it('uses custom fallback component when provided', () => {
    const CustomFallback = ({ error, reset }: { error: Error; reset: () => void }) => (
      <div>
        <h2>Custom Error UI</h2>
        <p>Error: {error.message}</p>
        <button onClick={reset}>Custom Reset</button>
      </div>
    )

    render(
      <ErrorBoundary fallback={CustomFallback}>
        <ErrorBoundaryTestComponent shouldError={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Custom Error UI')).toBeInTheDocument()
    expect(screen.getByText('Error: Test error')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /custom reset/i })).toBeInTheDocument()
  })

  it('logs errors when they occur', () => {
    const { Logger } = require('@/lib/logger')

    render(
      <ErrorBoundary>
        <ErrorBoundaryTestComponent shouldError={true} />
      </ErrorBoundary>
    )

    expect(Logger.systemError).toHaveBeenCalledWith(
      'System',
      'Test error',
      expect.stringContaining('Unknown component')
    )
  })

  it('handles errors with component stack information', () => {
    const ComponentWithStack = () => {
      throw new Error('Error with stack')
    }

    const { Logger } = require('@/lib/logger')

    render(
      <ErrorBoundary>
        <ComponentWithStack />
      </ErrorBoundary>
    )

    expect(Logger.systemError).toHaveBeenCalledWith(
      'System',
      'Error with stack',
      expect.any(String)
    )
  })

  it('maintains accessibility standards in error state', () => {
    render(
      <ErrorBoundary>
        <ErrorBoundaryTestComponent shouldError={true} />
      </ErrorBoundary>
    )

    // Check for proper roles and labels
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument()
    
    // Check for semantic HTML structure
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Something went wrong')
  })

  it('works with nested ErrorBoundary components', () => {
    const OuterComponent = () => (
      <ErrorBoundary>
        <div>Outer boundary</div>
        <ErrorBoundary>
          <ErrorBoundaryTestComponent shouldError={true} />
        </ErrorBoundary>
      </ErrorBoundary>
    )

    render(<OuterComponent />)

    // Inner boundary should catch the error
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    // Outer boundary should still show its content
    expect(screen.getByText('Outer boundary')).toBeInTheDocument()
  })
})
