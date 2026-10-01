import { Worker, Job } from 'bullmq';
import { prisma } from '@homemind/database';
import { QUEUE_NAMES, NotificationJobPayload } from '@homemind/shared';
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
        const payload: NotificationJobPayload = job.data.payload || job.data;
        console.log(`[NotificationWorker] Processing notification for household ${payload.householdId}`);

        // Notification Idempotency / Deduplication check
        if (payload.dedupKey && this.redisConnection) {
          const dedupKey = `homemind:v1:notif-worker-dedup:${payload.householdId}:${payload.dedupKey}`;
          const isDuplicate = await this.redisConnection.get(dedupKey);
          if (isDuplicate) {
            console.log(`[NotificationWorker] Notification ${payload.dedupKey} already processed. Skipping.`);
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

        console.log(`[NotificationWorker] Notification delivered via ${payload.channel}: "${payload.title}"`);
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
