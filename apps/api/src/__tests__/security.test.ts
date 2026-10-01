import { assertResourceBelongsToHousehold, requireHouseholdRole, getAuthenticatedUser } from '../middleware/auth';
import { computeTransactionHash, roundMoney } from '@homemind/shared';

// Comprehensive BOLA / IDOR Tenant Isolation Security Tests
async function runSecurityTests() {
  console.log('🧪 Starting HomeMind Security & IDOR/BOLA Isolation Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(name: string, condition: boolean) {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // Test 1: Cross-Household IDOR Resource Access Rejection
  // -------------------------------------------------------------
  const householdA = '11111111-1111-1111-1111-111111111111';
  const householdB = '22222222-2222-2222-2222-222222222222';

  let caughtIdor = false;
  try {
    assertResourceBelongsToHousehold(householdB, householdA);
  } catch (err: any) {
    caughtIdor = true;
  }
  assert('Tenant Isolation: User A blocked from accessing Household B resource', caughtIdor);

  // -------------------------------------------------------------
  // Test 2: Same-Household Authorized Resource Access
  // -------------------------------------------------------------
  let sameTenantAllowed = false;
  try {
    assertResourceBelongsToHousehold(householdA, householdA);
    sameTenantAllowed = true;
  } catch {
    sameTenantAllowed = false;
  }
  assert('Tenant Isolation: User A permitted for Household A resource', sameTenantAllowed);

  // -------------------------------------------------------------
  // Test 3: Role-Based Access Control (RBAC) Enforcement
  // -------------------------------------------------------------
  const memberReq: any = {
    user: {
      userId: 'user-001',
      householdId: householdA,
      role: 'MEMBER',
    },
  };

  let memberSettingsBlocked = false;
  try {
    requireHouseholdRole(memberReq, ['OWNER', 'ADMIN']);
  } catch {
    memberSettingsBlocked = true;
  }
  assert('RBAC: MEMBER blocked from OWNER/ADMIN settings mutation', memberSettingsBlocked);

  const ownerReq: any = {
    user: {
      userId: 'user-002',
      householdId: householdA,
      role: 'OWNER',
    },
  };

  let ownerAllowed = false;
  try {
    requireHouseholdRole(ownerReq, ['OWNER', 'ADMIN']);
    ownerAllowed = true;
  } catch {
    ownerAllowed = false;
  }
  assert('RBAC: OWNER allowed for household management action', ownerAllowed);

  // -------------------------------------------------------------
  // Test 4: Idempotency Hash Determinism & Collision Prevention
  // -------------------------------------------------------------
  const fixedDate = new Date('2026-10-01T12:00:00Z');
  const hash1 = computeTransactionHash({
    householdId: householdA,
    senderHeader: 'HDFCBK',
    amount: 450.0,
    timestamp: fixedDate,
    referenceId: 'UPI-12345',
  });

  const hash2 = computeTransactionHash({
    householdId: householdA,
    senderHeader: 'HDFCBK',
    amount: 450.0,
    timestamp: fixedDate,
    referenceId: 'UPI-12345',
  });

  const hashOtherTenant = computeTransactionHash({
    householdId: householdB,
    senderHeader: 'HDFCBK',
    amount: 450.0,
    timestamp: fixedDate,
    referenceId: 'UPI-12345',
  });

  assert('Idempotency: Identical SMS payloads generate identical hash', hash1 === hash2);
  assert('Idempotency: Cross-tenant identical transactions have distinct hashes', hash1 !== hashOtherTenant);

  // -------------------------------------------------------------
  // Test 5: Money Precision & Floating-Point Rounding Safety
  // -------------------------------------------------------------
  const sum = 0.1 + 0.2; // 0.30000000000000004
  const rounded = roundMoney(sum);
  assert('Money Model: roundMoney eliminates IEEE 754 precision drift (0.1 + 0.2 == 0.30)', rounded === 0.3);

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
