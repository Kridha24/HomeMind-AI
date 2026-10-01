import { Worker, Job } from 'bullmq';
import { prisma } from '@homemind/database';
import { QUEUE_NAMES, AICategorizationJobPayload } from '@homemind/shared';
import {
  tracer,
  bullmqJobsStartedTotal,
  bullmqJobsCompletedTotal,
  bullmqJobsFailedTotal,
  bullmqJobDurationSeconds,
  aiJobsFailedTotal,
} from '@homemind/observability';
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
        const jobStartTime = Date.now();
        const labels = { service: 'homemind-worker', queue: QUEUE_NAMES.AI, job_name: job.name };
        bullmqJobsStartedTotal.inc(labels);

        const traceContext = job.data.traceId
          ? {
              traceId: job.data.traceId,
              spanId: job.data.spanId || '0000000000000000',
              traceFlags: 1,
            }
          : undefined;

        const span = tracer.startSpan('worker.ai_categorization', {
          parent: traceContext,
          attributes: {
            'bullmq.job_id': job.id,
            'bullmq.queue': QUEUE_NAMES.AI,
          },
        });

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
            span.end();
            return;
          }

          // Rule-based heuristic or AI call simulation
          if (transaction.category && transaction.category !== 'Other' && transaction.category !== 'Uncategorized') {
            span.end();
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

          span.end();
          const durationSec = (Date.now() - jobStartTime) / 1000;
          bullmqJobsCompletedTotal.inc(labels);
          bullmqJobDurationSeconds.observe(durationSec, labels);
        } catch (err: any) {
          // AI categorization must fail safely: transaction must remain saved!
          console.warn(`[AIWorker] AI categorization fallback triggered for job ${job.id}: ${err.message}`);
          span.recordException(err);
          span.end();
          bullmqJobsFailedTotal.inc({ ...labels, error_type: 'processing_error' });
          aiJobsFailedTotal.inc({ service: 'homemind-worker', operation: 'categorization', reason: err.message || 'unknown' });
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
