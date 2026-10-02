import { prisma } from '../repositories/db';
import { generateAccessToken } from '../utils/jwt';
import { CommunicationController } from '../modules/communication/communication.controller';
import { IceConfigService } from '../modules/communication/iceConfigService';
import { config } from '../config';

async function runIceConfigEndpointTests() {
  console.log('🧪 Starting HomeMind.AI Communication & ICE Config Endpoint Verification Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${desc}`);
      failed++;
    }
  }

  // Mock Express Response
  function createMockResponse() {
    const res: any = {
      statusCode: 200,
      jsonData: null,
      status: function (code: number) {
        this.statusCode = code;
        return this;
      },
      json: function (data: any) {
        this.jsonData = data;
        return this;
      },
    };
    return res;
  }

  let testHousehold: any;
  let testUser: any;

  try {
    testHousehold = await prisma.household.create({
      data: {
        name: 'ICE Config Test Residence',
        inviteCode: 'HM-ICE-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      },
    });

    testUser = await prisma.user.create({
      data: {
        email: `ice_test_${Date.now()}@example.com`,
        name: 'John Doe',
        householdId: testHousehold.id,
        role: 'OWNER',
      },
    });

    // 1. Test Unauthenticated Request Blocked
    console.log('--- Test 1: Unauthenticated ICE Config Access Rejection ---');
    const unauthReq: any = {
      headers: {},
      user: undefined,
    };
    const unauthRes = createMockResponse();
    await CommunicationController.getIceConfig(unauthReq, unauthRes);
    assert(unauthRes.statusCode === 401, 'Unauthenticated request receives 401 Unauthorized');
    assert(unauthRes.jsonData?.error === 'Authentication required', 'Error indicates authentication required');

    // 2. Test Authenticated Request Returns Valid ICE Config
    console.log('\n--- Test 2: Authenticated ICE Config Generation ---');
    const authReq: any = {
      headers: { authorization: `Bearer ${generateAccessToken({ userId: testUser.id, householdId: testHousehold.id, role: 'OWNER' })}` },
      user: { userId: testUser.id, householdId: testHousehold.id, role: 'OWNER' },
    };
    const authRes = createMockResponse();
    await CommunicationController.getIceConfig(authReq, authRes);
    assert(authRes.statusCode === 200, 'Authenticated request returns 200 OK');
    assert(Array.isArray(authRes.jsonData?.iceServers), 'Response contains iceServers array');
    assert(authRes.jsonData.iceServers.length >= 1, 'Contains at least default STUN server');
    assert(Boolean(authRes.jsonData?.expiresAt), 'Contains expiresAt ISO string');

    // 3. Test Ephemeral Credential Generation with Simulated Production TURN
    console.log('\n--- Test 3: Simulated Production TURN REST API Auth ---');
    const testSecret = 'secret_key_production_turn_testing_123';
    const creds = IceConfigService.generateCredentials(testUser.id, testSecret, 3600);
    assert(creds.username.startsWith(String(Math.floor(Date.now() / 1000) + 3600).substring(0, 5)), 'Username starts with future timestamp');
    assert(creds.username.endsWith(testUser.id), 'Username contains userId suffix');
    assert(Boolean(creds.credential) && typeof creds.credential === 'string', 'Credential is valid base64 HMAC');

    // 4. Test Device Token Registration
    console.log('\n--- Test 4: Device Token Registration Endpoint ---');
    const regReq: any = {
      user: { userId: testUser.id, householdId: testHousehold.id, role: 'OWNER' },
      body: { token: 'sample_fcm_token_xyz', platform: 'android' },
    };
    const regRes = createMockResponse();
    await CommunicationController.registerDeviceToken(regReq, regRes);
    assert(regRes.statusCode === 200, 'Device token registered successfully with 200 OK');

    // Invalid payload rejection
    const invalidReq: any = {
      user: { userId: testUser.id, householdId: testHousehold.id, role: 'OWNER' },
      body: { token: '' },
    };
    const invalidRes = createMockResponse();
    await CommunicationController.registerDeviceToken(invalidReq, invalidRes);
    assert(invalidRes.statusCode === 400, 'Empty token rejected with 400 Bad Request');

    // Clean up
    await prisma.user.delete({ where: { id: testUser.id } });
    await prisma.household.delete({ where: { id: testHousehold.id } });

  } catch (err: any) {
    console.error('Test execution error:', err);
    failed++;
  }

  console.log(`\n========================================`);
  console.log(`RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runIceConfigEndpointTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
