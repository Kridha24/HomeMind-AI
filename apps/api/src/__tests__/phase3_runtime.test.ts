import assert from 'assert';
import {
  tracer,
  SpanStatusCode,
  sanitizeAttributeValue,
  sanitizeAttributes,
  metricsRegistry,
  Counter,
  Gauge,
  Histogram,
  httpRequestsTotal,
} from '@homemind/observability';
import {
  checkRateLimit,
  hashIdentity,
  checkOTPSendAbuse,
  checkOTPVerifyLockout,
} from '../infrastructure/rate-limit';
import {
  objectStorage,
  LocalStorageProvider,
} from '../infrastructure/storage';
import {
  CircuitBreaker,
  CircuitState,
} from '../infrastructure/resilience';

async function runPhase3Tests() {
  console.log('🧪 Starting Phase 3 Production Runtime, Telemetry & Security Test Suite...\n');
  let passed = 0;

  // =========================================================================
  // 1. OPENTELEMETRY TRACING & W3C PROPAGATION
  // =========================================================================
  {
    const span = tracer.startSpan('test_root_operation');
    assert.strictEqual(span.context.traceId.length, 32, 'TraceId must be 32-hex characters');
    assert.strictEqual(span.context.spanId.length, 16, 'SpanId must be 16-hex characters');

    // Test W3C Traceparent injection & extraction
    const carrier: Record<string, string> = {};
    tracer.inject(span.context, carrier);
    assert(carrier['traceparent'], 'traceparent header must be injected');
    assert(carrier['traceparent'].startsWith('00-'), 'traceparent must start with version 00');

    const extracted = tracer.extract(carrier);
    assert.strictEqual(extracted?.traceId, span.context.traceId, 'Extracted traceId must match');
    assert.strictEqual(extracted?.spanId, span.context.spanId, 'Extracted spanId must match');

    // Test child span inherits parent traceId
    const childSpan = tracer.startSpan('test_child_operation', { parent: span });
    assert.strictEqual(childSpan.context.traceId, span.context.traceId, 'Child must inherit parent traceId');
    assert.strictEqual(childSpan.parentSpanId, span.context.spanId, 'Child must reference parent spanId');

    span.end();
    childSpan.end();
    console.log('  ✅ PASS: OpenTelemetry: W3C Trace Context generation, propagation, and inheritance');
    passed++;
  }

  // =========================================================================
  // 2. TELEMETRY PRIVACY & ATTRIBUTE SANITIZATION
  // =========================================================================
  {
    const rawAttributes = {
      'user.id': 'user-123',
      'auth.token': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy',
      'user.password': 'SuperSecretPassword!@#',
      'otp.code': '123456',
      'bank.account': '12345678901234',
      'safe.merchant': 'Starbucks Coffee',
    };

    const sanitized = sanitizeAttributes(rawAttributes);
    assert.strictEqual(sanitized['auth.token'], '[REDACTED_TELEMETRY]', 'Token must be redacted');
    assert.strictEqual(sanitized['user.password'], '[REDACTED_TELEMETRY]', 'Password must be redacted');
    assert.strictEqual(sanitized['otp.code'], '[REDACTED_TELEMETRY]', 'OTP must be redacted');
    assert.strictEqual(sanitized['bank.account'], '...1234', 'Bank account must be masked to last 4 digits');
    assert.strictEqual(sanitized['safe.merchant'], 'Starbucks Coffee', 'Safe business data must be preserved');

    console.log('  ✅ PASS: Privacy Sanitization: Tokens, passwords, OTPs, and bank accounts scrubbed');
    passed++;
  }

  // =========================================================================
  // 3. PROMETHEUS METRICS & CARDINALITY PROTECTION
  // =========================================================================
  {
    const testCounter = new Counter('test_counter_total', 'Test counter');
    testCounter.inc({ service: 'api', method: 'GET', userId: 'unbounded-123' }, 2);

    const rendered = testCounter.toPrometheus();
    assert(rendered.includes('service="api"'), 'Bounded label must be preserved');
    assert(rendered.includes('method="GET"'), 'Bounded label must be preserved');
    assert(!rendered.includes('unbounded-123'), 'High-cardinality userId must be dropped by label validator');

    const metricsText = metricsRegistry.getMetricsText();
    assert(metricsText.includes('# TYPE http_requests_total counter'), 'Metrics text must contain Prometheus type header');

    console.log('  ✅ PASS: Prometheus Metrics: Strict label cardinality enforcement drops high-cardinality IDs');
    passed++;
  }

  // =========================================================================
  // 4. DISTRIBUTED SLIDING WINDOW RATE LIMITER & IDENTITY HASHING
  // =========================================================================
  {
    const rawPhone = '+91 98765 43210';
    const hashed = hashIdentity(rawPhone);
    assert.strictEqual(hashed.length, 32, 'Phone hash must be 32 characters');
    assert(!hashed.includes('98765'), 'Raw phone number must not appear in hashed key');

    // Test Sliding Window rate limiter
    const testPolicy = { windowMs: 1000, max: 2 };
    const r1 = await checkRateLimit('test_policy', 'user-abc', testPolicy);
    const r2 = await checkRateLimit('test_policy', 'user-abc', testPolicy);
    const r3 = await checkRateLimit('test_policy', 'user-abc', testPolicy);

    assert.strictEqual(r1.allowed, true, 'First request must be allowed');
    assert.strictEqual(r1.remaining, 1, 'Remaining requests should be 1');
    assert.strictEqual(r2.allowed, true, 'Second request must be allowed');
    assert.strictEqual(r2.remaining, 0, 'Remaining requests should be 0');
    assert.strictEqual(r3.allowed, false, 'Third request must be blocked');
    assert(r3.retryAfterSec && r3.retryAfterSec > 0, 'Must provide retryAfterSec on block');

    console.log('  ✅ PASS: Rate Limiting: Redis sliding window blocks excess requests and hashes identities');
    passed++;
  }

  // =========================================================================
  // 5. OTP ABUSE MITIGATION ENGINE
  // =========================================================================
  {
    const phone = '+91 91234 56789';
    const ip = '192.168.1.100';

    // 1. Initial send allowed
    const send1 = await checkOTPSendAbuse(ip, phone);
    assert.strictEqual(send1.allowed, true, 'Initial OTP send must be permitted');

    // 2. Immediate second send blocked by 60s cooldown
    const send2 = await checkOTPSendAbuse(ip, phone);
    assert.strictEqual(send2.allowed, false, 'Immediate re-request must be blocked by cooldown');
    assert(send2.reason?.includes('cooldown') || send2.reason?.includes('60 seconds'), 'Reason must cite cooldown');

    // 3. Verify lockout after repeated failures
    const targetLockout = '+91 99999 88888';
    for (let i = 0; i < 5; i++) {
      await checkRateLimit('otp_verify_attempts', hashIdentity(targetLockout), { windowMs: 900000, max: 5 });
    }
    const lockout = await checkOTPVerifyLockout(targetLockout);
    assert.strictEqual(lockout.locked, true, 'Destination must be locked out after 5 attempts');

    console.log('  ✅ PASS: OTP Abuse Protection: Multi-layer cooldown, send limits, and lockout verified');
    passed++;
  }

  // =========================================================================
  // 6. OBJECT STORAGE ABSTRACTION & FILE SECURITY
  // =========================================================================
  {
    // Test valid signed upload URL generation
    const descriptor = await objectStorage.requestUploadUrl({
      householdId: 'h-100',
      userId: 'u-200',
      category: 'receipts',
      fileName: 'grocery_bill.jpg',
      contentType: 'image/jpeg',
      fileSizeBytes: 1024 * 1024, // 1MB
    });

    assert(descriptor.uploadUrl, 'Must return signed upload URL');
    assert(descriptor.objectKey.startsWith('household/h-100/receipts/'), 'Object key must be tenant isolated');
    assert(descriptor.objectKey.endsWith('.jpg'), 'Object key must preserve safe extension');

    // Test rejection of prohibited MIME type (e.g. script/executable)
    let rejectedMime = false;
    try {
      await objectStorage.requestUploadUrl({
        householdId: 'h-100',
        userId: 'u-200',
        category: 'documents',
        fileName: 'malicious.sh',
        contentType: 'application/x-sh',
        fileSizeBytes: 500,
      });
    } catch {
      rejectedMime = true;
    }
    assert(rejectedMime, 'Executable / script MIME type must be rejected');

    // Test rejection of oversized file (> 10MB)
    let rejectedSize = false;
    try {
      await objectStorage.requestUploadUrl({
        householdId: 'h-100',
        userId: 'u-200',
        category: 'receipts',
        fileName: 'huge.png',
        contentType: 'image/png',
        fileSizeBytes: 15 * 1024 * 1024, // 15MB
      });
    } catch {
      rejectedSize = true;
    }
    assert(rejectedSize, 'Files exceeding 10MB limit must be rejected');

    console.log('  ✅ PASS: Object Storage: Signed URL creation and file security validation enforced');
    passed++;
  }

  // =========================================================================
  // 7. CIRCUIT BREAKER RESILIENCE & STATE TRANSITIONS
  // =========================================================================
  {
    const breaker = new CircuitBreaker({
      name: 'test-breaker',
      failureThreshold: 2,
      resetTimeoutMs: 100,
      timeoutMs: 1000,
    });

    assert.strictEqual(breaker.state, CircuitState.CLOSED, 'Breaker must initialize CLOSED');

    // Trigger failures
    try {
      await breaker.execute(async () => { throw new Error('Downstream error 1'); });
    } catch {}
    try {
      await breaker.execute(async () => { throw new Error('Downstream error 2'); });
    } catch {}

    assert.strictEqual(breaker.state, CircuitState.OPEN, 'Breaker must transition to OPEN after 2 failures');

    // Fast-fail test while OPEN
    let fastFailed = false;
    try {
      await breaker.execute(async () => 'ok');
    } catch (err: any) {
      if (err.message.includes('is OPEN')) {
        fastFailed = true;
      }
    }
    assert(fastFailed, 'Calls during OPEN state must fail fast without executing function');

    // Wait for reset timeout
    await new Promise((r) => setTimeout(r, 120));

    // Next call transitions to HALF_OPEN
    const result = await breaker.execute(async () => 'recovered');
    assert.strictEqual(result, 'recovered', 'Should execute in HALF_OPEN and recover');

    console.log('  ✅ PASS: Circuit Breaker: CLOSED -> OPEN -> HALF_OPEN state transitions verified');
    passed++;
  }

  console.log(`\nPhase 3 Suite Results: ${passed} passed, 0 failed.\n`);
}

runPhase3Tests().catch((err) => {
  console.error('❌ Phase 3 test failed:', err);
  process.exit(1);
});
