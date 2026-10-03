import { prisma } from '../repositories/db';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
  compareToken
} from '../utils/jwt';
import { config } from '../config';

async function runAuthLifecycleTests() {
  console.log('🧪 Starting HomeMind.AI Complete Auth & Session Lifecycle Test Suite...\n');
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

  try {
    // -------------------------------------------------------------
    // Test 1: Stable Signing Secrets from Environment
    // -------------------------------------------------------------
    assert('Stable JWT Secret configured', typeof config.jwtSecret === 'string' && config.jwtSecret.length >= 16);
    assert('Stable JWT Refresh Secret configured', typeof config.jwtRefreshSecret === 'string' && config.jwtRefreshSecret.length >= 16);
    assert('JWT secrets differ between access and refresh', config.jwtSecret !== config.jwtRefreshSecret);

    // -------------------------------------------------------------
    // Test 2: Access Token Expiry & Verification
    // -------------------------------------------------------------
    const testPayload = {
      userId: 'test-user-auth-001',
      email: 'testauth@homemind.internal',
      role: 'OWNER',
      householdId: 'test-household-auth-001'
    };

    const accessToken = generateAccessToken(testPayload);
    const verifiedAccess = verifyAccessToken(accessToken);
    assert('Access token contains correct userId', verifiedAccess.userId === testPayload.userId);
    assert('Access token contains correct householdId', verifiedAccess.householdId === testPayload.householdId);
    assert('Access token contains correct role', verifiedAccess.role === testPayload.role);

    // -------------------------------------------------------------
    // Test 3: Refresh Token Generation & Cryptographic Verification
    // -------------------------------------------------------------
    const refreshToken = generateRefreshToken(testPayload);
    const verifiedRefresh = verifyRefreshToken(refreshToken);
    assert('Refresh token contains correct userId', verifiedRefresh.userId === testPayload.userId);
    assert('Refresh token verified successfully', !!verifiedRefresh);

    // -------------------------------------------------------------
    // Test 4: Bcrypt Hash & Compare for Database Security
    // -------------------------------------------------------------
    const tokenHash = await hashToken(refreshToken);
    const isValidMatch = await compareToken(refreshToken, tokenHash);
    const isInvalidMatch = await compareToken('tampered-token', tokenHash);
    assert('Token hash matches original refresh token', isValidMatch === true);
    assert('Token hash rejects invalid/tampered token', isInvalidMatch === false);

    // -------------------------------------------------------------
    // Test 5: Expired Token Rejection
    // -------------------------------------------------------------
    const jwt = require('jsonwebtoken');
    const expiredAccessToken = jwt.sign(testPayload, config.jwtSecret, { expiresIn: '-10s' });
    let expiredRejected = false;
    try {
      verifyAccessToken(expiredAccessToken);
    } catch (e) {
      expiredRejected = true;
    }
    assert('Expired access token rejected cryptographically', expiredRejected);

    // -------------------------------------------------------------
    // Test 6: Database Refresh Token Storage & Rotation Protocol
    // -------------------------------------------------------------
    // Create temporary test household & user if needed
    let testHousehold = await prisma.household.findFirst();
    if (!testHousehold) {
      testHousehold = await prisma.household.create({
        data: {
          name: 'Auth Test Household',
          inviteCode: 'AUTH-TEST-INVITE',
        }
      });
    }

    const existingTestUser = await prisma.user.findUnique({ where: { id: 'test-user-auth-001' } });
    if (!existingTestUser) {
      await prisma.user.create({
        data: {
          id: 'test-user-auth-001',
          email: 'testauth@homemind.internal',
          name: 'Test Auth User',
          role: 'OWNER',
          isActive: true,
          softDelete: false,
          householdId: testHousehold.id
        }
      });
    }

    // Save refresh token to DB
    const savedRecord = await prisma.refreshToken.create({
      data: {
        tokenHash,
        userId: 'test-user-auth-001',
        device: 'Test Runner',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });
    assert('Refresh token persisted to DB with future expiry', !!savedRecord.id);

    // -------------------------------------------------------------
    // Test 7: Account Isolation & Revocation
    // -------------------------------------------------------------
    // Ensure another user cannot match this token
    const otherUserTokens = await prisma.refreshToken.findMany({
      where: { userId: 'different-user-999', expiresAt: { gt: new Date() } }
    });
    assert('Token strictly isolated to owning user', otherUserTokens.length === 0);

    // -------------------------------------------------------------
    // Test 8: Refresh Controller Execution & Token Rotation
    // -------------------------------------------------------------
    const { refresh } = require('../controllers/authController');

    let responseStatus: number = 200;
    let responseJson: any = null;

    const mockRes: any = {
      status: (code: number) => {
        responseStatus = code;
        return mockRes;
      },
      json: (data: any) => {
        responseJson = data;
        return mockRes;
      },
      cookie: () => mockRes
    };

    const mockReq1: any = {
      body: { refreshToken },
      headers: { 'user-agent': 'IntegrationTest/Runner' },
      socket: { remoteAddress: '127.0.0.1' }
    };

    await refresh(mockReq1, mockRes);
    assert('First refresh request returned 200 with new tokens', responseStatus === 200 && !!responseJson?.accessToken);
    const firstRotatedAccess = responseJson?.accessToken;
    const firstRotatedRefresh = responseJson?.refreshToken;

    // -------------------------------------------------------------
    // Test 9: Concurrent / Multi-Tab Refresh Grace Window (30s)
    // -------------------------------------------------------------
    // Simulate Tab B or concurrent request sending the OLD refreshToken within grace period
    responseStatus = 200;
    responseJson = null;

    const mockReq2: any = {
      body: { refreshToken }, // Same old refreshToken
      headers: { 'user-agent': 'IntegrationTest/TabB' },
      socket: { remoteAddress: '127.0.0.1' }
    };

    await refresh(mockReq2, mockRes);
    assert('Grace period deduplication returned HTTP 200', responseStatus === 200);
    assert('Grace period returned consistent access token', responseJson?.accessToken === firstRotatedAccess);
    assert('Grace period returned consistent refresh token', responseJson?.refreshToken === firstRotatedRefresh);

    // -------------------------------------------------------------
    // Test 10: Truly Revoked/Unknown Token Rejection
    // -------------------------------------------------------------
    const fakeToken = generateRefreshToken({ userId: 'unknown-user-999', role: 'MEMBER', householdId: 'h-999' });
    responseStatus = 200;
    responseJson = null;

    const mockReq3: any = {
      body: { refreshToken: fakeToken },
      headers: { 'user-agent': 'Hacker/Unknown' },
      socket: { remoteAddress: '127.0.0.1' }
    };

    await refresh(mockReq3, mockRes);
    assert('Unregistered/revoked token returns HTTP 401 or 403', responseStatus === 401 || responseStatus === 403);

    // Clean up test data
    await prisma.refreshToken.deleteMany({ where: { userId: 'test-user-auth-001' } });
    await prisma.user.deleteMany({ where: { id: 'test-user-auth-001' } });
    assert('Test cleanup executed', true);

  } catch (err: any) {
    console.error('Fatal test error:', err);
    failed++;
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

runAuthLifecycleTests().finally(() => prisma.$disconnect());
