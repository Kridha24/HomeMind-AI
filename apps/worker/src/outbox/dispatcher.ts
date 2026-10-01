import { prisma } from '@homemind/database';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import {
  QUEUE_NAMES,
  EventType,
  DomainEventEnvelope,
} from '@homemind/shared';
import {
  tracer,
  outboxPendingCount,
  outboxOldestEventAgeSeconds,
  outboxDispatchFailuresTotal,
  logger,
} from '@homemind/observability';
import { workerConfig } from '../config';

export class OutboxDispatcher {
  private isRunning: boolean = false;
  private pollTimer: NodeJS.Timeout | null = null;
  private queues: Map<string, Queue> = new Map();
  private redisConnection: Redis | null = null;

  constructor() {
    this.initQueues();
  }

  private initQueues() {
    if (!workerConfig.redisUrl) {
      console.log('[OutboxDispatcher] Redis URL not configured. Outbox events will accumulate safely in DB.');
      return;
    }

    try {
      this.redisConnection = new Redis(workerConfig.redisUrl, {
        maxRetriesPerRequest: null,
        enableOfflineQueue: false,
        retryStrategy: (times) => Math.min(times * 150, 3000),
      });

      for (const queueName of Object.values(QUEUE_NAMES)) {
        this.queues.set(
          queueName,
          new Queue(queueName, {
            connection: this.redisConnection,
          })
        );
      }
    } catch (err: any) {
      console.warn(`[OutboxDispatcher] Failed to connect to Redis: ${err.message}`);
    }
  }

  public start() {
    this.isRunning = true;
    console.log('[OutboxDispatcher] Started polling loop with interval', workerConfig.outboxPollIntervalMs, 'ms');
    this.scheduleNextPoll(100);
  }

  private scheduleNextPoll(delayMs: number = workerConfig.outboxPollIntervalMs) {
    if (!this.isRunning) return;
    this.pollTimer = setTimeout(async () => {
      try {
        await this.dispatchBatch();
      } catch (err: any) {
        console.error('[OutboxDispatcher] Error during poll cycle:', err.message);
      } finally {
        this.scheduleNextPoll();
      }
    }, delayMs);
  }

  /**
   * Safe batch claim and publish strategy:
   * 1. Query pending events with bounded batch size.
   * 2. Atomically claim rows using lease window (prevents duplicate worker dispatch).
   * 3. Publish to BullMQ.
   * 4. Mark publishedAt only after successful queue insertion.
   */
  public async dispatchBatch(): Promise<number> {
    const now = new Date();
    const leaseExpiration = new Date(now.getTime() + 60000); // 60s lease

    // 1. Update outbox gauge metrics
    try {
      const totalPending = await (prisma as any).outboxEvent.count({ where: { publishedAt: null } });
      outboxPendingCount.set(totalPending, { service: 'homemind-worker' });
    } catch {}

    // 2. Find candidate pending events
    const candidates = await (prisma as any).outboxEvent.findMany({
      where: {
        publishedAt: null,
        attempts: { lt: workerConfig.outboxMaxAttempts },
        OR: [
          { nextAttemptAt: null },
          { nextAttemptAt: { lte: now } },
        ],
      },
      orderBy: { createdAt: 'asc' },
      take: workerConfig.outboxBatchSize,
    });

    if (!candidates.length) {
      outboxOldestEventAgeSeconds.set(0, { service: 'homemind-worker' });
      return 0;
    }

    const oldestAgeSec = Math.max(0, Math.floor((now.getTime() - new Date(candidates[0].createdAt).getTime()) / 1000));
    outboxOldestEventAgeSeconds.set(oldestAgeSec, { service: 'homemind-worker' });

    let dispatchedCount = 0;

    for (const event of candidates) {
      if (!this.isRunning) break;

      // 3. Claim event by extending nextAttemptAt
      const claimed = await (prisma as any).outboxEvent.updateMany({
        where: {
          id: event.id,
          publishedAt: null,
          OR: [
            { nextAttemptAt: null },
            { nextAttemptAt: { lte: now } },
          ],
        },
        data: {
          nextAttemptAt: leaseExpiration,
        },
      });

      if (claimed.count === 0) {
        // Already claimed by another worker instance
        continue;
      }

      // 4. Parse and route to BullMQ queue with OpenTelemetry span
      const span = tracer.startSpan('outbox.dispatch_event', {
        attributes: {
          'outbox.event_id': event.id,
          'outbox.event_type': event.eventType,
        },
      });

      try {
        const envelope: DomainEventEnvelope = JSON.parse(event.payload);
        const success = await this.routeAndPublish(event.eventType, envelope);

        if (success) {
          // Mark publishedAt
          await (prisma as any).outboxEvent.update({
            where: { id: event.id },
            data: {
              publishedAt: new Date(),
              lastError: null,
            },
          });
          dispatchedCount++;
          span.end();
        } else {
          // Queue offline or failed to enqueue
          outboxDispatchFailuresTotal.inc({ service: 'homemind-worker', event_type: event.eventType });
          span.recordException(new Error('Queue unavailable or enqueue failed'));
          span.end();

          const nextAttempts = event.attempts + 1;
          const backoffDelay = Math.min(Math.pow(2, nextAttempts) * 1000, 60000);
          await (prisma as any).outboxEvent.update({
            where: { id: event.id },
            data: {
              attempts: nextAttempts,
              lastError: 'Queue unavailable or enqueue failed',
              nextAttemptAt: new Date(Date.now() + backoffDelay),
            },
          });
        }
      } catch (err: any) {
        outboxDispatchFailuresTotal.inc({ service: 'homemind-worker', event_type: event.eventType });
        span.recordException(err);
        span.end();

        const nextAttempts = event.attempts + 1;
        const backoffDelay = Math.min(Math.pow(2, nextAttempts) * 1000, 60000);
        await (prisma as any).outboxEvent.update({
          where: { id: event.id },
          data: {
            attempts: nextAttempts,
            lastError: err.message || 'Unknown serialization or dispatch error',
            nextAttemptAt: new Date(Date.now() + backoffDelay),
          },
        });
      }
    }

    return dispatchedCount;
  }

