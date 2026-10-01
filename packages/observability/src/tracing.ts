import { randomBytes } from 'crypto';

export enum SpanStatusCode {
  UNSET = 0,
  OK = 1,
  ERROR = 2,
}

export interface SpanContext {
  traceId: string;
  spanId: string;
  traceFlags: number;
}

export interface SpanOptions {
  parent?: Span | SpanContext;
  attributes?: Record<string, any>;
  startTime?: number;
}

export interface SpanEvent {
  name: string;
  time: number;
  attributes?: Record<string, any>;
}

// ==========================================
// PRIVACY ATTRIBUTE SANITIZATION (PHASE 3C)
// Centralized sanitizer prevents leaking PII, secrets, auth tokens,
// bank account numbers, OTPs, or raw SMS to tracing backends.
// ==========================================
const SENSITIVE_KEYS = new Set([
  'authorization',
  'jwt',
  'token',
  'refreshtoken',
  'accesstoken',
  'otp',
  'otphash',
  'password',
  'passwordhash',
  'cookie',
  'set-cookie',
  'secret',
  'apikey',
  'api_key',
  'firebase_secret',
  'bankaccount',
  'accountnumber',
  'account_number',
  'rawsms',
  'sms',
  'pin',
  'cvv',
  'idtoken',
]);

export function sanitizeAttributeValue(key: string, value: any, depth = 0): any {
  if (value === null || value === undefined) return value;
  if (depth > 4) return '[MAX_DEPTH]';

  const lowerKey = key.toLowerCase();
  for (const sensitive of SENSITIVE_KEYS) {
    if (lowerKey === sensitive || lowerKey.includes(sensitive)) {
      return '[REDACTED_TELEMETRY]';
    }
  }

  if (typeof value === 'string') {
    // Detect bearer tokens or JWT strings
    if (value.startsWith('Bearer ') || /^ey[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+/.test(value)) {
      return '[REDACTED_TOKEN]';
    }
    // Mask potential bank account numbers (10-18 digits)
    if (/^\d{10,18}$/.test(value.trim()) && (lowerKey.includes('bank') || lowerKey.includes('account'))) {
      return `...${value.slice(-4)}`;
    }
    // Prevent leaking large SMS bodies in spans
    if (value.length > 500) {
      return `${value.slice(0, 500)}...[TRUNCATED]`;
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item, idx) => sanitizeAttributeValue(`${key}[${idx}]`, item, depth + 1));
  }

  if (typeof value === 'object') {
    const clean: Record<string, any> = {};
    for (const [subKey, subVal] of Object.entries(value)) {
      clean[subKey] = sanitizeAttributeValue(subKey, subVal, depth + 1);
    }
    return clean;
  }

  return value;
}

export function sanitizeAttributes(attrs: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(attrs)) {
    result[key] = sanitizeAttributeValue(key, value);
  }
  return result;
}

export class Span {
  public readonly context: SpanContext;
  public readonly parentSpanId?: string;
  public readonly name: string;
  public readonly startTime: number;
  public endTime?: number;
  public durationMs?: number;
  public status: { code: SpanStatusCode; message?: string } = { code: SpanStatusCode.UNSET };
  public attributes: Record<string, any> = {};
  public events: SpanEvent[] = [];

  constructor(
    name: string,
    context: SpanContext,
    parentSpanId?: string,
    attributes?: Record<string, any>,
    startTime?: number
  ) {
    this.name = name;
    this.context = context;
    this.parentSpanId = parentSpanId;
    this.startTime = startTime ?? Date.now();
    if (attributes) {
      this.setAttributes(attributes);
    }
  }

  setAttribute(key: string, value: any): this {
    this.attributes[key] = sanitizeAttributeValue(key, value);
    return this;
  }

  setAttributes(attributes: Record<string, any>): this {
    const sanitized = sanitizeAttributes(attributes);
    Object.assign(this.attributes, sanitized);
    return this;
  }

  setStatus(code: SpanStatusCode, message?: string): this {
    this.status = { code, message };
    return this;
  }

  recordException(err: any): this {
    this.setStatus(SpanStatusCode.ERROR, err?.message || String(err));
    this.addEvent('exception', {
      'exception.type': err?.name || 'Error',
      'exception.message': err?.message || String(err),
      'exception.stacktrace': err?.stack ? String(err.stack).slice(0, 1000) : undefined,
    });
    return this;
  }

  addEvent(name: string, attributes?: Record<string, any>): this {
    this.events.push({
      name,
      time: Date.now(),
      attributes: attributes ? sanitizeAttributes(attributes) : undefined,
    });
    return this;
  }

  end(endTime?: number): void {
    if (this.endTime) return;
    this.endTime = endTime ?? Date.now();
    this.durationMs = Math.max(0, this.endTime - this.startTime);
  }

  isRecording(): boolean {
    return !this.endTime;
  }
}

// Generate valid OpenTelemetry 16-hex byte traceId (32 chars) and 8-hex byte spanId (16 chars)
export function generateTraceId(): string {
  return randomBytes(16).toString('hex');
}

export function generateSpanId(): string {
  return randomBytes(8).toString('hex');
}

export class Tracer {
  private activeSpanStorage: Span | undefined;

  constructor(public readonly serviceName: string = 'homemind') {}

  startSpan(name: string, options?: SpanOptions): Span {
    let traceId: string;
    let parentSpanId: string | undefined;

    if (options?.parent) {
      const parentCtx = 'context' in options.parent ? options.parent.context : options.parent;
      traceId = parentCtx.traceId;
      parentSpanId = parentCtx.spanId;
    } else if (this.activeSpanStorage) {
      traceId = this.activeSpanStorage.context.traceId;
      parentSpanId = this.activeSpanStorage.context.spanId;
    } else {
      traceId = generateTraceId();
    }

    const spanId = generateSpanId();
    const context: SpanContext = {
      traceId,
      spanId,
      traceFlags: 1, // SAMPLED
    };

    const span = new Span(name, context, parentSpanId, options?.attributes, options?.startTime);
    span.setAttribute('service.name', this.serviceName);
    return span;
  }

  async withSpan<T>(span: Span, fn: (span: Span) => Promise<T> | T): Promise<T> {
    const prev = this.activeSpanStorage;
    this.activeSpanStorage = span;
    try {
      const result = await fn(span);
      if (span.status.code === SpanStatusCode.UNSET) {
        span.setStatus(SpanStatusCode.OK);
      }
      return result;
    } catch (err: any) {
      span.recordException(err);
      throw err;
    } finally {
      span.end();
      this.activeSpanStorage = prev;
    }
  }

  getActiveSpan(): Span | undefined {
    return this.activeSpanStorage;
  }

  // W3C Trace Context propagator (extracts traceparent header: 00-traceId-spanId-flags)
  extract(carrier: Record<string, any>): SpanContext | undefined {
    const traceparent =
      carrier['traceparent'] ||
      carrier['Traceparent'] ||
      carrier['TRACEPARENT'];

    if (typeof traceparent === 'string') {
      const parts = traceparent.trim().split('-');
      if (parts.length >= 4 && parts[0] === '00' && parts[1].length === 32 && parts[2].length === 16) {
        return {
          traceId: parts[1],
          spanId: parts[2],
          traceFlags: parseInt(parts[3], 16) || 1,
        };
      }
    }
    return undefined;
  }

  inject(spanContext: SpanContext, carrier: Record<string, any>): void {
    const flags = spanContext.traceFlags.toString(16).padStart(2, '0');
    carrier['traceparent'] = `00-${spanContext.traceId}-${spanContext.spanId}-${flags}`;
  }
}

export const tracer = new Tracer('homemind');
