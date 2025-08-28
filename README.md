## Project Overview

Track-in-Train HR Management System is a comprehensive Human Resources Management System built with Next.js for transportation companies. The system features personnel management, transport route optimization, and employee lifecycle tracking with dual database support (MongoDB and JSON files).

**Tech Stack:**
- Frontend: Next.js 15.4.2, React 19.1.0, TypeScript 5
- Styling: Tailwind CSS 4 with custom components
- Database: Dual support (MongoDB & JSON files)
- Maps: Leaflet.js and Google Maps integration
- State Management: React Context with custom hooks
- Validation: Zod for runtime schema validation

## Common Development Commands

### Development Workflow
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run all quality checks
npm run check  # Runs lint + typecheck

# Format code
npm run format
```

### Code Quality
```bash
# Linting
npm run lint

# Type checking
npm run typecheck

# Format code with Prettier
npm run format
```

### Testing
```bash
# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests in CI mode
npm run test:ci
```

### Database & Setup
```bash
# Initialize system with sample data
npm run setup

# Run database migrations
npm run migrate

# Seed database with sample data
npm run seed
```

### Environment Setup
Create `.env.local` with these required variables:
```env
DATABASE_TYPE=json  # or "mongodb"
MONGODB_URI=mongodb://localhost:27017/track-in-train-hr  # if using MongoDB
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
JWT_SECRET=your-super-secure-jwt-secret
ENCRYPTION_KEY=your-32-character-encryption-key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here  # optional
```

### Single Test Execution
```bash
# Run specific test file
npm run test -- --testPathPattern=ErrorBoundary.test.tsx

# Run test with specific pattern
npm run test -- --testNamePattern="should render error"

# Debug tests
npm run test -- --runInBand --no-cache
```

## Architecture Overview

### Core Structure
The application follows Next.js 15 App Router architecture with a clear separation of concerns:

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes (authentication, CRUD operations)
│   ├── login/             # Authentication pages
│   ├── profiles/          # Personnel management UI
│   ├── dashboard/         # Main dashboard
│   └── transport-routes/  # Transport optimization features
├── components/            # React components with UI library
├── lib/                   # Core utilities and configurations
├── models/               # Database schemas and interfaces
├── services/            # Business logic and database services
├── types/               # TypeScript type definitions
├── contexts/            # React contexts for global state
└── hooks/               # Custom React hooks
```

### Database Architecture
The system supports dual database configurations:

**MongoDB Models:**
- `PersonnelRecord`: Employee data with lifecycle tracking
- `User`: System users with role-based permissions
- `Notification`: Real-time notification system
- `Log`: Comprehensive audit logging
- `Comment`: Tagging and commenting system

**Key Interfaces:**
- `IPersonnelRecord`: Full employee lifecycle from recruitment to departure
- `IUser`: User management with roles (SuperAdmin, HR, Manager, TeamLead, User)
- Role-based permissions with granular access control

### Error Handling System
The application implements a comprehensive error handling strategy:

- **Global Error Boundary**: `ErrorBoundary.tsx` catches React errors
- **Centralized Error Handler**: `error-handler.ts` for API errors
- **React Error Hooks**: `useErrorHandler` for component-level error management
- **Logging Integration**: All errors are logged to the system audit trail

### State Management Architecture
- **Modal Context**: Global modal state management preventing multiple modals
- **Theme Provider**: Dark/light mode with user preferences
- **Custom Hooks**: `useAsync`, `useDebounce`, `useModal` for common patterns
- **Form Validation**: Zod schemas with TypeScript integration

### Authentication & Authorization
- **Session-based Authentication**: Secure cookie-based sessions
- **Role-Based Access Control (RBAC)**: 5 user roles with granular permissions
- **API Route Protection**: Middleware-based authentication checks
- **Client-side Protection**: Route guards and conditional rendering

### Real-time Features
- **Server-Sent Events**: Real-time notifications
- **Commenting System**: User tagging and mentions
- **Activity Logging**: Comprehensive audit trail
- **Notification System**: Multi-type notifications with read/unread status

### Transport Optimization System
- **Route Planning**: Leaflet.js and Google Maps integration
- **Employee Assignment**: Automatic route optimization
- **Real-time Tracking**: GPS coordinate tracking
- **Performance Analytics**: Route efficiency metrics

### API Architecture
RESTful API design with consistent response patterns:

```
/api/login                 # Authentication
/api/personnel-records     # Personnel CRUD operations
/api/users                 # User management (SuperAdmin)
/api/notifications         # Notification system
/api/comments              # Commenting and tagging
/api/transport-optimization # Route planning
/api/upload               # File upload handling
```

### Development Patterns

**Component Architecture:**
- Functional components with TypeScript
- Custom hooks for business logic
- Error boundaries for fault tolerance
- Loading states and skeleton components

**Form Handling:**
- Zod schema validation
- Custom validation hooks
- Consistent error messaging
- Auto-saving and draft states

**Data Flow:**
- Service layer for business logic
- Context for global state
- Custom hooks for async operations
- Consistent error handling patterns

## Key Development Notes

### Default Login Credentials
After running `npm run setup`:
- Email: admin@company.com
- Password: Admin123!
- Role: SuperAdmin

### Database Switching
The system can switch between MongoDB and JSON file storage by changing `DATABASE_TYPE` in `.env.local`. JSON mode is useful for development and testing without MongoDB setup.

### Personnel Status Flow
The system enforces a specific employee lifecycle:
Recruit → Waiting for Test → Employed → Departed

### Error Handling Best Practices
- All async operations should use the `useAsync` hook
- Component errors should be wrapped with `ErrorBoundary`
- API errors use centralized `ErrorHandler.handleApiError`
- User-facing errors should be sanitized and user-friendly

### Performance Considerations
- React.memo for expensive components
- useMemo for heavy calculations
- Debounced search and filtering
- Efficient re-render prevention
- Image optimization for profile photos

### Security Implementation
- Input validation with Zod schemas
- Role-based route protection
- Secure file upload handling
- Password hashing with bcrypt
- Session management with secure cookies
- Error message sanitization

### Mobile Responsiveness
The application is built mobile-first with:
- Responsive Tailwind CSS classes
- Touch-optimized interfaces
- Adaptive modal behaviors
- Mobile-specific components

This system emphasizes type safety, error resilience, and maintainable architecture patterns throughout the codebase.
