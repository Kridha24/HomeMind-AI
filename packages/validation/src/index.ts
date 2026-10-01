import { z } from 'zod';

// ==========================================
// 1. GENERIC & PARAM SCHEMAS
// ==========================================
export const uuidSchema = z.string().uuid({ message: 'Invalid UUID identifier' });

export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
});

// ==========================================
// 2. AUTHENTICATION SCHEMAS
// ==========================================
export const googleAuthSchema = z.object({
  idToken: z.string().min(1, 'Google ID token is required'),
});

export const requestOtpSchema = z.object({
  phoneNumber: z
    .string()
    .regex(/^\+?[1-9]\d{7,14}$/, 'Invalid international E.164 phone number')
    .optional(),
  email: z.string().email('Invalid email address').optional(),
}).refine(data => data.phoneNumber || data.email, {
  message: 'Either phoneNumber or email must be provided',
});

export const verifyOtpSchema = z.object({
  phoneNumber: z.string().optional(),
  email: z.string().email().optional(),
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
}).refine(data => data.phoneNumber || data.email, {
  message: 'Either phoneNumber or email must be provided',
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  age: z.number().int().min(1).max(120).optional(),
  avatar: z.string().url().optional(),
});

// ==========================================
// 3. FINANCIAL SCHEMAS (EXPENSE & INCOME)
// ==========================================
export const createExpenseSchema = z.object({
  amount: z.number().positive('Expense amount must be positive'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().max(255).optional(),
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
});

export const createIncomeSchema = z.object({
  amount: z.number().positive('Income amount must be positive'),
  source: z.string().min(1, 'Income source is required'),
  description: z.string().max(255).optional(),
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
});

// ==========================================
// 4. SMS & TRANSACTION INGESTION SCHEMAS
// ==========================================
export const syncSmsBatchSchema = z.object({
  messages: z.array(
    z.object({
      sender: z.string().min(1),
      body: z.string().min(1),
      timestamp: z.number().positive(),
    })
  ).min(1, 'At least one SMS message required in batch'),
});

// ==========================================
// 5. BILLS SCHEMAS
// ==========================================
export const createBillSchema = z.object({
  title: z.string().min(1, 'Bill title is required'),
  amount: z.number().positive('Bill amount must be positive'),
  category: z.string().min(1),
  dueDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  frequency: z.enum(['ONE_TIME', 'MONTHLY', 'QUARTERLY', 'YEARLY']).default('MONTHLY'),
  autoPay: z.boolean().default(false),
});

// ==========================================
// 6. TASKS & GROCERY SCHEMAS
// ==========================================
export const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().max(500).optional(),
  dueDate: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  assignedToId: z.string().uuid().optional(),
});

export const createGroceryItemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  category: z.string().default('General'),
  quantity: z.number().positive().default(1),
  unit: z.string().default('units'),
  minThreshold: z.number().nonnegative().default(1),
});
