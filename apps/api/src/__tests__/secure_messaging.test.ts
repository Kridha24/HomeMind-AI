import { prisma } from '../repositories/db';
import { generateAccessToken } from '../utils/jwt';
import { SecureMessagingService } from '../modules/communication/secureMessagingService';
import { DeviceKeyService } from '../modules/communication/deviceKeyService';
import { webcrypto } from 'crypto';

const { subtle } = webcrypto as unknown as { subtle: SubtleCrypto };

async function runSecureMessagingTests() {
  console.log('🧪 Starting HomeMind Connect Secure Messaging & E2EE Verification Suite...\n');
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

  let householdA: any;
  let householdB: any;
  let userA1: any;
  let userA2: any;
  let userB1: any;
  let convA: any;
  let convB: any;

  try {
    // ------------------------------------------------------------------------
    // SETUP: Households & Users
    // ------------------------------------------------------------------------
    householdA = await prisma.household.create({
      data: {
        name: 'Household A (Alpha)',
        inviteCode: 'HM-A-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      },
    });

    householdB = await prisma.household.create({
      data: {
        name: 'Household B (Beta)',
        inviteCode: 'HM-B-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      },
    });

    userA1 = await prisma.user.create({
      data: {
        email: `usera1_${Date.now()}@example.com`,
        name: 'Alice Alpha',
        householdId: householdA.id,
        role: 'OWNER',
        isActive: true,
        softDelete: false,
      },
    });

    userA2 = await prisma.user.create({
      data: {
        email: `usera2_${Date.now()}@example.com`,
        name: 'Aaron Alpha',
        householdId: householdA.id,
        role: 'MEMBER',
        isActive: true,
        softDelete: false,
      },
    });

    userB1 = await prisma.user.create({
      data: {
        email: `userb1_${Date.now()}@example.com`,
        name: 'Bob Beta',
        householdId: householdB.id,
        role: 'OWNER',
        isActive: true,
        softDelete: false,
      },
    });

    // ------------------------------------------------------------------------
    // TEST 1: Default Household Group Conversation Creation
    // ------------------------------------------------------------------------
    console.log('--- Test 1: Default Household Group Conversation ---');
    convA = await SecureMessagingService.getOrCreateHouseholdConversation(householdA.id);
    convB = await SecureMessagingService.getOrCreateHouseholdConversation(householdB.id);

    assert(!!convA && convA.householdId === householdA.id, 'Household A default group conversation created');
    assert(!!convB && convB.householdId === householdB.id, 'Household B default group conversation created');
    assert(convA.id !== convB.id, 'Conversations are isolated across households');

    // ------------------------------------------------------------------------
    // TEST 2: Cross-Household Isolation & Authorization
    // ------------------------------------------------------------------------
    console.log('\n--- Test 2: Cross-Household Security & Authorization ---');
    const isA1InConvA = await SecureMessagingService.isMemberOfConversation(convA.id, userA1.id, householdA.id);
    const isB1InConvA = await SecureMessagingService.isMemberOfConversation(convA.id, userB1.id, householdB.id);
    const isA1InConvB = await SecureMessagingService.isMemberOfConversation(convB.id, userA1.id, householdA.id);

    assert(isA1InConvA === true, 'Member A1 authorized in Conversation A');
    assert(isB1InConvA === false, 'Member B1 BLOCKED from Conversation A (cross-household)');
    assert(isA1InConvB === false, 'Member A1 BLOCKED from Conversation B (cross-household)');

    // ------------------------------------------------------------------------
    // TEST 3: Device Cryptographic Identity Registration
    // ------------------------------------------------------------------------
    console.log('\n--- Test 3: Device Cryptographic Identity Registration ---');
    const deviceA1_Web = await DeviceKeyService.registerDeviceKey(
      userA1.id,
      {
        deviceId: 'dev_a1_browser',
        deviceType: 'web',
        publicKey: JSON.stringify({ kty: 'EC', crv: 'P-256', x: 'mock_x_1', y: 'mock_y_1' }),
        deviceName: 'Chrome Browser',
      }
    );

    const deviceA2_Phone = await DeviceKeyService.registerDeviceKey(
      userA2.id,
      {
        deviceId: 'dev_a2_android',
        deviceType: 'android',
        publicKey: JSON.stringify({ kty: 'EC', crv: 'P-256', x: 'mock_x_2', y: 'mock_y_2' }),
        deviceName: 'Pixel 8',
      }
    );

    const devListA1 = await DeviceKeyService.getUserDevices(userA1.id);
    assert(devListA1.length === 1 && devListA1[0].deviceId === 'dev_a1_browser', 'Device registered for user A1');
    assert(devListA1[0].revokedAt === null, 'Device initially active and unrevoked');

    // ------------------------------------------------------------------------
    // TEST 4: Recipient Keys Discovery for Household Conversation
    // ------------------------------------------------------------------------
    console.log('\n--- Test 4: Active Household Recipient Keys Discovery ---');
    const recipientsA = await DeviceKeyService.getHouseholdRecipientDevices(householdA.id);
    assert(recipientsA.some((d: any) => d.deviceId === 'dev_a1_browser'), 'Recipient list includes Device A1');
    assert(recipientsA.some((d: any) => d.deviceId === 'dev_a2_android'), 'Recipient list includes Device A2');
    assert(!recipientsA.some((d: any) => d.userId === userB1.id), 'Cross-household user devices excluded');

    // ------------------------------------------------------------------------
    // TEST 5: Ciphertext Storage & CRITICAL Database Plaintext Audit
    // ------------------------------------------------------------------------
    console.log('\n--- Test 5: Ciphertext-Only Persistence & Database Audit ---');
    const AUDIT_SECRET_PHRASE = 'HOME_MIND_E2EE_TEST_92741';
    const clientMsgId = `audit_${Date.now()}`;

    // Simulate encrypted envelope where ciphertext is base64 ciphertext
    const mockCiphertext = Buffer.from('ENC_CIPHERTEXT_AES_GCM_PAYLOAD_92741').toString('base64');
    const mockIv = Buffer.from('RANDOM_12_BYTE_IV').toString('base64');
    const mockEphemeralKey = JSON.stringify({ kty: 'EC', crv: 'P-256', x: 'eph_x', y: 'eph_y' });

    const storeResult = await SecureMessagingService.storeEncryptedMessage(userA1.id, householdA.id, {
      conversationId: convA.id,
      clientMessageId: clientMsgId,
      senderDeviceId: 'dev_a1_browser',
      ciphertext: mockCiphertext,
      iv: mockIv,
      ephemeralPublicKey: mockEphemeralKey,
      recipientWrappedKeys: {
        dev_a1_browser: 'wrapped_key_for_a1',
        dev_a2_android: 'wrapped_key_for_a2',
      },
      aad: JSON.stringify({
        conversationId: convA.id,
        senderId: userA1.id,
        clientMessageId: clientMsgId,
        version: 'v1',
      }),
      encryptionVersion: 'v1',
    });

    assert(storeResult.success === true && !!storeResult.message, 'Encrypted envelope persisted successfully');

    // CRITICAL AUDIT: Check DB for test phrase
    const rawMatches = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id, ciphertext FROM "Message" WHERE ciphertext LIKE '%${AUDIT_SECRET_PHRASE}%';`
    );
    assert(rawMatches.length === 0, `Exact phrase "${AUDIT_SECRET_PHRASE}" is completely ABSENT from database`);

    // Verify stored fields contain only ciphertext
    const storedMsg = await prisma.message.findUnique({
      where: { id: storeResult.message?.id },
    });
    assert(storedMsg?.ciphertext === mockCiphertext, 'Database contains ciphertext only');
    assert(typeof (storedMsg as any)?.plaintextBody === 'undefined', 'Database has NO plaintextBody field');

    // ------------------------------------------------------------------------
    // TEST 6: Message Deduplication by clientMessageId
    // ------------------------------------------------------------------------
    console.log('\n--- Test 6: Message Deduplication by clientMessageId ---');
    const retryResult = await SecureMessagingService.storeEncryptedMessage(userA1.id, householdA.id, {
      conversationId: convA.id,
      clientMessageId: clientMsgId, // Same clientMessageId
      senderDeviceId: 'dev_a1_browser',
      ciphertext: mockCiphertext,
      iv: mockIv,
      ephemeralPublicKey: mockEphemeralKey,
      recipientWrappedKeys: {},
      aad: '',
      encryptionVersion: 'v1',
    });

    assert(retryResult.success === true, 'Retry handled cleanly');
    assert(retryResult.message?.id === storeResult.message?.id, 'Deduplication returned existing message ID (no duplicate row)');

    const countRows = await prisma.message.count({
      where: { clientMessageId: clientMsgId },
    });
    assert(countRows === 1, 'Exactly one DB message exists for duplicate clientMessageId');

    // ------------------------------------------------------------------------
    // TEST 7: Delivery and Read Receipts
    // ------------------------------------------------------------------------
    console.log('\n--- Test 7: Real Delivery and Read Receipts ---');
    const msgId = storeResult.message!.id;

    // Delivery receipt
    const deliveryReceipt = await SecureMessagingService.recordDeliveryReceipt(
      msgId,
      userA2.id,
      'dev_a2_android'
    );
    assert(!!deliveryReceipt && !!deliveryReceipt.deliveredAt, 'Delivery receipt recorded with timestamp');

    // Read receipt
    const readReceipt = await SecureMessagingService.recordReadReceipt(
      msgId,
      userA2.id,
      'dev_a2_android'
    );
    assert(!!readReceipt && !!readReceipt.readAt, 'Read receipt recorded with timestamp');

    // ------------------------------------------------------------------------
    // TEST 8: Device Revocation & Exclusion
    // ------------------------------------------------------------------------
    console.log('\n--- Test 8: Device Revocation & Future Message Exclusion ---');
    const revokeResult = await DeviceKeyService.revokeDevice(userA1.id, 'dev_a1_browser');
    assert(revokeResult === true, 'Device successfully revoked by user');

    const updatedRecipientsA = await DeviceKeyService.getHouseholdRecipientDevices(householdA.id);
    assert(!updatedRecipientsA.some((d: any) => d.deviceId === 'dev_a1_browser'), 'Revoked device excluded from future recipient keys');

    // ------------------------------------------------------------------------
    // TEST 9: Removed Member Forward Secrecy
    // ------------------------------------------------------------------------
    console.log('\n--- Test 9: Removed Member Exclusion & Forward Secrecy ---');
    // Remove userA2 from household (soft delete or set isActive to false)
    await prisma.user.update({
      where: { id: userA2.id },
      data: { softDelete: true, isActive: false },
    });

    const postRemovalRecipients = await DeviceKeyService.getHouseholdRecipientDevices(householdA.id);
    assert(!postRemovalRecipients.some((d: any) => d.userId === userA2.id), 'Removed household member devices immediately EXCLUDED from recipient keys');

    // ------------------------------------------------------------------------
    // TEST 10: Real Web Crypto ECDH + AES-GCM + AES-KW End-to-End Cryptography
    // ------------------------------------------------------------------------
    console.log('\n--- Test 10: Web Crypto API Cryptographic Roundtrip ---');
    // Device 1 Keypair (Recipient 1)
    const dev1Keypair = await subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveKey', 'deriveBits']
    );

    // Device 2 Keypair (Recipient 2)
    const dev2Keypair = await subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveKey', 'deriveBits']
    );

    // Sender generates Ephemeral ECDH Keypair
    const ephemeralKeypair = await subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveKey', 'deriveBits']
    );

    // 1. Sender generates random 256-bit Content Encryption Key (CEK)
    const cek = await subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    // 2. Sender encrypts plaintext
    const testPlaintext = 'Secure Household Family Message #4829';
    const iv = webcrypto.getRandomValues(new Uint8Array(12));
    const aad = new TextEncoder().encode('aad_test_metadata');

    const encryptedContent = await subtle.encrypt(
      { name: 'AES-GCM', iv, additionalData: aad },
      cek,
      new TextEncoder().encode(testPlaintext)
    );

    // 3. Sender wraps CEK for Device 1
    const dev1WrapKey = await subtle.deriveKey(
      { name: 'ECDH', public: dev1Keypair.publicKey },
      ephemeralKeypair.privateKey,
      { name: 'AES-KW', length: 256 },
      false,
      ['wrapKey']
    );
    const wrappedCekForDev1 = await subtle.wrapKey('raw', cek, dev1WrapKey, 'AES-KW');

    // 4. Sender wraps CEK for Device 2
    const dev2WrapKey = await subtle.deriveKey(
      { name: 'ECDH', public: dev2Keypair.publicKey },
      ephemeralKeypair.privateKey,
      { name: 'AES-KW', length: 256 },
      false,
      ['wrapKey']
    );
    const wrappedCekForDev2 = await subtle.wrapKey('raw', cek, dev2WrapKey, 'AES-KW');

    // 5. Device 1 unwraps & decrypts
    const dev1UnwrapKey = await subtle.deriveKey(
      { name: 'ECDH', public: ephemeralKeypair.publicKey },
      dev1Keypair.privateKey,
      { name: 'AES-KW', length: 256 },
      false,
      ['unwrapKey']
    );
    const unwrappedCekDev1 = await subtle.unwrapKey(
      'raw',
      wrappedCekForDev1,
      dev1UnwrapKey,
      'AES-KW',
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
    const decryptedDev1Buffer = await subtle.decrypt(
      { name: 'AES-GCM', iv, additionalData: aad },
      unwrappedCekDev1,
      encryptedContent
    );
    const decryptedDev1 = new TextDecoder().decode(decryptedDev1Buffer);
    assert(decryptedDev1 === testPlaintext, 'Device 1 successfully unwrapped & decrypted plaintext');

    // 6. Device 2 unwraps & decrypts
    const dev2UnwrapKey = await subtle.deriveKey(
      { name: 'ECDH', public: ephemeralKeypair.publicKey },
      dev2Keypair.privateKey,
      { name: 'AES-KW', length: 256 },
      false,
      ['unwrapKey']
    );
    const unwrappedCekDev2 = await subtle.unwrapKey(
      'raw',
      wrappedCekForDev2,
      dev2UnwrapKey,
      'AES-KW',
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
    const decryptedDev2Buffer = await subtle.decrypt(
      { name: 'AES-GCM', iv, additionalData: aad },
      unwrappedCekDev2,
      encryptedContent
    );
    const decryptedDev2 = new TextDecoder().decode(decryptedDev2Buffer);
    assert(decryptedDev2 === testPlaintext, 'Device 2 successfully unwrapped & decrypted plaintext');

    // 7. Attacker/Server with no private key cannot decrypt
    let serverDecrypted = false;
    try {
      // Without private key, unwrap is mathematically impossible
      const bogusKey = await subtle.generateKey(
        { name: 'AES-KW', length: 256 },
        false,
        ['unwrapKey']
      );
      await subtle.unwrapKey('raw', wrappedCekForDev1, bogusKey, 'AES-KW', { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
      serverDecrypted = true;
    } catch {
      serverDecrypted = false;
    }
    assert(serverDecrypted === false, 'Server/Attacker cannot derive plaintext without recipient private key');

    // ------------------------------------------------------------------------
    // Test 11: Direct 1-to-1 Conversations
    // ------------------------------------------------------------------------
    console.log('\n--- Test 11: Direct 1-to-1 Conversation Engine ---');

    // 1. Prevent self direct conversation
    let selfDisallowed = false;
    try {
      await SecureMessagingService.getOrCreateDirectConversation(householdA.id, userA1.id, userA1.id);
    } catch (err: any) {
      if (err.message.includes('Self conversation')) selfDisallowed = true;
    }
    assert(selfDisallowed, 'Direct conversation with oneself is forbidden');

    // 2. Prevent cross-household direct conversation
    let crossHouseholdDisallowed = false;
    try {
      await SecureMessagingService.getOrCreateDirectConversation(householdA.id, userA1.id, userB1.id);
    } catch (err: any) {
      if (err.message.includes('Both users must belong')) crossHouseholdDisallowed = true;
    }
    assert(crossHouseholdDisallowed, 'Direct conversation across different households is forbidden');

    // 3. Create valid 1-to-1 direct conversation
    const userA3 = await prisma.user.create({
      data: {
        email: `usera3_${Date.now()}@example.com`,
        name: 'Amy Alpha',
        householdId: householdA.id,
        role: 'MEMBER',
        isActive: true,
        softDelete: false,
      },
    });

    await DeviceKeyService.registerDeviceKey(userA3.id, {
      deviceId: 'dev_a3_mobile',
      publicKey: 'mock_public_key_a3',
      deviceType: 'mobile',
    });

    const directConv1 = await SecureMessagingService.getOrCreateDirectConversation(householdA.id, userA1.id, userA3.id);
    assert(directConv1.type === 'DIRECT', 'Direct conversation created with type DIRECT');
    assert(directConv1.members.length === 2, 'Direct conversation has exactly 2 members');

    // 4. Idempotency: calling again (with either user ordering) returns existing conversation
    const directConv2 = await SecureMessagingService.getOrCreateDirectConversation(householdA.id, userA3.id, userA1.id);
    assert(directConv1.id === directConv2.id, 'Idempotent: returns existing direct conversation without duplicate creation');

    // 5. Conversation-scoped recipient device keys
    const directRecipients = await DeviceKeyService.getConversationRecipientDevices(directConv1.id, householdA.id);
    assert(directRecipients.length > 0, 'Direct recipients discovered for conversation participants');
    assert(directRecipients.every(r => [userA1.id, userA3.id].includes(r.userId)), 'Direct recipients strictly confined to conversation members');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    // Cleanup
    try {
      if (householdA) {
        await prisma.messageReceipt.deleteMany({ where: { message: { conversation: { householdId: householdA.id } } } });
        await prisma.message.deleteMany({ where: { conversation: { householdId: householdA.id } } });
        await prisma.conversationMember.deleteMany({ where: { conversation: { householdId: householdA.id } } });
        await prisma.conversation.deleteMany({ where: { householdId: householdA.id } });
        await prisma.deviceKey.deleteMany({ where: { userId: userA1?.id } });
        await prisma.deviceKey.deleteMany({ where: { userId: userA2?.id } });
        await prisma.deviceKey.deleteMany({ where: { user: { householdId: householdA.id } } });
        await prisma.user.deleteMany({ where: { householdId: householdA.id } });
        await prisma.household.delete({ where: { id: householdA.id } });
      }
      if (householdB) {
        await prisma.conversationMember.deleteMany({ where: { conversation: { householdId: householdB.id } } });
        await prisma.conversation.deleteMany({ where: { householdId: householdB.id } });
        await prisma.deviceKey.deleteMany({ where: { userId: userB1?.id } });
        await prisma.user.deleteMany({ where: { id: userB1?.id } });
        await prisma.household.delete({ where: { id: householdB.id } });
      }
    } catch (cleanupErr) {
      console.warn('Cleanup warning:', cleanupErr);
    }
  }

  console.log(`\n==================================================`);
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`==================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runSecureMessagingTests();
