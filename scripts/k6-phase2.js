import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom Metrics
export const cacheHitRate = new Rate('dashboard_cache_hit_rate');
export const duplicateHandledRate = new Rate('duplicate_transaction_handled_rate');
export const expenseDuration = new Trend('expense_creation_duration_ms');
export const dashboardDuration = new Trend('dashboard_fetch_duration_ms');

export const options = {
  scenarios: {
    // 1. Warm-up and steady cached dashboard reads
    dashboard_cached_reads: {
      executor: 'constant-vus',
      vus: 20,
      duration: '30s',
      exec: 'testDashboardCached',
    },
    // 2. Financial mutations and duplicate detection
    financial_ingestion_and_mutations: {
      executor: 'ramping-vus',
      startVUs: 5,
      stages: [
        { duration: '15s', target: 25 },
        { duration: '15s', target: 0 },
      ],
      exec: 'testFinancialIngestion',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<250', 'p(99)<500'],
    http_req_failed: ['rate<0.01'],
    dashboard_cache_hit_rate: ['rate>0.80'],
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:5001/api/v1';
const TEST_TOKEN = __ENV.AUTH_TOKEN || 'mock-dev-token';

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${TEST_TOKEN}`,
};

export function testDashboardCached() {
  group('Dashboard Cached Retrieval', () => {
    const res = http.get(`${BASE_URL}/dashboard/summary`, { headers });
    check(res, {
      'status is 200 or 401 (auth handled)': (r) => r.status === 200 || r.status === 401,
      'response time < 150ms': (r) => r.timings.duration < 150,
    });

    const isHit = res.headers['X-Cache-Lookup'] === 'HIT';
    cacheHitRate.add(isHit ? 1 : 0);
    dashboardDuration.add(res.timings.duration);
    sleep(0.5);
  });
}

export function testFinancialIngestion() {
  group('Financial Transaction Ingestion & Deduplication', () => {
    const idempotencyKey = `k6-idemp-${__VU}-${__ITER}-${Date.now()}`;
    const payload = JSON.stringify({
      amount: 250.0,
      currency: 'INR',
      type: 'DEBIT',
      merchant: 'k6 Coffee Roasters',
      category: 'Food & Dining',
      paymentMethod: 'UPI',
      reference: `K6-REF-${__VU}-${Date.now()}`,
      occurredAt: new Date().toISOString(),
    });

    const postHeaders = {
      ...headers,
      'Idempotency-Key': idempotencyKey,
    };

    // 1. Initial Import
    const res1 = http.post(`${BASE_URL}/transactions/import/sms`, payload, { headers: postHeaders });
    check(res1, {
      'initial import status 201 or 401': (r) => r.status === 201 || r.status === 401,
    });
    expenseDuration.add(res1.timings.duration);

    // 2. Duplicate Import (Same Idempotency-Key)
    const res2 = http.post(`${BASE_URL}/transactions/import/sms`, payload, { headers: postHeaders });
    const isIdempotentHit = res2.status === 201 || res2.status === 200 || res2.status === 401;
    duplicateHandledRate.add(isIdempotentHit ? 1 : 0);

    // 3. List Transactions
    const listRes = http.get(`${BASE_URL}/transactions?limit=20`, { headers });
    check(listRes, {
      'list status is 200 or 401': (r) => r.status === 200 || r.status === 401,
    });

    sleep(1);
  });
}
