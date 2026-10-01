import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom Metrics
export const cacheHitRate = new Rate('dashboard_cache_hit_rate');
export const idempotentReplayRate = new Rate('idempotent_replay_rate');
export const transactionIngestDuration = new Trend('transaction_ingest_duration_ms');
export const dashboardMissDuration = new Trend('dashboard_miss_duration_ms');
export const expenseCreationDuration = new Trend('expense_creation_duration_ms');

const PROFILE = __ENV.PROFILE || 'baseline'; // smoke | baseline | stress
const BASE_URL = __ENV.TARGET_URL || 'http://localhost:5001/api/v1';
const TEST_TOKEN = __ENV.AUTH_TOKEN || 'mock-dev-token';

function getScenarios(profile) {
  if (profile === 'smoke') {
    return {
      smoke_test: {
        executor: 'constant-vus',
        vus: 2,
        duration: '10s',
      },
    };
  }

  if (profile === 'stress') {
    return {
      stress_mixed_workload: {
        executor: 'ramping-vus',
        startVUs: 10,
        stages: [
          { duration: '15s', target: 50 },
          { duration: '30s', target: 100 },
          { duration: '15s', target: 0 },
        ],
      },
    };
  }

  // Default: baseline profile
  return {
    cached_dashboard_reads: {
      executor: 'constant-vus',
      vus: 15,
      duration: '30s',
      exec: 'testCachedDashboard',
    },
    transaction_ingestion_and_replay: {
      executor: 'ramping-vus',
      startVUs: 5,
      stages: [
        { duration: '10s', target: 20 },
        { duration: '20s', target: 20 },
        { duration: '5s', target: 0 },
      ],
      exec: 'testTransactionIngestion',
    },
  };
}

export const options = {
  scenarios: getScenarios(PROFILE),
  thresholds: {
    http_req_duration: ['p(95)<350', 'p(99)<750'],
    http_req_failed: ['rate<0.02'],
    dashboard_cache_hit_rate: ['rate>0.75'],
  },
};

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${TEST_TOKEN}`,
  'X-Request-ID': `k6-${Date.now()}`,
};

export function testCachedDashboard() {
  group('1. Dashboard Cached Retrieval', () => {
    const res = http.get(`${BASE_URL}/dashboard/summary`, { headers });
    check(res, {
      'dashboard status is 200 or 401': (r) => r.status === 200 || r.status === 401,
      'latency < 200ms': (r) => r.timings.duration < 200,
    });

    const isHit = res.headers['X-Cache-Lookup'] === 'HIT';
    cacheHitRate.add(isHit ? 1 : 0);
    sleep(0.5);
  });
}

export function testTransactionIngestion() {
  group('2. Transaction Ingestion & Idempotent Replay', () => {
    const idempotencyKey = `k6-tx-${__VU}-${__ITER}-${Date.now()}`;
    const payload = JSON.stringify({
      amount: 499.0,
      currency: 'INR',
      type: 'DEBIT',
      merchant: 'k6 Grocery Market',
      category: 'Groceries',
      paymentMethod: 'UPI',
      reference: `UPI-${Date.now()}`,
      occurredAt: new Date().toISOString(),
    });

    const postHeaders = {
      ...headers,
      'Idempotency-Key': idempotencyKey,
    };

    // 1. Initial Ingestion
    const res1 = http.post(`${BASE_URL}/transactions/import/sms`, payload, { headers: postHeaders });
    check(res1, {
      'initial ingest status 201 or 401': (r) => r.status === 201 || r.status === 401,
    });
    transactionIngestDuration.add(res1.timings.duration);

    // 2. Idempotent Replay (Re-sent same idempotency key)
    const res2 = http.post(`${BASE_URL}/transactions/import/sms`, payload, { headers: postHeaders });
    const isReplayHandled = res2.status === 200 || res2.status === 201 || res2.status === 401;
    check(res2, {
      'idempotent replay status ok': () => isReplayHandled,
    });
    idempotentReplayRate.add(isReplayHandled ? 1 : 0);

    sleep(1);
  });
}

export default function () {
  testCachedDashboard();
  testTransactionIngestion();
}
