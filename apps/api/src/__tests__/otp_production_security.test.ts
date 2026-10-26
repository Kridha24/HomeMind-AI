import { prisma } from '../repositories/db';
import bcrypt from 'bcryptjs';
import { requestPhoneOTP, verifyPhoneOTP } from '../controllers/authController';
import { sendMobileSMS, generateCryptographicOTP } from '../services/smsService';

function createMockRes() {
  const res: any = {
    statusCode: 200,
    body: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: any) {
      this.body = data;
      return this;
    },
  };
  return res;
}

function createMockReq(body: any, headers: Record<string, string> = {}) {
  return {
    body,
    headers: {
      'user-agent': 'TestMobileDevice/1.0 (Android 14)',
      'x-forwarded-for': '127.0.0.1',
      ...headers,
    },
    socket: { remoteAddress: '127.0.0.1' },
  } as any;
}

// In-memory mock store for hermetic Prisma testing
const otpStore = new Map<string, any>();
(prisma.oTPVerification as any).findUnique = async ({ where }: any) => {
  return otpStore.get(where.identifier) || null;
};
(prisma.oTPVerification as any).upsert = async ({ where, update, create }: any) => {
  const existing = otpStore.get(where.identifier);
  const data = existing ? { ...existing, ...update } : { ...create, createdAt: new Date() };
  otpStore.set(where.identifier, data);
  return data;
};
(prisma.oTPVerification as any).update = async ({ where, data }: any) => {
  const existing = otpStore.get(where.identifier) || {};
  const updated = {
    ...existing,
    attempts: data.attempts?.increment ? (existing.attempts || 0) + 1 : (data.attempts ?? existing.attempts),
  };
  otpStore.set(where.identifier, updated);
  return updated;
};
(prisma.oTPVerification as any).delete = async ({ where }: any) => {
  const existing = otpStore.get(where.identifier);
  otpStore.delete(where.identifier);
  return existing || {};
};
(prisma.oTPVerification as any).deleteMany = async ({ where }: any) => {
  if (where?.identifier?.in) {
    for (const id of where.identifier.in) {
      otpStore.delete(id);
    }
  }
  return { count: 1 };
};

// Mock User, Household, Settings, RefreshToken for verifyPhoneOTP pipeline
const userStore = new Map<string, any>();
(prisma.user as any).findFirst = async ({ where }: any) => {
  return null;
};
(prisma.user as any).create = async ({ data, include }: any) => {
  const id = 'usr_' + Math.random().toString(36).substring(2, 9);
  const record = { id, ...data, household: { id: data.householdId, name: 'Home' } };
  userStore.set(id, record);
  return record;
};
(prisma.user as any).update = async ({ where, data, include }: any) => {
  const existing = userStore.get(where.id) || {};
  const updated = { ...existing, ...data };
  userStore.set(where.id, updated);
  return updated;
};
(prisma.household as any).create = async ({ data }: any) => ({
  id: 'hh_' + Math.random().toString(36).substring(2, 9),
  ...data,
});
(prisma.setting as any).create = async ({ data }: any) => ({ id: 'sett_1', ...data });
(prisma.dashboardConfig as any).create = async ({ data }: any) => ({ id: 'dash_1', ...data });
(prisma.refreshToken as any).create = async ({ data }: any) => ({ id: 'rt_1', ...data });

