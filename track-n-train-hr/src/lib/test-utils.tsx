import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ModalProvider } from '@/contexts/ModalContext'
import { ThemeProvider } from 'next-themes'
import { PersonnelRecord, User, UserRole, PersonnelStatus } from '@/types'

// Custom render function that includes providers
interface AllTheProvidersProps {
  children: React.ReactNode
}

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <ModalProvider>
        {children}
      </ModalProvider>
    </ThemeProvider>
  )
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  wrapper?: React.ComponentType<{ children: React.ReactNode }>
}

const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { wrapper = AllTheProviders, ...renderOptions } = options
  
  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper, ...renderOptions }),
  }
}

// Test data factories
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  fullName: 'John Doe',
  email: 'john@example.com',
  role: 'HR' as UserRole,
  zone: 'Textile',
  position: 'HR Manager',
  phoneNumber: '+1234567890',
  address: '123 Main St',
  isActive: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
})

export const createMockPersonnelRecord = (overrides: Partial<PersonnelRecord> = {}): PersonnelRecord => ({
  id: 'personnel-1',
  fullName: 'Jane Smith',
  cin: 'CIN123456',
  address: '456 Oak Avenue',
  zone: 'Textile',
  subZone: 'Production',
  poste: 'Operator',
  trajectoryCode: 'T001',
  phoneNumber: '+1234567891',
  status: 'Employed' as PersonnelStatus,
  photoUrl: '/photos/jane-smith.jpg',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  createdBy: 'admin',
  comments: [],
  recruitDate: '2024-01-01',
  technicalTrainingCompleted: true,
  theoreticalTrainingCompleted: true,
  ...overrides,
})

export const createMockComment = (overrides = {}) => ({
  id: 'comment-1',
  author: 'John Doe',
  text: 'This is a test comment',
  date: '2024-01-01T00:00:00.000Z',
  mentionedUsers: [],
  ...overrides,
})

// Mock API responses
export const mockApiResponse = <T>(data: T, success = true) => ({
  success,
  data,
  message: success ? 'Operation completed successfully' : 'Operation failed',
})

export const mockApiError = (message = 'API Error', statusCode = 500) => ({
  success: false,
  error: message,
  statusCode,
})

// Mock fetch responses
export const mockFetchResponse = <T>(data: T, status = 200) => {
  const mockResponse = {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(data),
    text: jest.fn().mockResolvedValue(JSON.stringify(data)),
    headers: new Headers(),
    redirected: false,
    statusText: status === 200 ? 'OK' : 'Error',
    type: 'basic' as ResponseType,
    url: 'http://localhost:3000/api/test',
    clone: jest.fn(),
    body: null,
    bodyUsed: false,
    arrayBuffer: jest.fn(),
    blob: jest.fn(),
    formData: jest.fn(),
  }
  
  return mockResponse as unknown as Response
}

// Wait utilities
export const waitForLoadingToFinish = () => {
  return new Promise(resolve => setTimeout(resolve, 0))
}

export const waitForApiCall = (delay = 100) => {
  return new Promise(resolve => setTimeout(resolve, delay))
}

// Form helpers
export const fillForm = async (user: ReturnType<typeof userEvent.setup>, fields: Record<string, string>) => {
  for (const [fieldName, value] of Object.entries(fields)) {
    const field = document.querySelector(`[name="${fieldName}"]`) as HTMLInputElement
    if (field) {
      await user.clear(field)
      await user.type(field, value)
    }
  }
}

// Event helpers
export const triggerEvent = (element: Element, eventType: string, eventInit?: EventInit) => {
  const event = new Event(eventType, eventInit)
  element.dispatchEvent(event)
}

// Local storage helpers
export const mockLocalStorage = () => {
  const store: Record<string, string> = {}
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key])
    }),
  }
}

// Cookie helpers
export const mockCookies = (initialCookies: Record<string, string> = {}) => {
  const cookies = { ...initialCookies }
  
  return {
    get: jest.fn((name: string) => ({
      value: cookies[name] || '',
      name,
    })),
    set: jest.fn((name: string, value: string) => {
      cookies[name] = value
    }),
    delete: jest.fn((name: string) => {
      delete cookies[name]
    }),
  }
}

// Error boundary test helper
export const ErrorBoundaryTestComponent = ({ shouldError = false }: { shouldError?: boolean }) => {
  if (shouldError) {
    throw new Error('Test error')
  }
  return <div>Test component</div>
}

// Async component test helper
export const AsyncTestComponent = ({ 
  loading = false, 
  error = null 
}: { 
  loading?: boolean
  error?: string | null 
}) => {
  if (loading) {
    return <div role="status">Loading...</div>
  }
  
  if (error) {
    return <div role="alert">{error}</div>
  }
  
  return <div>Data loaded</div>
}

// Mock router
export const mockRouter = (overrides = {}) => ({
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  ...overrides,
})

// Mock search params
export const mockSearchParams = (params: Record<string, string> = {}) => ({
  get: jest.fn((key: string) => params[key] || null),
  has: jest.fn((key: string) => key in params),
  getAll: jest.fn((key: string) => params[key] ? [params[key]] : []),
  keys: jest.fn(() => Object.keys(params)[Symbol.iterator]()),
  values: jest.fn(() => Object.values(params)[Symbol.iterator]()),
  entries: jest.fn(() => Object.entries(params)[Symbol.iterator]()),
  forEach: jest.fn(),
  toString: jest.fn(() => new URLSearchParams(params).toString()),
})

// Test ID helpers
export const getTestId = (id: string) => `[data-testid="${id}"]`

// Accessibility helpers
export const expectToBeAccessible = async (container: HTMLElement) => {
  // Basic accessibility checks
  const buttons = container.querySelectorAll('button')
  const inputs = container.querySelectorAll('input')
  const links = container.querySelectorAll('a')
  
  // Check buttons have accessible names
  buttons.forEach(button => {
    expect(button).toHaveAttribute('aria-label')
    expect(button.getAttribute('aria-label')).toBeTruthy()
  })
  
  // Check inputs have labels
  inputs.forEach(input => {
    const hasLabel = input.getAttribute('aria-label') || 
                    input.getAttribute('aria-labelledby') ||
                    container.querySelector(`label[for="${input.id}"]`)
    expect(hasLabel).toBeTruthy()
  })
  
  // Check links have accessible names
  links.forEach(link => {
    const hasAccessibleName = link.textContent?.trim() || 
                             link.getAttribute('aria-label') ||
                             link.getAttribute('title')
    expect(hasAccessibleName).toBeTruthy()
  })
}

// Performance test helpers
export const measureRenderTime = async (renderFn: () => void) => {
  const start = performance.now()
  renderFn()
  const end = performance.now()
  return end - start
}

// Custom matchers for Jest
expect.extend({
  toBeVisible(received) {
    const element = received as HTMLElement
    const isVisible = element.offsetWidth > 0 && 
                     element.offsetHeight > 0 && 
                     getComputedStyle(element).visibility !== 'hidden'
    
    if (isVisible) {
      return {
        message: () => `expected element to not be visible`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected element to be visible`,
        pass: false,
      }
    }
  },
  
  toHaveLoadingState(received) {
    const element = received as HTMLElement
    const hasLoadingIndicator = element.querySelector('[role="status"]') ||
                               element.querySelector('.animate-spin') ||
                               element.textContent?.includes('Loading')
    
    if (hasLoadingIndicator) {
      return {
        message: () => `expected element to not have loading state`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected element to have loading state`,
        pass: false,
      }
    }
  },
})

// Re-export testing library utilities
export * from '@testing-library/react'
export { customRender as render }
export { userEvent }
