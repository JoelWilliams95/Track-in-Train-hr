# Track-in-Train HR Management System

A comprehensive Human Resources Management System built with Next.js for transportation companies. Features personnel management, transport route optimization, and employee lifecycle tracking.

## 🚀 Features

- **Personnel Management**: Complete employee lifecycle from recruitment to departure
- **Transport Optimization**: Route planning and real-time tracking
- **User Management**: Role-based access control with granular permissions
- **Real-time Notifications**: Instant updates and tagging system
- **Comprehensive Logging**: Complete audit trail of all system activities
- **Responsive Design**: Mobile-first design with dark/light mode support
- **Type Safety**: Full TypeScript implementation with runtime validation
- **Error Handling**: Global error boundaries with proper user feedback

## 🛠️ Tech Stack

- **Frontend**: Next.js 15.4.2, React 19.1.0, TypeScript 5
- **Styling**: Tailwind CSS 4 with custom components
- **Database**: Dual support (MongoDB & JSON files)
- **Validation**: Zod for runtime schema validation
- **Maps**: Leaflet.js and Google Maps integration
- **State Management**: React Context with custom hooks
- **Error Handling**: Global error boundaries and centralized error handling

## 📋 Prerequisites

- Node.js 18.18+ (check with `node --version`)
- npm, yarn, pnpm, or bun
- MongoDB (optional - can use JSON file storage)
- Git

## ⚡ Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd track-n-train-hr
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Database Configuration
DATABASE_TYPE=json  # or "mongodb"
MONGODB_URI=mongodb://localhost:27017/track-in-train-hr  # if using MongoDB

# Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Google Maps (optional)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here

# Security
JWT_SECRET=your-super-secure-jwt-secret
ENCRYPTION_KEY=your-32-character-encryption-key
```

### 4. Database Setup

#### Option A: JSON File Storage (Default)
No additional setup required. Data files will be created automatically in the `data/` directory.

#### Option B: MongoDB
1. Install MongoDB locally or use MongoDB Atlas
2. Update `DATABASE_TYPE=mongodb` in your `.env.local`
3. Set your MongoDB connection string in `MONGODB_URI`

### 5. Initialize Data (Optional)

Run the setup script to create sample data:

```bash
npm run setup
# This creates:
# - Default admin user (admin@company.com / Admin123!)
# - Sample personnel records
# - Zone configurations
```

### 6. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── login/         # Authentication
│   │   ├── users/         # User management
│   │   ├── personnel-records/ # Personnel CRUD
│   │   └── notifications/ # Notification system
│   ├── login/             # Login page
│   ├── profiles/          # Personnel management UI
│   ├── dashboard/         # Main dashboard
│   └── transport-routes/  # Transport features
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── ErrorBoundary.tsx # Global error handling
│   └── [feature-components]
├── lib/                   # Utility libraries
│   ├── error-handler.ts  # Centralized error handling
│   ├── validations.ts    # Zod schemas
│   ├── api-middleware.ts # API middleware
│   └── utils.ts          # Helper functions
├── hooks/                # Custom React hooks
│   ├── useAsync.ts       # Async operations
│   └── [other-hooks]
├── types/                # TypeScript type definitions
├── services/             # Business logic services
└── contexts/             # React contexts
```

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run typecheck    # TypeScript type checking
npm run format       # Format code with Prettier
npm run check        # Run lint + typecheck

# Testing
npm run test         # Run tests (if configured)
npm run test:watch   # Run tests in watch mode

# Database
npm run migrate      # Run database migrations
npm run seed         # Seed database with sample data
```

## 🔐 Default Login Credentials

After running the setup script:

- **Email**: admin@company.com
- **Password**: Admin123!
- **Role**: SuperAdmin

> ⚠️ **Important**: Change the default password immediately after first login!

## 🏗️ Key Improvements Implemented

### 1. **Error Handling & Resilience**
- Global error boundaries catch and display user-friendly error messages
- Centralized error handling with proper logging
- Retry mechanisms for failed operations
- Network error detection and handling

### 2. **Type Safety & Validation**
- Complete TypeScript implementation
- Runtime validation with Zod schemas
- Consistent type definitions across the application
- Form validation with proper error messages

### 3. **Performance Optimization**
- Custom async hooks with debouncing and caching
- Loading states and skeleton components
- Proper React.memo and useMemo usage
- Efficient re-render prevention

### 4. **Code Quality & Architecture**
- Modular component architecture
- Separation of concerns
- Enhanced ESLint configuration
- Proper error boundaries and fallbacks

### 5. **Developer Experience**
- Comprehensive TypeScript types
- Better development tooling
- Improved debugging capabilities
- Consistent code formatting

## 🚦 Testing

### API Testing

```bash
# Test API endpoints
node test-api-endpoints.js

# Test specific features
node test-comments-api.js
node test-route-following.js
```

### Manual Testing Checklist

- [ ] User authentication and authorization
- [ ] Personnel record CRUD operations
- [ ] Comment system with tagging
- [ ] Notification system
- [ ] Transport route optimization
- [ ] Mobile responsiveness
- [ ] Dark/light mode switching

## 🔒 Security Features

- **Authentication**: Secure session-based authentication
- **Authorization**: Role-based access control (RBAC)
- **Input Validation**: Runtime schema validation
- **Rate Limiting**: API endpoint protection
- **Error Sanitization**: Sensitive data removal from error messages
- **CSRF Protection**: Cross-site request forgery prevention
- **Secure Headers**: Security headers in Next.js configuration

## 📱 Mobile Support

- Responsive design for all screen sizes
- Touch-optimized interface
- Mobile-specific components
- Progressive Web App (PWA) ready

## 🌐 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style Guidelines

- Follow the existing ESLint configuration
- Use TypeScript for all new code
- Write descriptive commit messages
- Include tests for new features
- Update documentation as needed

## 📊 Performance Monitoring

- Built-in performance monitoring
- Error tracking and logging
- User activity analytics
- API response time tracking

## 🆘 Troubleshooting

### Common Issues

**1. Port already in use**
```bash
# Kill process on port 3000
npx kill-port 3000
# or use a different port
npm run dev -- -p 3001
```

**2. Database connection issues**
- Check your `.env.local` configuration
- Ensure MongoDB is running (if using MongoDB)
- Verify database credentials

**3. Build errors**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

**4. TypeScript errors**
```bash
# Run type checking
npm run typecheck
```

### Getting Help

1. Check the [Technical Specifications](./Track-in-Train-HR-Specifications.md)
2. Review the API documentation
3. Check existing issues in the repository
4. Create a new issue with detailed information

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- 📧 Email: support@track-in-train.com
- 📚 Documentation: [docs.track-in-train.com](https://docs.track-in-train.com)
- 🐛 Issues: [GitHub Issues](https://github.com/your-repo/issues)

---

**Built with ❤️ for modern HR management**
