import { logger } from '@homemind/observability';

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerOptions {
  name: string;
  failureThreshold?: number; // Failures before opening circuit (default 5)
  resetTimeoutMs?: number; // Time in OPEN state before trying HALF_OPEN (default 30,000ms)
  halfOpenSuccessThreshold?: number; // Successes in HALF_OPEN before returning to CLOSED (default 2)
  timeoutMs?: number; // Timeout per individual call (default 10,000ms)
}

export class CircuitBreakerError extends Error {
  constructor(message: string, public readonly circuitName: string) {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}

export class CircuitBreaker {
  public state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private consecutiveSuccesses: number = 0;
  private nextAttemptTime: number = 0;
  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;
  private readonly halfOpenSuccessThreshold: number;
  private readonly timeoutMs: number;
  public readonly name: string;

  constructor(options: CircuitBreakerOptions) {
    this.name = options.name;
    this.failureThreshold = options.failureThreshold ?? 5;
    this.resetTimeoutMs = options.resetTimeoutMs ?? 30000;
    this.halfOpenSuccessThreshold = options.halfOpenSuccessThreshold ?? 2;
    this.timeoutMs = options.timeoutMs ?? 10000;
  }

  async execute<T>(fn: () => Promise<T>, fallback?: () => Promise<T> | T): Promise<T> {
    const now = Date.now();

    // Check if OPEN state has expired and should transition to HALF_OPEN
    if (this.state === CircuitState.OPEN) {
      if (now >= this.nextAttemptTime) {
        this.transitionTo(CircuitState.HALF_OPEN);
      } else {
        if (fallback) {
          return await fallback();
        }
        throw new CircuitBreakerError(
          `Circuit [${this.name}] is OPEN. Fast-failing downstream call.`,
          this.name
        );
      }
    }

    // Execute with timeout
    try {
      const result = await this.executeWithTimeout(fn, this.timeoutMs);
      this.onSuccess();
      return result;
    } catch (err: any) {
      this.onFailure(err);
      if (fallback) {
        return await fallback();
      }
      throw err;
    }
  }

  private async executeWithTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    try {
      const result = await Promise.race([fn(), timeoutPromise]);
      clearTimeout(timer!);
      return result;
    } catch (err) {
      clearTimeout(timer!);
      throw err;
    }
  }

  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.consecutiveSuccesses++;
      if (this.consecutiveSuccesses >= this.halfOpenSuccessThreshold) {
        this.transitionTo(CircuitState.CLOSED);
      }
    } else if (this.state === CircuitState.CLOSED) {
      this.failureCount = 0;
    }
  }

  private onFailure(err: any): void {
    this.failureCount++;
    logger.warn(`[CircuitBreaker:${this.name}] Failure recorded: ${err.message}`, {
      state: this.state,
      failureCount: this.failureCount,
    });

    if (this.state === CircuitState.HALF_OPEN || this.failureCount >= this.failureThreshold) {
      this.nextAttemptTime = Date.now() + this.resetTimeoutMs;
      this.transitionTo(CircuitState.OPEN);
    }
  }

  private transitionTo(newState: CircuitState): void {
    logger.info(`[CircuitBreaker:${this.name}] State transition: ${this.state} -> ${newState}`, {
      from: this.state,
      to: newState,
    });
    this.state = newState;
    if (newState === CircuitState.CLOSED) {
      this.failureCount = 0;
      this.consecutiveSuccesses = 0;
    } else if (newState === CircuitState.HALF_OPEN) {
      this.consecutiveSuccesses = 0;
    }
  }
}

/**
 * Exponential backoff with random full jitter
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    retries?: number;
    minDelayMs?: number;
    maxDelayMs?: number;
    factor?: number;
  } = {}
): Promise<T> {
  const retries = options.retries ?? 3;
  const minDelayMs = options.minDelayMs ?? 200;
  const maxDelayMs = options.maxDelayMs ?? 3000;
  const factor = options.factor ?? 2;

  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt > retries) {
        throw err;
      }
      // Calculate jittered exponential backoff
      const rawDelay = minDelayMs * Math.pow(factor, attempt - 1);
      const cappedDelay = Math.min(maxDelayMs, rawDelay);
      const jitteredDelay = Math.floor(Math.random() * cappedDelay);
      await new Promise((resolve) => setTimeout(resolve, jitteredDelay));
    }
  }
}

// Pre-configured Circuit Breakers for external providers
export const aiCircuitBreaker = new CircuitBreaker({
  name: 'ai-provider',
  failureThreshold: 4,
  resetTimeoutMs: 20000,
  timeoutMs: 15000,
});

export const emailCircuitBreaker = new CircuitBreaker({
  name: 'email-provider',
  failureThreshold: 5,
  resetTimeoutMs: 30000,
  timeoutMs: 8000,
});

export const smsCircuitBreaker = new CircuitBreaker({
  name: 'sms-provider',
  failureThreshold: 5,
  resetTimeoutMs: 30000,
  timeoutMs: 8000,
});

export const notificationCircuitBreaker = new CircuitBreaker({
  name: 'notification-provider',
  failureThreshold: 5,
  resetTimeoutMs: 30000,
  timeoutMs: 8000,
});