  private async routeAndPublish(eventType: string, envelope: DomainEventEnvelope): Promise<boolean> {
    if (!this.redisConnection) {
      return false;
    }

    const correlationMeta = {
      traceId: envelope.traceId,
      spanId: envelope.spanId,
      requestId: envelope.requestId,
      eventId: envelope.eventId,
    };

    // Determine target queues based on event type
    switch (eventType) {
      case EventType.TRANSACTION_CREATED: {
        const aiQueue = this.queues.get(QUEUE_NAMES.AI);
        const analyticsQueue = this.queues.get(QUEUE_NAMES.ANALYTICS);

        if (aiQueue) {
          await aiQueue.add('AI_CATEGORIZATION', {
            version: 1,
            jobType: 'AI_CATEGORIZATION',
            jobId: envelope.eventId,
            occurredAt: envelope.occurredAt,
            householdId: envelope.householdId,
            ...correlationMeta,
            payload: envelope.data,
          }, { jobId: envelope.eventId });
        }

        if (analyticsQueue) {
          await analyticsQueue.add('ANALYTICS_AGGREGATION', {
            version: 1,
            jobType: 'ANALYTICS_AGGREGATION',
            jobId: `analytics-${envelope.eventId}`,
            occurredAt: envelope.occurredAt,
            householdId: envelope.householdId,
            ...correlationMeta,
            payload: envelope.data,
          });
        }
        return true;
      }

      case EventType.EXPENSE_CREATED:
      case EventType.INCOME_CREATED: {
        const analyticsQueue = this.queues.get(QUEUE_NAMES.ANALYTICS);
        if (analyticsQueue) {
          await analyticsQueue.add('ANALYTICS_AGGREGATION', {
            version: 1,
            jobType: 'ANALYTICS_AGGREGATION',
            jobId: `analytics-${envelope.eventId}`,
            occurredAt: envelope.occurredAt,
            householdId: envelope.householdId,
            ...correlationMeta,
            payload: envelope.data,
          });
        }
        return true;
      }

      case EventType.BILL_PAID: {
        const notifQueue = this.queues.get(QUEUE_NAMES.NOTIFICATIONS);
        if (notifQueue) {
          await notifQueue.add('NOTIFICATION_DISPATCH', {
            version: 1,
            jobType: 'NOTIFICATION_DISPATCH',
            jobId: `notif-${envelope.eventId}`,
            occurredAt: envelope.occurredAt,
            householdId: envelope.householdId,
            ...correlationMeta,
            payload: {
              householdId: envelope.householdId,
              channel: 'IN_APP',
              title: 'Bill Paid',
              message: `Bill "${envelope.data.title}" was marked paid for ₹${envelope.data.amount}`,
              dedupKey: envelope.eventId,
            },
          });
        }
        return true;
      }

      default:
        // Other events acknowledged
        return true;
    }
  }

  public async stop(): Promise<void> {
    this.isRunning = false;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
    for (const [name, queue] of this.queues.entries()) {
      try {
        await queue.close();
      } catch (err) {
        console.warn(`[OutboxDispatcher] Error closing queue ${name}: ${(err as Error).message}`);
      }
    }
    if (this.redisConnection) {
      try {
        await this.redisConnection.quit();
      } catch {
        this.redisConnection.disconnect();
      }
    }
  }
}
