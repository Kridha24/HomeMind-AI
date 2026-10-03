import { createHash } from 'crypto';

// ==========================================
// 1. MONEY & CURRENCY SAFETY UTILITIES
// ==========================================
export function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export function formatCurrency(
  amount: number,
  currency: string = 'INR',
  options: { minimumFractionDigits?: number; maximumFractionDigits?: number } = {}
): string {
  const rounded = roundMoney(Number.isFinite(amount) ? amount : 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: options.minimumFractionDigits ?? 2,
    maximumFractionDigits: options.maximumFractionDigits ?? 2,
  }).format(rounded);
}

export function toMinorUnits(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100);
}

export function fromMinorUnits(minorUnits: number): number {
  return roundMoney(minorUnits / 100);
}

// ==========================================
// 2. DOMAIN ENUMS & ROLES
// ==========================================
export const UserRole = {
  OWNER: 'OWNER',
  CO_OWNER: 'CO-OWNER',
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
  GUEST: 'GUEST',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const TransactionType = {
  DEBIT: 'DEBIT',
  CREDIT: 'CREDIT',
} as const;
export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType];

export const TransactionStatus = {
  AUTO_IMPORTED: 'AUTO_IMPORTED',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  REVIEWED: 'REVIEWED',
  REJECTED: 'REJECTED',
} as const;
export type TransactionStatus = (typeof TransactionStatus)[keyof typeof TransactionStatus];

export const BillStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
} as const;
export type BillStatus = (typeof BillStatus)[keyof typeof BillStatus];

export const TaskStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
} as const;
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

// ==========================================
// 3. CRYPTO & IDEMPOTENCY UTILITIES
// ==========================================
export function computeTransactionHash(params: {
  householdId: string;
  senderHeader?: string;
  amount: number;
  timestamp: Date | string;
  referenceId?: string;
}): string {
  const isoTime = params.timestamp instanceof Date
    ? params.timestamp.toISOString()
    : new Date(params.timestamp).toISOString();
  const normalizedRef = (params.referenceId || '').trim().toLowerCase();
  const normalizedSender = (params.senderHeader || 'UNKNOWN').toUpperCase().trim();
  const rawPayload = [
    params.householdId,
    normalizedSender,
    params.amount.toFixed(2),
    isoTime,
    normalizedRef,
  ].join('::');

  return createHash('sha256').update(rawPayload).digest('hex');
}

// ==========================================
// 4. API CONTRACTS & RESPONSES
// ==========================================
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
    requestId?: string;
  };
  metadata?: {
    timestamp: string;
    requestId: string;
    processingTimeMs?: number;
  };
}

export interface PaginationParams {
  limit?: number;
  cursor?: string;
  page?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pageInfo: {
    nextCursor?: string;
    hasNextPage: boolean;
    totalCount?: number;
  };
}

// ==========================================
// 5. DOMAIN EVENT CONTRACTS
// ==========================================
export interface DomainEvent<T = any> {
  id: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  householdId: string;
  payload: T;
  timestamp: string;
}

export interface EventPublisher {
  publish(event: DomainEvent): Promise<void>;
}

export class InMemoryEventPublisher implements EventPublisher {
  private handlers: Map<string, Array<(event: DomainEvent) => Promise<void>>> = new Map();

  public subscribe(eventType: string, handler: (event: DomainEvent) => Promise<void>) {
    const list = this.handlers.get(eventType) || [];
    list.push(handler);
    this.handlers.set(eventType, list);
  }

  public async publish(event: DomainEvent): Promise<void> {
    const list = this.handlers.get(event.eventType) || [];
    for (const handler of list) {
      try {
        await handler(event);
      } catch (err) {
        console.error(`Error handling event ${event.eventType}:`, err);
      }
    }
  }
}

export * from './events';
export * from './jobs';

