import { Prisma } from '@prisma/client';
import { createEventEnvelope, DomainEventEnvelope, EventTypeValue } from '@homemind/shared';
import crypto from 'crypto';

export interface CreateOutboxEventParams<T = any> {
  eventType: EventTypeValue | string;
  aggregateType: string;
  aggregateId: string;
  householdId?: string;
  data: T;
  version?: number;
}

export class OutboxService {
  /**
   * Appends an OutboxEvent record within an ongoing Prisma transaction.
   * Ensures the business entity creation and event publication are atomic.
   */
  public static async recordEvent<T>(
    tx: Prisma.TransactionClient,
    params: CreateOutboxEventParams<T>
  ) {
    const eventId = crypto.randomUUID();
    const envelope: DomainEventEnvelope<T> = createEventEnvelope({
      eventId,
      eventType: params.eventType,
      aggregateType: params.aggregateType,
      aggregateId: params.aggregateId,
      householdId: params.householdId,
      version: params.version || 1,
      data: params.data,
    });

    return (tx as any).outboxEvent.create({
      data: {
        eventId,
        eventType: params.eventType,
        aggregateType: params.aggregateType,
        aggregateId: params.aggregateId,
        householdId: params.householdId || null,
        payload: JSON.stringify(envelope),
        attempts: 0,
      },
    });
  }
}
