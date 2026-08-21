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
