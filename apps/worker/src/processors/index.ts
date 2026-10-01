import { BaseJob } from '../jobs';

export interface JobProcessor<T = any> {
  process(job: BaseJob<T>): Promise<void>;
}

export class TransactionParsingProcessor implements JobProcessor {
  async process(job: BaseJob): Promise<void> {
    console.log(`[Worker] Executing transaction parsing job ${job.id}`);
    // Future BullMQ worker execution
  }
}
