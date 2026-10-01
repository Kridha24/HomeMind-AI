import { Worker, Job } from 'bullmq';
import { QUEUE_NAMES, AnalyticsAggregationJobPayload } from '@homemind/shared';
import Redis from 'ioredis';
import { workerConfig } from '../config';

export class AnalyticsWorker {
  private worker: Worker | null = null;
  private redisConnection: Redis | null = null;

  public start() {
    if (!workerConfig.redisUrl) {
      console.log('[AnalyticsWorker] Redis not available, skipping BullMQ consumer.');
      return;
    }

    this.redisConnection = new Redis(workerConfig.redisUrl, {
      maxRetriesPerRequest: null,
    });

    this.worker = new Worker(
      QUEUE_NAMES.ANALYTICS,
      async (job: Job<any>) => {
        const payload: AnalyticsAggregationJobPayload = job.data.payload || job.data;
        const householdId = payload.householdId || job.data.householdId;

        console.log(`[AnalyticsWorker] Running background analytics aggregation for household ${householdId}`);

        // Invalidate household dashboard cache in Redis so future reads fetch fresh metrics
        if (this.redisConnection && householdId) {
          const cacheKey = `homemind:v1:dashboard:${householdId}`;
          await this.redisConnection.del(cacheKey);
        }
      },
      {
        connection: this.redisConnection,
        concurrency: workerConfig.analyticsConcurrency,
      }
    );

    this.worker.on('failed', (job, err) => {
      console.warn(`[AnalyticsWorker] Job ${job?.id} failed: ${err.message}`);
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
