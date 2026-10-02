import { z } from 'zod';

export const importSmsTransactionSchema = z.object({
  amount: z.number().positive('Amount must be a positive number'),
  currency: z.string().default('INR'),
  type: z.enum(['DEBIT', 'CREDIT']),
  merchant: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  paymentMethod: z.string().optional().nullable(),
  accountLast4: z.string().max(8).optional().nullable(),
  bankName: z.string().max(100).optional().nullable(),
  reference: z.string().max(100).optional().nullable(),
  occurredAt: z.union([z.string(), z.date()]),
  sourceHash: z.string().length(64).optional().nullable(),
  parserConfidence: z.number().min(0).max(1).optional().nullable(),
  rawSender: z.string().max(50).optional().nullable(),
  status: z.enum(['CONFIRMED', 'NEEDS_REVIEW', 'IGNORED']).optional(),
});

export const ingestRawSmsSchema = z.object({
  sender: z.string().max(50).optional(),
  body: z.string().min(5, 'SMS body is too short to be financial'),
  timestamp: z.union([z.string(), z.number()]).optional(),
});

export const updateTransactionSchema = z.object({
  status: z.enum(['CONFIRMED', 'NEEDS_REVIEW', 'IGNORED']).optional(),
  category: z.string().min(1).max(50).optional(),
  merchant: z.string().min(1).max(100).optional(),
  notes: z.string().max(500).optional().nullable(),
  amount: z.number().positive().optional(),
  occurredAt: z.union([z.string(), z.date()]).optional(),
});
