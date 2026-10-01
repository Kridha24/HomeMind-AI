import { Queue, QueueOptions } from 'bullmq';
import { QUEUE_NAMES, QueueNameValue, BaseJobContract } from '@homemind/shared';
import Redis from 'ioredis';

export class QueueService {
  private static instance: QueueService;
  private queues: Map<string, Queue> = new Map();
  private redisConnection: Redis | null = null;
  private isAvailable: boolean = false;

  private constructor() {
    this.initQueues();
  }

  public static getInstance(): QueueService {
    if (!QueueService.instance) {
      QueueService.instance = new QueueService();
    }
    return QueueService.instance;
  }

  private initQueues(): void {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      console.log('[QueueService] REDIS_URL not set. Queue producer will gracefully store in Outbox.');
      this.isAvailable = false;
      return;
    }

    try {
      this.redisConnection = new Redis(redisUrl, {
        maxRetriesPerRequest: null,
        enableOfflineQueue: false,
        retryStrategy: (times) => Math.min(times * 150, 3000),
      });

      this.redisConnection.on('connect', () => {
        this.isAvailable = true;
      });

      this.redisConnection.on('error', (err) => {
        this.isAvailable = false;
        console.warn(`[QueueService] Redis connection error: ${err.message}`);
      });

      const defaultOptions: QueueOptions = {
        connection: this.redisConnection,
        defaultJobOptions: {
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: {
            age: 86400, // 24 hours
            count: 5000,
          },
          removeOnFail: {
            age: 604800, // 7 days in DLQ
            count: 10000,
          },
        },
      };

      for (const queueName of Object.values(QUEUE_NAMES)) {
        this.queues.set(queueName, new Queue(queueName, defaultOptions));
      }
      this.isAvailable = true;
      console.log('[QueueService] BullMQ queues initialized.');
    } catch (err: any) {
      this.isAvailable = false;
      console.warn(`[QueueService] Initialization warning: ${err.message}`);
    }
  }

  /**
   * Enqueue a job into BullMQ
   * Returns true if successfully published to queue, false if Redis offline (stays in Outbox)
   */
  public async publishJob<T>(queueName: QueueNameValue, job: BaseJobContract<T>): Promise<boolean> {
    const queue = this.queues.get(queueName);
    if (!queue || !this.isAvailable) {
      return false;
    }

    try {
      await queue.add(job.jobType, job, {
        jobId: job.jobId,
      });
      return true;
    } catch (err: any) {
      console.warn(`[QueueService] Failed to enqueue job ${job.jobId} to ${queueName}: ${err.message}`);
      return false;
    }
  }

  public async shutdown(): Promise<void> {
    for (const [name, queue] of this.queues.entries()) {
      try {
        await queue.close();
      } catch (err) {
        console.warn(`[QueueService] Error closing queue ${name}: ${(err as Error).message}`);
      }
    }
    if (this.redisConnection) {
      try {
        await this.redisConnection.quit();
      } catch {
        this.redisConnection.disconnect();
      }
    }
    this.isAvailable = false;
  }
}

export const queueService = QueueService.getInstance();
