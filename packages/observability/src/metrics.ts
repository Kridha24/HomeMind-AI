// =======================================================================
// PROMETHEUS-COMPATIBLE METRICS REGISTRY (PHASE 3D)
// Rules:
// 1. Strict label cardinality enforcement — reject unbounded identifiers
//    like userId, householdId, transactionId, requestId, jobId.
// 2. High-performance lock-free in-memory counters, gauges, histograms.
// 3. Prometheus exposition format generator for /metrics endpoint.
// =======================================================================

const FORBIDDEN_LABEL_KEYS = new Set([
  'userid',
  'user_id',
  'householdid',
  'household_id',
  'transactionid',
  'transaction_id',
  'requestid',
  'request_id',
  'jobid',
  'job_id',
  'eventid',
  'event_id',
  'phone',
  'phonenumber',
  'email',
  'jwt',
  'token',
]);

function validateLabels(labels?: Record<string, string | number>): Record<string, string> {
  if (!labels) return {};
  const cleaned: Record<string, string> = {};

  for (const [key, value] of Object.entries(labels)) {
    const lowerKey = key.toLowerCase();
    if (FORBIDDEN_LABEL_KEYS.has(lowerKey)) {
      // Drop high-cardinality label to protect Prometheus memory
      continue;
    }
    // Sanitize label name (only [a-zA-Z_][a-zA-Z0-9_]*)
    const safeKey = key.replace(/[^a-zA-Z0-9_]/g, '_');
    // Sanitize label value (strip newlines, quotes)
    const safeValue = String(value).replace(/[\r\n"]/g, '');
    cleaned[safeKey] = safeValue;
  }
  return cleaned;
}

function formatLabelString(labels: Record<string, string>): string {
  const entries = Object.entries(labels);
  if (entries.length === 0) return '';
  const formatted = entries
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}="${v}"`)
    .join(',');
  return `{${formatted}}`;
}

export class Counter {
  private values = new Map<string, number>();

  constructor(
    public readonly name: string,
    public readonly help: string
  ) {}

  inc(labels?: Record<string, string | number>, amount = 1): void {
    if (amount <= 0) return;
    const clean = validateLabels(labels);
    const key = formatLabelString(clean);
    const curr = this.values.get(key) || 0;
    this.values.set(key, curr + amount);
  }

  get(labels?: Record<string, string | number>): number {
    const clean = validateLabels(labels);
    const key = formatLabelString(clean);
    return this.values.get(key) || 0;
  }

  reset(): void {
    this.values.clear();
  }

  toPrometheus(): string {
    let out = `# HELP ${this.name} ${this.help}\n# TYPE ${this.name} counter\n`;
    if (this.values.size === 0) {
      out += `${this.name} 0\n`;
      return out;
    }
    for (const [labels, value] of this.values.entries()) {
      out += `${this.name}${labels} ${value}\n`;
    }
    return out;
  }
}

export class Gauge {
  private values = new Map<string, number>();

  constructor(
    public readonly name: string,
    public readonly help: string
  ) {}

  set(value: number, labels?: Record<string, string | number>): void {
    const clean = validateLabels(labels);
    const key = formatLabelString(clean);
    this.values.set(key, value);
  }

  inc(labels?: Record<string, string | number>, amount = 1): void {
    const clean = validateLabels(labels);
    const key = formatLabelString(clean);
    const curr = this.values.get(key) || 0;
    this.values.set(key, curr + amount);
  }

  dec(labels?: Record<string, string | number>, amount = 1): void {
    const clean = validateLabels(labels);
    const key = formatLabelString(clean);
    const curr = this.values.get(key) || 0;
    this.values.set(key, curr - amount);
  }

  get(labels?: Record<string, string | number>): number {
    const clean = validateLabels(labels);
    const key = formatLabelString(clean);
    return this.values.get(key) || 0;
  }

  reset(): void {
    this.values.clear();
  }

  toPrometheus(): string {
    let out = `# HELP ${this.name} ${this.help}\n# TYPE ${this.name} gauge\n`;
    if (this.values.size === 0) {
      out += `${this.name} 0\n`;
      return out;
    }
    for (const [labels, value] of this.values.entries()) {
      out += `${this.name}${labels} ${value}\n`;
    }
    return out;
  }
}

export class Histogram {
  private buckets: number[];
  private count = new Map<string, number>();
  private sum = new Map<string, number>();
  private bucketCounts = new Map<string, Map<number, number>>();

  constructor(
    public readonly name: string,
    public readonly help: string,
    buckets = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
  ) {
    this.buckets = [...buckets].sort((a, b) => a - b);
  }

  observe(value: number, labels?: Record<string, string | number>): void {
    const clean = validateLabels(labels);
    const key = formatLabelString(clean);

    // Update count & sum
    this.count.set(key, (this.count.get(key) || 0) + 1);
    this.sum.set(key, (this.sum.get(key) || 0) + value);

    // Update buckets
    if (!this.bucketCounts.has(key)) {
      this.bucketCounts.set(key, new Map());
    }
    const bMap = this.bucketCounts.get(key)!;
    for (const b of this.buckets) {
      if (value <= b) {
        bMap.set(b, (bMap.get(b) || 0) + 1);
      }
    }
  }

