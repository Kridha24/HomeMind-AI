import { workerConfig } from './config';
import { OutboxDispatcher } from './outbox/dispatcher';
import { AIWorker, NotificationWorker, AnalyticsWorker } from './workers';

class WorkerApplication {
  private isRunning: boolean = false;
  private outboxDispatcher: OutboxDispatcher;
  private aiWorker: AIWorker;
  private notificationWorker: NotificationWorker;
  private analyticsWorker: AnalyticsWorker;

  constructor() {
    this.outboxDispatcher = new OutboxDispatcher();
    this.aiWorker = new AIWorker();
    this.notificationWorker = new NotificationWorker();
    this.analyticsWorker = new AnalyticsWorker();
  }

  async start() {
    this.isRunning = true;
    console.log(`[Worker] ${workerConfig.serviceName} initializing...`);
    console.log(`[Worker] Redis: ${workerConfig.isRedisEnabled ? 'Configured (' + workerConfig.redisUrl + ')' : 'Disabled (Graceful local fallback)'}`);
    console.log(`[Worker] Concurrency -> Transactions: ${workerConfig.transactionConcurrency}, Notifications: ${workerConfig.notificationConcurrency}, AI: ${workerConfig.aiConcurrency}`);

    // Start components
    this.outboxDispatcher.start();
    this.aiWorker.start();
    this.notificationWorker.start();
    this.analyticsWorker.start();

    console.log('[Worker] All workers and outbox dispatcher active.');
    this.registerSignalHandlers();
  }

  private registerSignalHandlers() {
    const handleShutdown = async (signal: string) => {
      if (!this.isRunning) return;
      console.log(`\n[Worker] Received ${signal}. Initiating graceful shutdown...`);
      this.isRunning = false;

      try {
        await Promise.all([
          this.outboxDispatcher.stop(),
          this.aiWorker.stop(),
          this.notificationWorker.stop(),
          this.analyticsWorker.stop(),
        ]);
        console.log('[Worker] Graceful shutdown completed cleanly.');
        process.exit(0);
      } catch (err) {
        console.error('[Worker] Error during shutdown:', err);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
  }
}

const app = new WorkerApplication();
app.start().catch((err) => {
  console.error('[Worker] Fatal error during startup:', err);
  process.exit(1);
});
