import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    phoneNumber: z.string().min(10, 'Phone number must be at least 10 characters').optional().or(z.literal('')),
    password: z.string().min(6, 'Password must be at least 6 characters'),
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
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }).refine(data => data.email || data.phoneNumber, {
    message: 'Either email or phone number is required',
    path: ['email'],
  })
});

export const googleAuthSchema = z.object({
  body: z.object({
    idToken: z.string().min(1, 'Google ID token is required'),
  })
});
