import { z } from 'zod';
import { PersonnelStatus, UserRole, TestResult, NotificationType } from '@/types';

// Base validation schemas
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email format')
  .max(100, 'Email must be less than 100 characters');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password must be less than 100 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  );

export const phoneSchema = z
  .string()
  .regex(
    /^[\+]?[0-9]{10,15}$/,
    'Phone number must be 10-15 digits and may start with +'
  )
  .optional()
  .or(z.literal(''));

export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must be less than 50 characters')
  .regex(/^[a-zA-Z\s\u00C0-\u024F\u1E00-\u1EFF]+$/, 'Name can only contain letters and spaces');

export const cinSchema = z
  .string()
  .min(5, 'CIN must be at least 5 characters')
  .max(20, 'CIN must be less than 20 characters')
  .regex(/^[a-zA-Z0-9]+$/, 'CIN can only contain letters and numbers');

export const addressSchema = z
  .string()
  .min(10, 'Address must be at least 10 characters')
  .max(200, 'Address must be less than 200 characters');

// Personnel validation schemas
export const personnelStatusSchema = z.enum([
  'Recruit',
  'In-Training',
  'Waiting for test',
  'Employed',
  'Departed'
] as const);

export const testResultSchema = z.enum([
  'Pass',
  'Fail but Promising',
  'Fail'
] as const);

export const personnelFormSchema = z.object({
  fullName: nameSchema,
  cin: cinSchema,
  address: addressSchema,
  zone: z.string().min(1, 'Zone is required'),
  subZone: z.string().optional(),
  poste: z.string().min(1, 'Position is required').max(50, 'Position must be less than 50 characters'),
  trajectoryCode: z.string().max(20, 'Trajectory code must be less than 20 characters').optional(),
  phoneNumber: phoneSchema,
  status: personnelStatusSchema,
  recruitDate: z.string().date('Invalid date format').optional(),
});

export const personnelUpdateSchema = personnelFormSchema.partial().extend({
  id: z.string().min(1, 'ID is required'),
});

// User validation schemas
export const userRoleSchema = z.enum([
  'SuperAdmin',
  'Admin',
  'HR',
  'Manager',
  'TeamLead',
  'User'
] as const);

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const userFormSchema = z.object({
  fullName: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: userRoleSchema,
  zone: z.string().min(1, 'Zone is required'),
  position: z.string().max(50, 'Position must be less than 50 characters').optional(),
  phoneNumber: phoneSchema,
  address: addressSchema.optional(),
});

export const userUpdateSchema = userFormSchema.partial().extend({
  id: z.string().min(1, 'ID is required'),
  password: passwordSchema.optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, 'Password confirmation is required'),
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  }
);

// Comment validation schemas
export const commentSchema = z.object({
  text: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment must be less than 1000 characters'),
  fullName: z.string().min(1, 'Personnel name is required'),
});

// Training validation schemas
export const trainingUpdateSchema = z.object({
  fullName: z.string().min(1, 'Personnel name is required'),
  technicalTrainingCompleted: z.boolean().optional(),
  theoreticalTrainingCompleted: z.boolean().optional(),
  testDay: z.string().date('Invalid date format').optional(),
  testResult: testResultSchema.optional(),
  validationDate: z.string().date('Invalid date format').optional(),
  retestScheduled: z.string().date('Invalid date format').optional(),
  retestResult: testResultSchema.optional(),
});

// Notification validation schemas
export const notificationTypeSchema = z.enum([
  'tag',
  'profile_added',
  'status_change',
  'comment',
  'system',
  'transport_delay'
] as const);

export const notificationSchema = z.object({
  type: notificationTypeSchema,
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  message: z.string().min(1, 'Message is required').max(500, 'Message must be less than 500 characters'),
  targetUser: z.string().min(1, 'Target user is required'),
  data: z.record(z.unknown()).optional(),
});

