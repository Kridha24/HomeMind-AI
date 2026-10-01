import { Worker, Job } from 'bullmq';
import { prisma } from '@homemind/database';
import { QUEUE_NAMES, AICategorizationJobPayload } from '@homemind/shared';
import Redis from 'ioredis';
import { workerConfig } from '../config';

export class AIWorker {
  private worker: Worker | null = null;
  private redisConnection: Redis | null = null;

  public start() {
    if (!workerConfig.redisUrl) {
      console.log('[AIWorker] Redis not available, skipping BullMQ consumer.');
      return;
    }

    this.redisConnection = new Redis(workerConfig.redisUrl, {
      maxRetriesPerRequest: null,
    });

    this.worker = new Worker(
      QUEUE_NAMES.AI,
      async (job: Job<any>) => {
        const payload: AICategorizationJobPayload = job.data.payload || job.data;
        console.log(`[AIWorker] Processing AI categorization for transaction ${payload.transactionId || job.data.jobId}`);

        try {
          // Asynchronous AI categorization:
          // Minimum required data is used (never private bank credentials or accounts)
          const transactionId = payload.transactionId || job.data.jobId;
          const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId },
          });

          if (!transaction) {
            console.log(`[AIWorker] Transaction ${transactionId} not found, skipping.`);
            return;
          }

          // Rule-based heuristic or AI call simulation
          // If transaction already has a category and it's not 'Other', keep it
          if (transaction.category && transaction.category !== 'Other' && transaction.category !== 'Uncategorized') {
            return;
          }

          let suggestedCategory = 'Uncategorized';
          const merchant = (transaction.merchant || '').toLowerCase();

          if (/swiggy|zomato|mcdonald|starbucks|restaurant|food|cafe/i.test(merchant)) {
            suggestedCategory = 'Food & Dining';
          } else if (/uber|ola|rapido|metro|petrol|fuel|shell/i.test(merchant)) {
            suggestedCategory = 'Transportation';
          } else if (/blinkit|zepto|instamart|bigbasket|grofers|grocery|supermarket/i.test(merchant)) {
            suggestedCategory = 'Groceries';
          } else if (/amazon|flipkart|myntra|ajio|shopping/i.test(merchant)) {
            suggestedCategory = 'Shopping';
          } else if (/netflix|spotify|prime|hotstar|movie|pvr/i.test(merchant)) {
            suggestedCategory = 'Entertainment';
          } else if (/pharmacy|apollo|medplus|netmeds|hospital|clinic/i.test(merchant)) {
            suggestedCategory = 'Healthcare';
          } else if (/electricity|bescom|airtel|jio|broadband|water/i.test(merchant)) {
            suggestedCategory = 'Utilities';
          }

          if (suggestedCategory !== 'Uncategorized') {
            await prisma.transaction.update({
              where: { id: transaction.id },
              data: { category: suggestedCategory },
            });
            console.log(`[AIWorker] Updated transaction ${transaction.id} with category "${suggestedCategory}".`);
          }
        } catch (err: any) {
          // AI categorization must fail safely: transaction must remain saved!
          console.warn(`[AIWorker] AI categorization fallback triggered for job ${job.id}: ${err.message}`);
        }
      },
      {
        connection: this.redisConnection,
        concurrency: workerConfig.aiConcurrency,
      }
    );

    this.worker.on('failed', (job, err) => {
      console.warn(`[AIWorker] Job ${job?.id} failed: ${err.message}`);
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
