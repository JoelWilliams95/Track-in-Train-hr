# Track-in-Train HR Management System
## Technical Specifications Document

---

### Document Information
- **Project**: Track-in-Train HR Management System
- **Version**: 1.0
- **Date**: December 2024
- **Author**: Development Team
- **Document Type**: Technical Specifications

---

## Table of Contents

1. [Introduction](#introduction)
2. [System Overview](#system-overview)
3. [Functional Requirements](#functional-requirements)
4. [Technical Architecture](#technical-architecture)
5. [User Interface Specifications](#user-interface-specifications)
6. [Database Design](#database-design)
7. [Security Requirements](#security-requirements)
8. [Performance Requirements](#performance-requirements)
9. [Integration Requirements](#integration-requirements)
10. [Testing Strategy](#testing-strategy)
11. [Deployment Guidelines](#deployment-guidelines)
12. [Maintenance and Support](#maintenance-and-support)

---

## 1. Introduction

### 1.1 Purpose
The Track-in-Train HR Management System is a comprehensive web-based application designed to streamline human resource management processes for transportation companies. The system provides tools for personnel management, transport route optimization, and employee lifecycle tracking.

### 1.2 Scope
This document outlines the technical specifications, functional requirements, and implementation guidelines for the Track-in-Train HR system, covering:
- Personnel management and tracking
- Transport route optimization
- User authentication and authorization
- Real-time notifications
- Reporting and analytics

### 1.3 Definitions and Acronyms
- **HR**: Human Resources
- **RBAC**: Role-Based Access Control
- **SSE**: Server-Sent Events
- **API**: Application Programming Interface
- **UI/UX**: User Interface/User Experience

---

## 2. System Overview

### 2.1 System Architecture
The Track-in-Train HR system follows a modern web application architecture:
- **Frontend**: Next.js 15.4.2 with React 19.1.0
- **Backend**: Node.js with Next.js API routes
- **Database**: Dual support (MongoDB and JSON files)
- **Styling**: Tailwind CSS with custom components
- **Maps Integration**: Leaflet.js and Google Maps

### 2.2 Key Features
1. **Personnel Management**
   - Employee profile creation and management
   - Status tracking (Recruit → Testing → Employed → Departed)
   - Photo management and document storage
   - Zone-based organization

2. **Transport Optimization**
   - Route planning and optimization
   - Employee transport coordination
   - Real-time GPS tracking
   - Performance analytics

3. **User Management**
   - Role-based access control
   - Secure authentication
   - Activity logging and audit trails
   - Real-time notifications

---

## 3. Functional Requirements

### 3.1 User Roles and Permissions

#### 3.1.1 SuperAdmin
- Full system access
- User management capabilities
- System configuration
- Data export/import
- Advanced reporting

#### 3.1.2 HR Manager
- Personnel management
- Recruitment tracking
- Employee status updates
- Basic reporting

#### 3.1.3 Team Lead
- Team member oversight
- Status updates for assigned personnel
- Limited reporting access

#### 3.1.4 Manager
- Department-level access
- Employee monitoring
- Performance tracking

#### 3.1.5 User
- Basic profile viewing
- Limited data access
- Personal information updates

### 3.2 Personnel Management Functions

#### 3.2.1 Profile Creation
- **Input Fields**:
  - Full Name (required, letters and spaces only)
  - CIN (required, alphanumeric)
  - Address (required, up to 200 characters)
  - Zone and Sub-zone selection
  - Position/Role assignment
  - Trajectory code (transport route)
  - Phone number (international format)
  - Profile photo upload

#### 3.2.2 Status Tracking
- **Status Flow**: Recruit → Waiting for Test → Employed → Departed
- **Status Management**: Authorized users can update employee status
- **History Tracking**: Complete audit trail of status changes

#### 3.2.3 Search and Filtering
- Multi-criteria search functionality
- Real-time filtering by status, zone, position
- Advanced search with multiple parameters
- Export filtered results

---

## 4. Technical Architecture

### 4.1 Frontend Architecture
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── login/             # Authentication
│   ├── profiles/          # Personnel management
│   └── transport-routes/  # Transport features
├── components/            # React components
├── lib/                   # Utility libraries
├── models/               # Data models
├── services/             # Business logic
└── hooks/                # Custom React hooks
```

### 4.2 Database Schema

#### 4.2.1 PersonnelRecord
```typescript
interface PersonnelRecord {
  id: string;
  fullName: string;
  cin: string;
  address: string;
  zone: string;
  subZone?: string;
  poste: string;
  trajectoryCode?: string;
  phoneNumber?: string;
  status: 'Recruit' | 'Waiting for Test' | 'Employed' | 'Departed';
  photoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  comments: Comment[];
}
```

#### 4.2.2 User
```typescript
interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: 'SuperAdmin' | 'HR' | 'Manager' | 'TeamLead' | 'User';
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
}
```

### 4.3 API Endpoints

#### 4.3.1 Authentication
- `POST /api/auth/login` - User authentication
- `POST /api/auth/logout` - User logout
- `GET /api/auth/session` - Session validation

#### 4.3.2 Personnel Management
- `GET /api/profiles` - Retrieve personnel records
- `POST /api/profiles` - Create new personnel record
- `PUT /api/profiles/[id]` - Update personnel record
- `DELETE /api/profiles/[id]` - Delete personnel record

#### 4.3.3 User Management
- `GET /api/users` - Retrieve users (SuperAdmin only)
- `POST /api/users` - Create new user
- `PUT /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user

---

## 5. User Interface Specifications

### 5.1 Design Principles
- **Responsive Design**: Mobile-first approach
- **Accessibility**: WCAG 2.1 AA compliance
- **Dark/Light Mode**: User preference support
- **Intuitive Navigation**: Clear information hierarchy

### 5.2 Key Components

#### 5.2.1 Profiles Dashboard
- Search and filter bar with real-time results
- Data table with sortable columns
- Floating action button for adding profiles
- Modal-based forms for data entry
- Pagination for large datasets

#### 5.2.2 Transport Dashboard
- Interactive map with route visualization
- Employee location tracking
- Route optimization tools
- Performance metrics display

#### 5.2.3 Notification System
- Real-time notifications using SSE
- Toast notifications for user actions
- System alerts and warnings
- Notification history and management

---

## 6. Security Requirements

### 6.1 Authentication and Authorization
- Secure password hashing using bcrypt
- Session-based authentication with secure cookies
- Role-based access control (RBAC)
- Session timeout and management

### 6.2 Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection
- Secure file upload handling

### 6.3 Privacy and Compliance
- Personal data encryption
- Audit logging for all data access
- Data retention policies
- GDPR compliance considerations

---

## 7. Performance Requirements

### 7.1 Response Time
- Page load time: < 3 seconds
- API response time: < 500ms
- Search results: < 1 second
- Real-time updates: < 100ms

### 7.2 Scalability
- Support for 1000+ concurrent users
- Database optimization for large datasets
- Efficient caching strategies
- Load balancing capabilities

### 7.3 Availability
- 99.9% uptime requirement
- Automated backup systems
- Disaster recovery procedures
- Health monitoring and alerting

---

## 8. Testing Strategy

### 8.1 Unit Testing
- Component-level testing with Jest
- API endpoint testing
- Database operation testing
- Utility function testing

### 8.2 Integration Testing
- End-to-end user workflows
- API integration testing
- Database integration testing
- Third-party service integration

### 8.3 User Acceptance Testing
- Role-based testing scenarios
- Performance testing
- Security testing
- Accessibility testing

---

## 9. Deployment Guidelines

### 9.1 Environment Setup
- Development environment configuration
- Staging environment for testing
- Production environment specifications
- Environment variable management

### 9.2 Deployment Process
- Automated CI/CD pipeline
- Database migration procedures
- Static asset optimization
- Health checks and monitoring

---

## 10. Maintenance and Support

### 10.1 Regular Maintenance
- Database optimization
- Security updates
- Performance monitoring
- Backup verification

### 10.2 Support Procedures
- Issue tracking and resolution
- User training and documentation
- System updates and upgrades
- Emergency response procedures

---

## Appendices

### Appendix A: Zone Configuration
Predefined zones and sub-zones for employee organization

### Appendix B: API Documentation
Detailed API endpoint documentation with examples

### Appendix C: Database Schema
Complete database schema with relationships

### Appendix D: Security Checklist
Comprehensive security implementation checklist

---

**Document Control**
- Last Updated: December 2024
- Next Review: March 2025
- Approved By: Project Manager
- Distribution: Development Team, Stakeholders
