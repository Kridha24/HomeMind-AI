import dotenv from 'dotenv';
dotenv.config();

export interface WorkerConfig {
  serviceName: string;
  redisUrl?: string;
  isRedisEnabled: boolean;
  transactionConcurrency: number;
  notificationConcurrency: number;
  aiConcurrency: number;
  analyticsConcurrency: number;
  outboxBatchSize: number;
  outboxPollIntervalMs: number;
  outboxMaxAttempts: number;
}

export const workerConfig: WorkerConfig = {
  serviceName: 'homemind-worker',
  redisUrl: process.env.REDIS_URL,
  isRedisEnabled: Boolean(process.env.REDIS_URL),
  transactionConcurrency: parseInt(process.env.TRANSACTION_WORKER_CONCURRENCY || '5', 10),
  notificationConcurrency: parseInt(process.env.NOTIFICATION_WORKER_CONCURRENCY || '10', 10),
  aiConcurrency: parseInt(process.env.AI_WORKER_CONCURRENCY || '2', 10),
  analyticsConcurrency: parseInt(process.env.ANALYTICS_WORKER_CONCURRENCY || '3', 10),
  outboxBatchSize: parseInt(process.env.OUTBOX_BATCH_SIZE || '50', 10),
  outboxPollIntervalMs: parseInt(process.env.OUTBOX_POLL_INTERVAL_MS || '3000', 10),
  outboxMaxAttempts: parseInt(process.env.OUTBOX_MAX_ATTEMPTS || '5', 10),
};