async function runOtpSecurityTests() {
  console.log('🧪 Starting HomeMind AI Production OTP Security & Leak Prevention Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(name: string, condition: boolean, extra?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name}${extra ? ` (${extra})` : ''}`);
      failed++;
    }
  }

  const originalEnv = process.env.NODE_ENV;
  const originalAllowConsole = process.env.ALLOW_OTP_CONSOLE;

  try {
    const testPhone = '9999888877';

    // -------------------------------------------------------------------------
    // TEST 1: Cryptographic OTP Generator Quality
    // -------------------------------------------------------------------------
    const codes = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const code = generateCryptographicOTP();
      assert('OTP is exactly 6 digits', /^\d{6}$/.test(code));
      codes.add(code);
    }
    assert('Cryptographic OTP generator produces high entropy (> 15 unique / 20 samples)', codes.size >= 15);

    // -------------------------------------------------------------------------
    // TEST 2: Production sendMobileSMS Fails Safely when no Gateway is Configured
    // -------------------------------------------------------------------------
    process.env.NODE_ENV = 'production';
    process.env.ALLOW_OTP_CONSOLE = 'false';

    const prodSmsResult = await sendMobileSMS(testPhone, '123456');
    assert(
      'sendMobileSMS in production fails safely when no gateway succeeds',
      prodSmsResult.success === false && prodSmsResult.provider === 'NONE'
    );
    assert(
      'sendMobileSMS production message does NOT reveal OTP code',
      !prodSmsResult.message?.includes('123456')
    );

    // -------------------------------------------------------------------------
    // TEST 3: Production requestPhoneOTP Returns 503 & Zero OTP Secrets on SMS Failure
    // -------------------------------------------------------------------------
    process.env.NODE_ENV = 'production';
    process.env.ALLOW_OTP_CONSOLE = 'false';

    const reqProdFail = createMockReq({ phoneNumber: testPhone });
    const resProdFail = createMockRes();
    await requestPhoneOTP(reqProdFail, resProdFail);

    assert('Production requestPhoneOTP returns 503 when SMS cannot be delivered', resProdFail.statusCode === 503);
    assert('Response body has no devOtp field', resProdFail.body?.devOtp === undefined);
    assert('Response body has no otp field', resProdFail.body?.otp === undefined);
    assert('Response error message does not contain numeric OTP code', !/\b\d{6}\b/.test(resProdFail.body?.error || ''));

    // -------------------------------------------------------------------------
    // TEST 4: Production requestPhoneOTP Never Leaks OTP Even if ALLOW_OTP_CONSOLE is true
    // -------------------------------------------------------------------------
    process.env.NODE_ENV = 'production';
    process.env.ALLOW_OTP_CONSOLE = 'true'; // Attacker or misconfig attempt

    const resBypassAttempt = createMockRes();
    await requestPhoneOTP(reqProdFail, resBypassAttempt);

    assert('Production blocks ALLOW_OTP_CONSOLE bypass', resBypassAttempt.body?.devOtp === undefined);
    assert('Production response body otp is undefined under bypass attempt', resBypassAttempt.body?.otp === undefined);

    // -------------------------------------------------------------------------
    // TEST 5: Legitimate Verification Lifecycle Remains Resilient
    // -------------------------------------------------------------------------
    // Pre-seed a known hash in the database to verify the verification pipeline
    const realCode = '742918';
    const otpHash = await bcrypt.hash(realCode, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const testIdentifier = `+91${testPhone}`;

    await prisma.oTPVerification.upsert({
      where: { identifier: testIdentifier },
      update: { phoneNumber: testIdentifier, otpHash, attempts: 0, expiresAt },
      create: { identifier: testIdentifier, phoneNumber: testIdentifier, otpHash, attempts: 0, expiresAt },
    });

    // 5A: Wrong code is rejected
    const reqWrong = createMockReq({ phoneNumber: testPhone, otp: '000000' });
    const resWrong = createMockRes();
    await verifyPhoneOTP(reqWrong, resWrong);
    assert('Invalid OTP is rejected with 400', resWrong.statusCode === 400);

    // 5B: Correct code is accepted and generates access & refresh tokens
    const reqRight = createMockReq({ phoneNumber: testPhone, otp: realCode, name: 'Security Audit User' });
    const resRight = createMockRes();
    await verifyPhoneOTP(reqRight, resRight);
    assert('Valid OTP verifies successfully with 200', resRight.statusCode === 200);
    assert('Valid OTP returns accessToken', typeof resRight.body?.accessToken === 'string');
    assert('Valid OTP returns refreshToken', typeof resRight.body?.refreshToken === 'string');
    assert('OTP record is consumed/deleted after successful verification', !(await prisma.oTPVerification.findUnique({ where: { identifier: testIdentifier } })));

    // -------------------------------------------------------------------------
    // TEST 6: Development Mode Retains Explicitly Configured Dev OTP Support
    // -------------------------------------------------------------------------
    process.env.NODE_ENV = 'development';
    process.env.ALLOW_OTP_CONSOLE = 'true';

    const reqDev = createMockReq({ phoneNumber: '9111222333' });
    const resDev = createMockRes();
    await requestPhoneOTP(reqDev, resDev);

    assert('Development mode returns 200 for simulated dev login', resDev.statusCode === 200);
    assert('Development mode provides devOtp for automated local test suite', typeof resDev.body?.devOtp === 'string');

    // Clean up test records
    await prisma.oTPVerification.deleteMany({ where: { identifier: { in: [testPhone, '9111222333'] } } });

    console.log(`\n==================================================`);
    console.log(`OTP SECURITY TEST RESULTS: ${passed} Passed, ${failed} Failed`);
    console.log(`==================================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } finally {
    process.env.NODE_ENV = originalEnv;
    process.env.ALLOW_OTP_CONSOLE = originalAllowConsole;
  }
}

runOtpSecurityTests().catch((err) => {
  console.error('Fatal error in OTP security tests:', err);
  process.exit(1);
});
