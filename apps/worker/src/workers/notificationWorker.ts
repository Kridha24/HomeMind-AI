import { Worker, Job } from 'bullmq';
import { prisma } from '@homemind/database';
import { QUEUE_NAMES, NotificationJobPayload } from '@homemind/shared';
import {
  tracer,
  bullmqJobsStartedTotal,
  bullmqJobsCompletedTotal,
  bullmqJobsFailedTotal,
  bullmqJobDurationSeconds,
  notificationJobsFailedTotal,
} from '@homemind/observability';
import Redis from 'ioredis';
import { workerConfig } from '../config';

export class NotificationWorker {
  private worker: Worker | null = null;
  private redisConnection: Redis | null = null;

  public start() {
    if (!workerConfig.redisUrl) {
      console.log('[NotificationWorker] Redis not available, skipping BullMQ consumer.');
      return;
    }

    this.redisConnection = new Redis(workerConfig.redisUrl, {
      maxRetriesPerRequest: null,
    });

    this.worker = new Worker(
      QUEUE_NAMES.NOTIFICATIONS,
      async (job: Job<any>) => {
        const jobStartTime = Date.now();
        const labels = { service: 'homemind-worker', queue: QUEUE_NAMES.NOTIFICATIONS, job_name: job.name };
        bullmqJobsStartedTotal.inc(labels);

        const traceContext = job.data.traceId
          ? {
              traceId: job.data.traceId,
              spanId: job.data.spanId || '0000000000000000',
              traceFlags: 1,
            }
          : undefined;

        const span = tracer.startSpan('worker.notification_dispatch', {
          parent: traceContext,
          attributes: {
            'bullmq.job_id': job.id,
            'bullmq.queue': QUEUE_NAMES.NOTIFICATIONS,
          },
        });

        try {
          const payload: NotificationJobPayload = job.data.payload || job.data;
          console.log(`[NotificationWorker] Processing notification for household ${payload.householdId}`);

          // Notification Idempotency / Deduplication check
          if (payload.dedupKey && this.redisConnection) {
            const dedupKey = `homemind:v1:notif-worker-dedup:${payload.householdId}:${payload.dedupKey}`;
            const isDuplicate = await this.redisConnection.get(dedupKey);
            if (isDuplicate) {
              console.log(`[NotificationWorker] Notification ${payload.dedupKey} already processed. Skipping.`);
              span.end();
              bullmqJobsCompletedTotal.inc(labels);
              return;
            }
            await this.redisConnection.set(dedupKey, '1', 'EX', 86400); // 24hr window
          }

          // Check if in-app notification exists or create it
          if (payload.channel === 'IN_APP') {
            await prisma.notification.create({
              data: {
                householdId: payload.householdId,
                title: payload.title,
                message: payload.message,
                type: 'ALERT',
                isRead: false,
              },
            });
          }

          span.end();
          const durationSec = (Date.now() - jobStartTime) / 1000;
          bullmqJobsCompletedTotal.inc(labels);
          bullmqJobDurationSeconds.observe(durationSec, labels);
          console.log(`[NotificationWorker] Notification delivered via ${payload.channel}: "${payload.title}"`);
        } catch (err: any) {
          span.recordException(err);
          span.end();
          bullmqJobsFailedTotal.inc({ ...labels, error_type: 'delivery_failure' });
          notificationJobsFailedTotal.inc({ service: 'homemind-worker', channel: 'IN_APP', reason: err.message || 'unknown' });
          throw err;
        }
      },
      {
        connection: this.redisConnection,
        concurrency: workerConfig.notificationConcurrency,
      }
    );

    this.worker.on('failed', (job, err) => {
      console.warn(`[NotificationWorker] Job ${job?.id} failed: ${err.message}`);
    });
  }

  public async stop(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
    }
    if (this.redisConnection) {
      await this.redisConnection.quit();
      this.redisConnection = null;
    }
  }
}
