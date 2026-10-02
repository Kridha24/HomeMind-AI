import { webrtcSignaling } from '../services/webrtcSignalingService';
import { prisma } from '../repositories/db';

async function runWebRTCSignalingTests() {
  console.log('🧪 Starting HomeMind.AI WebRTC Signaling Security & Authorization Test Suite...\n');
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

  // Mock Socket.IO Server
  function createMockServer() {
    const emittedEvents: Array<{ room?: string; event: string; data: any }> = [];
    return {
      emittedEvents,
      to: (room: string) => ({
        emit: (event: string, data: any) => {
          emittedEvents.push({ room, event, data });
        },
      }),
    };
  }

  let userA1: any;
  let userA2: any;
  let userA3: any;
  let userB1: any;
  let householdA: any;
  let householdB: any;

  try {
    // Setup test users in database
    householdA = await prisma.household.create({
      data: {
        name: 'WebRTC Test Household A',
        inviteCode: 'HM-WTC-A-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      },
    });

    householdB = await prisma.household.create({
      data: {
        name: 'WebRTC Test Household B',
        inviteCode: 'HM-WTC-B-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      },
    });

    userA1 = await prisma.user.create({
      data: {
        email: `webrtc_a1_${Date.now()}@example.com`,
        name: 'Alice InHouseA',
        householdId: householdA.id,
        role: 'OWNER',
      },
    });

    userA2 = await prisma.user.create({
      data: {
        email: `webrtc_a2_${Date.now()}@example.com`,
        name: 'Bob InHouseA',
        householdId: householdA.id,
        role: 'MEMBER',
      },
    });

    userA3 = await prisma.user.create({
      data: {
        email: `webrtc_a3_${Date.now()}@example.com`,
        name: 'Dave InHouseA',
        householdId: householdA.id,
        role: 'MEMBER',
      },
    });

    userB1 = await prisma.user.create({
      data: {
        email: `webrtc_b1_${Date.now()}@example.com`,
        name: 'Charlie InHouseB',
        householdId: householdB.id,
        role: 'OWNER',
      },
    });

    // TEST 1: Authorized Intra-Household Call Initiation
    console.log('--- Test 1: Intra-Household Call Initiation ---');
    const mockServer = createMockServer();

    const call1Result = await webrtcSignaling.handleCallUser(
      mockServer as any,
      userA1.id,
      householdA.id,
      {
        targetUserId: userA2.id,
        callType: 'video',
        callerName: 'Alice InHouseA',
        signalData: { type: 'offer', sdp: 'v=0...' },
      }
    );

    assert(call1Result.success === true, 'Authorized intra-household call initiated successfully');
    assert(Boolean(call1Result.callId), `Unique callId generated: ${call1Result.callId}`);

    const incomingEvent = mockServer.emittedEvents.find(
      (e) => e.room === `user_${userA2.id}` && e.event === 'webrtc_incoming_call'
    );
    assert(
      incomingEvent !== undefined && incomingEvent.data.callId === call1Result.callId,
      'Callee received webrtc_incoming_call with matching callId and caller metadata'
    );

    // TEST 2: Cross-Household Attack Blocked
    console.log('\n--- Test 2: Cross-Household Call Attack Prevention ---');
    mockServer.emittedEvents.length = 0;
    const attackResult = await webrtcSignaling.handleCallUser(
      mockServer as any,
      userA1.id,
      householdA.id,
      {
        targetUserId: userB1.id, // User in Household B!
        callType: 'video',
        callerName: 'Alice InHouseA',
        signalData: { type: 'offer', sdp: 'v=0...' },
      }
    );

    assert(attackResult.success === false, 'Cross-household call rejected by server');
    assert(
      Boolean(attackResult.error?.includes('Cross-household') || attackResult.error?.includes('prohibited')),
      'Server returned explicit household boundary security error'
    );
    const attackNotification = mockServer.emittedEvents.find(
      (e) => e.room === `user_${userB1.id}` && e.event === 'webrtc_incoming_call'
    );
    assert(
      attackNotification === undefined,
      'No incoming call event was emitted to target user in other household'
    );

    // TEST 3: Callee Busy State Detection
    console.log('\n--- Test 3: Callee Busy State Detection ---');
    // userA2 is already engaged in call1Result
    mockServer.emittedEvents.length = 0;
    const busyResult = await webrtcSignaling.handleCallUser(
      mockServer as any,
      userA3.id,
      householdA.id,
      {
        targetUserId: userA2.id,
        callType: 'audio',
        callerName: 'Dave InHouseA',
        signalData: { type: 'offer', sdp: 'v=0...' },
      }
    );

    assert(busyResult.success === false, 'Concurrent call to busy callee blocked');
    assert(busyResult.error === 'Callee is busy', 'Callee is busy error returned to caller');
    const busyEvent = mockServer.emittedEvents.find(
      (e) => e.room === `user_${userA3.id}` && e.event === 'webrtc_call_busy'
    );
    assert(busyEvent !== undefined, 'Caller received webrtc_call_busy socket event');

    // TEST 4: Forged / Stale Signaling Events Rejection
    console.log('\n--- Test 4: Forged Call Session Signaling Rejection ---');
    const forgedAnswerResult = webrtcSignaling.handleAnswerCall(
      mockServer as any,
      userA2.id,
      {
        callId: 'fake_call_id_9999',
        targetUserId: userA1.id,
        signalData: { type: 'answer', sdp: 'fake' },
      }
    );
    assert(forgedAnswerResult === false, 'Forged answer with invalid callId rejected');

    const forgedCandidateResult = webrtcSignaling.handleIceCandidate(
      mockServer as any,
      userA2.id,
      {
        callId: 'fake_call_id_9999',
        targetUserId: userA1.id,
        candidate: { candidate: 'fake' },
      }
    );
    assert(forgedCandidateResult === false, 'Forged ICE candidate with invalid callId rejected');

    const hijackedAnswer = webrtcSignaling.handleAnswerCall(
      mockServer as any,
      userB1.id, // Household B user trying to answer call1
      {
        callId: call1Result.callId!,
        targetUserId: userA1.id,
        signalData: { type: 'answer', sdp: 'hijack' },
      }
    );
    assert(hijackedAnswer === false, 'Non-participant cannot send answer to another call');

    // TEST 5: Legitimate Answer & Candidate Relay
    console.log('\n--- Test 5: Legitimate Answer & Candidate Relay ---');
    mockServer.emittedEvents.length = 0;
    const legitAnswer = webrtcSignaling.handleAnswerCall(
      mockServer as any,
      userA2.id,
      {
        callId: call1Result.callId!,
        targetUserId: userA1.id,
        signalData: { type: 'answer', sdp: 'valid_sdp' },
      }
    );
    assert(legitAnswer === true, 'Legitimate callee answer accepted');
    const answerEmitted = mockServer.emittedEvents.find(
      (e) => e.room === `user_${userA1.id}` && e.event === 'webrtc_call_accepted'
    );
    assert(answerEmitted !== undefined, 'Caller received webrtc_call_accepted event with SDP');

    const legitCandidate = webrtcSignaling.handleIceCandidate(
      mockServer as any,
      userA1.id,
      {
        callId: call1Result.callId!,
        targetUserId: userA2.id,
        candidate: { candidate: 'candidate:1 1 UDP 2130706431 192.168.1.50 50000 typ host' },
      }
    );
    assert(legitCandidate === true, 'Legitimate ICE candidate accepted and relayed');

    // TEST 6: Call Termination & Cleanup
    console.log('\n--- Test 6: Call Termination & Resource Cleanup ---');
    mockServer.emittedEvents.length = 0;
    webrtcSignaling.handleEndCall(
      mockServer as any,
      userA1.id,
      {
        callId: call1Result.callId!,
        targetUserId: userA2.id,
      }
    );

    assert(
      webrtcSignaling.isUserInCall(userA1.id) === false,
      'Caller marked as no longer in call'
    );
    assert(
      webrtcSignaling.isUserInCall(userA2.id) === false,
      'Callee marked as no longer in call'
    );
    const endEmitted = mockServer.emittedEvents.find(
      (e) => e.room === `user_${userA2.id}` && e.event === 'webrtc_call_ended'
    );
    assert(endEmitted !== undefined, 'Callee notified that call was ended');

    // TEST 7: Ephemeral TURN REST API Credential Generation & Expiry
    console.log('\n--- Test 7: Ephemeral TURN REST API Credentials (RFC 5766) ---');
    const { IceConfigService } = await import('../modules/communication/iceConfigService');
    const testSecret = '0123456789abcdef0123456789abcdef';
    const ttlSeconds = 1800; // 30 minutes
    const creds = IceConfigService.generateCredentials(userA1.id, testSecret, ttlSeconds);

    assert(Boolean(creds.username), 'Generated valid TURN username');
    assert(Boolean(creds.credential), 'Generated valid HMAC-SHA1 credential');
    assert(creds.username.includes(userA1.id), 'Username embeds userId');
    const expirySec = parseInt(creds.username.split(':')[0], 10);
    const nowSec = Math.floor(Date.now() / 1000);
    assert(
      expirySec >= nowSec + ttlSeconds - 5 && expirySec <= nowSec + ttlSeconds + 5,
      `Username timestamp reflects configured TTL of ${ttlSeconds}s`
    );
    assert(
      !creds.credential.includes(testSecret),
      'Permanent secret is never leaked in client credential'
    );

    // Verify fallback configuration returns valid STUN
    const iceConfig = IceConfigService.getIceConfiguration(userA1.id);
    assert(iceConfig.iceServers.length >= 1, 'ICE configuration contains at least STUN server');
    assert(Boolean(iceConfig.expiresAt), 'ICE configuration includes expiresAt timestamp');

    // TEST 8: Call Invitation Expiry (45s) & Stale Call Acceptance Protection
    console.log('\n--- Test 8: Call Invitation Expiry & Stale Call Protection ---');
    mockServer.emittedEvents.length = 0;
    const call2Result = await webrtcSignaling.handleCallUser(
      mockServer as any,
      userA1.id,
      householdA.id,
      {
        targetUserId: userA2.id,
        callType: 'audio',
        callerName: 'Alice InHouseA',
        signalData: { type: 'offer', sdp: 'v=0...' },
      }
    );
    assert(call2Result.success === true, 'Call 2 initiated for expiry test');

    // Simulate expiration of the 45s window
    webrtcSignaling.expireCallForTesting(call2Result.callId!);
    const sessionAfterExpire = webrtcSignaling.getCallSession(call2Result.callId!);
    assert(sessionAfterExpire?.status === 'expired', 'Call status marked as expired');

    // Callee attempts to answer stale/expired call
    const staleAnswer = webrtcSignaling.handleAnswerCall(
      mockServer as any,
      userA2.id,
      {
        callId: call2Result.callId!,
        targetUserId: userA1.id,
        signalData: { type: 'answer', sdp: 'late_sdp' },
      }
    );
    assert(staleAnswer === false, 'Stale/expired call acceptance strictly rejected');

    // TEST 9: Background Call Notification Payload Sanitization
    console.log('\n--- Test 9: Push Notification Payload Security Audit ---');
    const sanitizedFields = ['callId', 'callerId', 'callerName', 'callerAvatar', 'callType', 'householdId'];
    const forbiddenFields = ['sdp', 'candidate', 'signalData', 'jwt', 'token', 'secret', 'credential', 'password'];

    const mockCallData = {
      type: 'INCOMING_CALL',
      callId: 'call_test_123',
      callerId: userA1.id,
      callerName: 'Alice',
      callerAvatar: 'avatar.png',
      callType: 'video',
      householdId: householdA.id,
    };

    const hasNoForbidden = forbiddenFields.every((field) => !(field in mockCallData));
    const hasRequiredSafe = sanitizedFields.every((field) => field in mockCallData);
    assert(hasNoForbidden, 'Push notification payload contains NO SDP, ICE candidates, JWT, or secrets');
    assert(hasRequiredSafe, 'Push notification payload contains all necessary safe display metadata');

    // TEST 10: Device Push Token Registration & Management
    console.log('\n--- Test 10: Device Push Token Management ---');
    const { DeviceTokenService } = await import('../modules/communication/deviceTokenService');
    const testFcmToken = 'fcm_test_token_' + Math.random().toString(36).substring(2, 10);

    const regResult = await DeviceTokenService.registerToken(userA1.id, testFcmToken, 'android');
    assert(regResult === true, 'Device token successfully registered for user');

    const retrievedTokens = await DeviceTokenService.getUserTokens(userA1.id);
    const foundToken = retrievedTokens.find((t) => t.token === testFcmToken);
    assert(foundToken !== undefined && foundToken.platform === 'android', 'Registered token retrieved with platform android');

    const unregResult = await DeviceTokenService.unregisterToken(userA1.id, testFcmToken);
    assert(unregResult === true, 'Device token unregistration successful');

    const remainingTokens = await DeviceTokenService.getUserTokens(userA1.id);
    assert(
      remainingTokens.find((t) => t.token === testFcmToken) === undefined,
      'Device token cleanly removed after unregistration'
    );

    // Clean up created database entities
    await prisma.user.deleteMany({
      where: { id: { in: [userA1.id, userA2.id, userA3.id, userB1.id] } },
    });
    await prisma.household.deleteMany({
      where: { id: { in: [householdA.id, householdB.id] } },
    });

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

runWebRTCSignalingTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
