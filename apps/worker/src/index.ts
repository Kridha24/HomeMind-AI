import { workerConfig } from './config';

class WorkerApplication {
  private isRunning: boolean = false;

  async start() {
    this.isRunning = true;
    console.log(`[Worker] ${workerConfig.serviceName} initialized.`);
    console.log(`[Worker] Concurrency limit: ${workerConfig.concurrency}`);
    console.log(`[Worker] Mode: ${workerConfig.isRedisEnabled ? 'Redis BullMQ' : 'In-Memory Queue Ready'}`);

    this.registerSignalHandlers();
  }

  private registerSignalHandlers() {
    const handleShutdown = async (signal: string) => {
      console.log(`\n[Worker] Received ${signal}. Initiating graceful shutdown...`);
      this.isRunning = false;

      // Allow 500ms for in-flight tasks to complete
      setTimeout(() => {
        console.log('[Worker] Graceful shutdown completed. Process exiting cleanly.');
        process.exit(0);
      }, 500);
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