// Search and filter validation schemas
export const searchFiltersSchema = z.object({
  searchTerm: z.string().max(100, 'Search term must be less than 100 characters').optional(),
  status: z.array(personnelStatusSchema).optional(),
  zone: z.array(z.string()).optional(),
  poste: z.array(z.string()).optional(),
  dateRange: z.object({
    start: z.string().date('Invalid start date'),
    end: z.string().date('Invalid end date'),
  }).optional(),
});

// File upload validation schemas
export const fileUploadSchema = z.object({
  file: z.instanceof(File, { message: 'Invalid file' }),
  maxSize: z.number().default(5 * 1024 * 1024), // 5MB default
  allowedTypes: z.array(z.string()).default(['image/jpeg', 'image/png', 'image/webp']),
}).refine(
  (data) => data.file.size <= data.maxSize,
  (data) => ({ message: `File size must be less than ${data.maxSize / 1024 / 1024}MB` })
).refine(
  (data) => data.allowedTypes.includes(data.file.type),
  (data) => ({ message: `File type must be one of: ${data.allowedTypes.join(', ')}` })
);

// API request validation schemas
export const paginationSchema = z.object({
  page: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, 'Page must be greater than 0')
    .default('1'),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0 && val <= 100, 'Limit must be between 1 and 100')
    .default('10'),
});

export const sortSchema = z.object({
  field: z.string().min(1, 'Sort field is required'),
  direction: z.enum(['asc', 'desc']).default('asc'),
});

// Transport validation schemas
export const locationSchema = z.object({
  lat: z.number().min(-90).max(90, 'Latitude must be between -90 and 90'),
  lng: z.number().min(-180).max(180, 'Longitude must be between -180 and 180'),
  address: z.string().min(1, 'Address is required'),
  type: z.enum(['pickup', 'destination', 'waypoint']),
});

export const transportRouteSchema = z.object({
  name: z.string().min(1, 'Route name is required').max(100, 'Route name must be less than 100 characters'),
  startPoint: locationSchema,
  endPoint: locationSchema,
  pickupPoints: z.array(locationSchema),
  estimatedDuration: z.number().min(1, 'Estimated duration must be at least 1 minute'),
  distance: z.number().min(0.1, 'Distance must be at least 0.1 kilometers'),
  isActive: z.boolean().default(true),
  assignedPersonnel: z.array(z.string()),
});

// Validation helper functions
export function validateWithSchema<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: string[];
} {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { success: false, errors };
    }
    return { success: false, errors: ['Validation failed'] };
  }
}

export function validateFormData<T>(schema: z.ZodSchema<T>, formData: FormData): {
  success: boolean;
  data?: T;
  errors?: Record<string, string[]>;
} {
  const data: Record<string, unknown> = {};
  
  // Convert FormData to object
  for (const [key, value] of formData.entries()) {
    if (data[key]) {
      // Handle multiple values for the same key
      if (Array.isArray(data[key])) {
        (data[key] as unknown[]).push(value);
      } else {
        data[key] = [data[key], value];
      }
    } else {
      data[key] = value;
    }
  }

  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {};
      error.errors.forEach(err => {
        const path = err.path.join('.');
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(err.message);
      });
      return { success: false, errors };
    }
    return { success: false, errors: { general: ['Validation failed'] } };
  }
}

// Type inference helpers
export type PersonnelFormData = z.infer<typeof personnelFormSchema>;
export type PersonnelUpdateData = z.infer<typeof personnelUpdateSchema>;
export type UserFormData = z.infer<typeof userFormSchema>;
export type UserUpdateData = z.infer<typeof userUpdateSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type CommentData = z.infer<typeof commentSchema>;
export type TrainingUpdateData = z.infer<typeof trainingUpdateSchema>;
export type NotificationData = z.infer<typeof notificationSchema>;
export type SearchFiltersData = z.infer<typeof searchFiltersSchema>;
export type TransportRouteData = z.infer<typeof transportRouteSchema>;
