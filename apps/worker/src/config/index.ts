export interface WorkerConfig {
  serviceName: string;
  concurrency: number;
  redisUrl?: string;
  isRedisEnabled: boolean;
}

export const workerConfig: WorkerConfig = {
  serviceName: 'homemind-worker',
  concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
  redisUrl: process.env.REDIS_URL,
  isRedisEnabled: Boolean(process.env.REDIS_URL),
};
