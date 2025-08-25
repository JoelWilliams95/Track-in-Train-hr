// Core entity types
export interface PersonnelRecord {
  id: string;
  fullName: string;
  cin: string;
  address: string;
  zone: string;
  subZone?: string;
  poste: string;
  trajectoryCode?: string;
  phoneNumber?: string;
  status: PersonnelStatus;
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  comments: Comment[];
  
  // Recruitment lifecycle fields
  dateOfIntegration?: string;
  recruitDate?: string;
  departureDate?: string;
  departureReason?: string;
  formationStatus?: string;
  
  // Training fields
  technicalTrainingCompleted?: boolean;
  theoreticalTrainingCompleted?: boolean;
  testDay?: string;
  testResult?: TestResult;
  validationDate?: string;
  retestScheduled?: string;
  testHistory?: TestHistoryEntry[];
  retestResult?: TestResult;
}

export type PersonnelStatus = 
  | 'Recruit' 
  | 'In-Training' 
  | 'Waiting for test' 
  | 'Employed' 
  | 'Departed';

export type TestResult = 'Pass' | 'Fail but Promising' | 'Fail';

export interface TestHistoryEntry {
  date: string;
  result: string;
}

export interface Comment {
  id?: string;
  author: string;
  text: string;
  date: string;
  mentionedUsers?: string[];
}

// User types
export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  zone: string;
  position?: string;
  phoneNumber?: string;
  address?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'SuperAdmin' | 'Admin' | 'HR' | 'Manager' | 'TeamLead' | 'User';

export interface UserPermissions {
  canAddUsers: boolean;
  canAddProfiles: boolean;
  canViewAllProfiles: boolean;
  canManageSystem: boolean;
}

export interface UserSession {
  userName: string;
  userEmail: string;
  userRole: UserRole;
  userZone: string;
  permissions: UserPermissions;
  isAuthenticated: boolean;
}

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form types
export interface PersonnelFormData {
  fullName: string;
  cin: string;
  address: string;
  zone: string;
  subZone?: string;
  poste: string;
  trajectoryCode?: string;
  phoneNumber?: string;
  status: PersonnelStatus;
  recruitDate?: string;
}

export interface UserFormData {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  zone: string;
  position?: string;
  phoneNumber?: string;
  address?: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

// Notification types
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  targetUser: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

export type NotificationType = 
  | 'tag' 
  | 'profile_added' 
  | 'status_change' 
  | 'comment' 
  | 'system' 
  | 'transport_delay';

// Log types
export interface LogEntry {
  id: string;
  user: string;
  action: string;
  details: string;
  target?: string;
  category: LogCategory;
  severity: LogSeverity;
  timestamp: string;
  ipAddress?: string;
}

export type LogCategory = 
  | 'CREATE' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'VIEW' 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'SEARCH' 
  | 'FILTER' 
  | 'EXPORT' 
  | 'OTHER';

export type LogSeverity = 'INFO' | 'WARNING' | 'ERROR';

// Transport types
export interface TransportRoute {
  id: string;
  name: string;
  startPoint: Location;
  endPoint: Location;
  pickupPoints: Location[];
  estimatedDuration: number; // in minutes
  distance: number; // in kilometers
  isActive: boolean;
  assignedPersonnel: string[];
}

export interface Location {
  id: string;
  lat: number;
  lng: number;
  address: string;
  type: 'pickup' | 'destination' | 'waypoint';
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  capacity: number;
  type: 'bus' | 'van' | 'car';
  isActive: boolean;
  currentLocation?: Location;
}

// Search and filter types
export interface SearchFilters {
  searchTerm?: string;
  status?: PersonnelStatus[];
  zone?: string[];
  poste?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface SortOptions {
  field: keyof PersonnelRecord;
  direction: 'asc' | 'desc';
}

// Component prop types
export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Environment types
export interface AppConfig {
  isDevelopment: boolean;
  isProduction: boolean;
  apiBaseUrl: string;
  databaseType: 'json' | 'mongodb';
  enableLogging: boolean;
  maxFileSize: number;
  allowedFileTypes: string[];
}

// Error types
export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  context?: Record<string, unknown>;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

// Hook types
export interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: unknown[]) => Promise<void>;
  reset: () => void;
}
