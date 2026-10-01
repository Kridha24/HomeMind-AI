import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    phoneNumber: z.string().min(10, 'Phone number must be at least 10 characters').optional().or(z.literal('')),
    password: z.string()
      .min(10, 'Password must be at least 10 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
  }).refine(data => data.email || data.phoneNumber, {
    message: 'Either email or phone number is required',
    path: ['email'],
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    phoneNumber: z.string().min(10, 'Phone number must be at least 10 characters').optional().or(z.literal('')),
    password: z.string().min(1, 'Password is required'),
  }).refine(data => data.email || data.phoneNumber, {
    message: 'Either email or phone number is required',
    path: ['email'],
  })
});

/**
 * Google OAuth schema — strictly requires a verified Google token.
 * Client-supplied email/googleId alone are NOT accepted as authentication;
 * they would allow any caller to impersonate any Google account.
 * Only a verifiable idToken or token (JWT from Google) is accepted.
 */
export const googleAuthSchema = z.object({
  body: z.object({
    idToken: z.string().min(1).optional(),
    token: z.string().min(1).optional(),
    // Additional demographic data fields (age, country, currency) for registration.
    age: z.union([z.string(), z.number()]).optional(),
    country: z.string().optional(),
    currency: z.string().optional(),
  }).refine(data => data.idToken || data.token, {
    message: 'A verified Google ID token (idToken or token) is required for authentication',
    path: ['idToken'],
  })
});

export const importSmsTransactionSchema = z.object({
  body: z.object({
    amount: z.number().positive('Amount must be greater than zero'),
    currency: z.string().default('INR'),
    type: z.enum(['DEBIT', 'CREDIT']),
    merchant: z.string().max(120).optional().nullable(),
    category: z.string().max(60).optional().nullable(),
    paymentMethod: z.string().max(30).optional().nullable(),
    accountLast4: z.string().max(12).optional().nullable(),
    bankName: z.string().max(60).optional().nullable(),
    reference: z.string().max(120).optional().nullable(),
    occurredAt: z.union([z.string(), z.date()]),
    sourceHash: z.string().optional().nullable(),
    parserConfidence: z.number().min(0).max(1).optional().nullable(),
    rawSender: z.string().max(60).optional().nullable(),
    status: z.enum(['CONFIRMED', 'NEEDS_REVIEW', 'IGNORED']).optional(),
  })
});

export const updateTransactionSchema = z.object({
  body: z.object({
    merchant: z.string().max(120).optional().nullable(),
    category: z.string().max(60).optional().nullable(),
    amount: z.number().positive('Amount must be greater than zero').optional(),
    status: z.enum(['CONFIRMED', 'NEEDS_REVIEW', 'IGNORED']).optional(),
  })
});