  toPrometheus(): string {
    let out = `# HELP ${this.name} ${this.help}\n# TYPE ${this.name} histogram\n`;
    if (this.count.size === 0) {
      out += `${this.name}_count 0\n${this.name}_sum 0\n`;
      return out;
    }

    for (const [key, totalCount] of this.count.entries()) {
      const bMap = this.bucketCounts.get(key) || new Map();
      let cumulative = 0;

      for (const b of this.buckets) {
        cumulative = bMap.get(b) || cumulative;
        const bLabel = key === '' ? `{le="${b}"}` : `${key.slice(0, -1)},le="${b}"}`;
        out += `${this.name}_bucket${bLabel} ${cumulative}\n`;
      }

      const infLabel = key === '' ? `{le="+Inf"}` : `${key.slice(0, -1)},le="+Inf"}`;
      out += `${this.name}_bucket${infLabel} ${totalCount}\n`;
      out += `${this.name}_sum${key} ${this.sum.get(key) || 0}\n`;
      out += `${this.name}_count${key} ${totalCount}\n`;
    }
    return out;
  }
}

export class MetricsRegistry {
  private counters = new Map<string, Counter>();
  private gauges = new Map<string, Gauge>();
  private histograms = new Map<string, Histogram>();

  registerCounter(name: string, help: string): Counter {
    if (this.counters.has(name)) return this.counters.get(name)!;
    const c = new Counter(name, help);
    this.counters.set(name, c);
    return c;
  }

  registerGauge(name: string, help: string): Gauge {
    if (this.gauges.has(name)) return this.gauges.get(name)!;
    const g = new Gauge(name, help);
    this.gauges.set(name, g);
    return g;
  }

  registerHistogram(name: string, help: string, buckets?: number[]): Histogram {
    if (this.histograms.has(name)) return this.histograms.get(name)!;
    const h = new Histogram(name, help, buckets);
    this.histograms.set(name, h);
    return h;
  }

  getMetricsText(): string {
    let output = '';
    for (const counter of this.counters.values()) {
      output += counter.toPrometheus() + '\n';
    }
    for (const gauge of this.gauges.values()) {
      output += gauge.toPrometheus() + '\n';
    }
    for (const histogram of this.histograms.values()) {
      output += histogram.toPrometheus() + '\n';
    }
    return output;
  }
}

export const metricsRegistry = new MetricsRegistry();

// ==========================================
// MANDATORY PHASE 3 REQUIRED METRICS
// ==========================================
export const httpRequestsTotal = metricsRegistry.registerCounter(
  'http_requests_total',
  'Total HTTP requests processed by endpoint and status'
);

export const httpRequestDurationSeconds = metricsRegistry.registerHistogram(
  'http_request_duration_seconds',
  'HTTP request latency in seconds',
  [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
);

export const httpErrorsTotal = metricsRegistry.registerCounter(
  'http_errors_total',
  'Total HTTP errors returned by status code and route'
);

export const dbQueryDurationSeconds = metricsRegistry.registerHistogram(
  'db_query_duration_seconds',
  'Database query duration in seconds',
  [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5]
);

export const redisCacheHitsTotal = metricsRegistry.registerCounter(
  'redis_cache_hits_total',
  'Total cache hits in Redis layer'
);

export const redisCacheMissesTotal = metricsRegistry.registerCounter(
  'redis_cache_misses_total',
  'Total cache misses in Redis layer'
);

export const redisErrorsTotal = metricsRegistry.registerCounter(
  'redis_errors_total',
  'Total Redis connection and command errors'
);

export const bullmqJobsStartedTotal = metricsRegistry.registerCounter(
  'bullmq_jobs_started_total',
  'Total BullMQ jobs picked up by workers'
);

export const bullmqJobsCompletedTotal = metricsRegistry.registerCounter(
  'bullmq_jobs_completed_total',
  'Total BullMQ jobs successfully completed'
);

export const bullmqJobsFailedTotal = metricsRegistry.registerCounter(
  'bullmq_jobs_failed_total',
  'Total BullMQ jobs failed'
);

export const bullmqJobDurationSeconds = metricsRegistry.registerHistogram(
  'bullmq_job_duration_seconds',
  'Duration of BullMQ job processing in seconds',
  [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10, 30]
);

export const bullmqQueueDepth = metricsRegistry.registerGauge(
  'bullmq_queue_depth',
  'Current queue depth across BullMQ job states'
);

export const outboxPendingCount = metricsRegistry.registerGauge(
  'outbox_pending_count',
  'Number of pending outbox events awaiting dispatch'
);

export const outboxOldestEventAgeSeconds = metricsRegistry.registerGauge(
  'outbox_oldest_event_age_seconds',
  'Age of the oldest un-dispatched outbox event in seconds'
);

export const outboxDispatchFailuresTotal = metricsRegistry.registerCounter(
  'outbox_dispatch_failures_total',
  'Total outbox dispatcher errors'
);

export const transactionIngestionTotal = metricsRegistry.registerCounter(
  'transaction_ingestion_total',
  'Total transactions ingested via API or SMS parser'
);

export const transactionIngestionFailuresTotal = metricsRegistry.registerCounter(
  'transaction_ingestion_failures_total',
  'Total transaction ingestion failures'
);

export const transactionDuplicateTotal = metricsRegistry.registerCounter(
  'transaction_duplicate_total',
  'Total duplicate transactions detected via idempotency'
);

export const smsParserFailuresTotal = metricsRegistry.registerCounter(
  'sms_parser_failures_total',
  'Total SMS parsing failures across financial institutions'
);

export const aiJobsFailedTotal = metricsRegistry.registerCounter(
  'ai_jobs_failed_total',
  'Total AI asynchronous categorizer/advisory failures'
);

export const notificationJobsFailedTotal = metricsRegistry.registerCounter(
  'notification_jobs_failed_total',
  'Total notification delivery failures'
);
