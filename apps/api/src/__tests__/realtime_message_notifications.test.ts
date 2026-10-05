import { prisma } from '../repositories/db';
import { SecureMessagingService } from '../modules/communication/secureMessagingService';
import { PushNotificationService } from '../modules/communication/pushNotificationService';
import { DeviceTokenService } from '../modules/communication/deviceTokenService';

async function runRealtimeNotificationTests() {
  console.log('🧪 Starting HomeMind.AI Real-Time Message Notifications Verification Suite...\n');
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

  let household: any;
  let userA: any; // Sender
  let userB: any; // Recipient
  let userC: any; // Third household member (not in direct chat)
  let directConvAB: any;
  let householdConv: any;

  try {
    // ------------------------------------------------------------------------
    // SETUP: Shared Household with Users A, B, and C
    // ------------------------------------------------------------------------
    console.log('--- Setup: Test Household & 3 Authenticated Members ---');
    household = await prisma.household.create({
      data: {
        name: 'Sharma Household',
        inviteCode: 'HM-SH-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      },
    });

    userA = await prisma.user.create({
      data: {
        email: `usera_${Date.now()}@example.com`,
        name: 'Mihir Sharma',
        householdId: household.id,
        role: 'OWNER',
        isActive: true,
        softDelete: false,
      },
    });

    userB = await prisma.user.create({
      data: {
        email: `userb_${Date.now()}@example.com`,
        name: 'Priya Sharma',
        householdId: household.id,
        role: 'MEMBER',
        isActive: true,
        softDelete: false,
      },
    });

    userC = await prisma.user.create({
      data: {
        email: `userc_${Date.now()}@example.com`,
        name: 'Rohan Sharma',
        householdId: household.id,
        role: 'MEMBER',
        isActive: true,
        softDelete: false,
      },
    });

    // Register active push tokens for User B and User C
    await DeviceTokenService.registerToken(userB.id, 'fcm_token_b_chrome', 'web');
    await DeviceTokenService.registerToken(userB.id, 'fcm_token_b_android', 'android');
    await DeviceTokenService.registerToken(userC.id, 'fcm_token_c_web', 'web');

    assert(!!household && !!userA && !!userB && !!userC, 'Household and 3 members provisioned');

    // ------------------------------------------------------------------------
    // TEST 1: Direct Conversation Isolation
    // ------------------------------------------------------------------------
    console.log('\n--- Test 1: Direct Conversation & Direct Message Privacy ---');
    directConvAB = await SecureMessagingService.getOrCreateDirectConversation(
      household.id,
      userA.id,
      userB.id
    );

    const isMemberA = await SecureMessagingService.isMemberOfConversation(directConvAB.id, userA.id, household.id);
    const isMemberB = await SecureMessagingService.isMemberOfConversation(directConvAB.id, userB.id, household.id);
    const isMemberC = await SecureMessagingService.isMemberOfConversation(directConvAB.id, userC.id, household.id);

    assert(isMemberA && isMemberB, 'User A and User B are authorized members of direct conversation');
    assert(!isMemberC, 'User C (third member) is STRICTLY EXCLUDED from direct conversation');

    // ------------------------------------------------------------------------
    // TEST 2: Message Persistence & E2EE Integrity
    // ------------------------------------------------------------------------
    console.log('\n--- Test 2: Message Persistence with E2EE Ciphertext Envelope ---');
    const clientMsgId = 'msg_direct_' + Date.now();
    const mockCiphertext = 'AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA='; // Base64 ciphertext
    const mockIv = 'EjRWeJq83v8=';
    const mockEphemeralKey = 'BN8...ephemeralPubKey';
    const mockRecipientWrappedKeys = {
      'dev-b-web': 'wrapped_key_for_b',
    };

    const storeResult = await SecureMessagingService.storeEncryptedMessage(userA.id, household.id, {
      conversationId: directConvAB.id,
      clientMessageId: clientMsgId,
      senderDeviceId: 'dev-a-web',
      ciphertext: mockCiphertext,
      iv: mockIv,
      ephemeralPublicKey: mockEphemeralKey,
      recipientWrappedKeys: mockRecipientWrappedKeys,
      aad: JSON.stringify({ conversationId: directConvAB.id }),
      encryptionVersion: 'v1',
    });

    assert(storeResult.success === true, 'Encrypted direct message persisted successfully');
    assert(storeResult.message?.ciphertext === mockCiphertext, 'Ciphertext stored without server decryption');

    // ------------------------------------------------------------------------
    // TEST 3: Unread Count Calculation Backed by MessageReceipts
    // ------------------------------------------------------------------------
    console.log('\n--- Test 3: Unread Count State Per Conversation ---');
    const unreadForB = await SecureMessagingService.getUnreadCounts(userB.id, household.id);
    const unreadForA = await SecureMessagingService.getUnreadCounts(userA.id, household.id);
    const unreadForC = await SecureMessagingService.getUnreadCounts(userC.id, household.id);

    assert(unreadForB.totalUnread === 1, `User B has exactly 1 unread message (found: ${unreadForB.totalUnread})`);
    assert(unreadForB.byConversation[directConvAB.id] === 1, `User B unread count for conversation is 1`);
    assert(unreadForA.totalUnread === 0, `Sender User A has 0 unread messages for their own sent message`);
    assert(unreadForC.totalUnread === 0, `Third-party User C has 0 unread messages (Direct message isolation)`);

    // ------------------------------------------------------------------------
    // TEST 4: Privacy-Safe Background Push Dispatch
    // ------------------------------------------------------------------------
    console.log('\n--- Test 4: Privacy-Safe Background Push & FCM Targeting ---');
    const recipientIds = [userB.id]; // Excludes User C

    const pushResult = await PushNotificationService.dispatchMessagePush({
      recipientUserIds: recipientIds,
      conversationId: directConvAB.id,
      conversationType: 'DIRECT',
      senderId: userA.id,
      senderName: userA.name,
      messageId: storeResult.message!.id,
      createdAt: storeResult.message!.createdAt,
    });

    assert(pushResult.dispatchedCount === 1, 'Push targeted exactly 1 recipient user (User B)');
    assert(pushResult.deviceCount === 2, `Push dispatched to User B registered active devices (2 devices)`);

    // Verify Sender and Third-party exclusions
    const selfPushResult = await PushNotificationService.dispatchMessagePush({
      recipientUserIds: [userA.id], // Sender
      conversationId: directConvAB.id,
      conversationType: 'DIRECT',
      senderId: userA.id,
      senderName: userA.name,
      messageId: storeResult.message!.id,
      createdAt: storeResult.message!.createdAt,
    });
    assert(selfPushResult.dispatchedCount === 0, 'Push safely excludes the sending user device');

    // ------------------------------------------------------------------------
    // TEST 5: Active Chat & Read Receipt Updates Unread Count
    // ------------------------------------------------------------------------
    console.log('\n--- Test 5: Mark Conversation Read & Read Receipt Clearing ---');
    const readResult = await SecureMessagingService.markConversationAsRead(
      directConvAB.id,
      userB.id,
      household.id,
      'dev-b-web'
    );

    assert(readResult.success === true, 'markConversationAsRead executed successfully');
    assert(readResult.markedCount === 1, `1 unread message marked as read (found: ${readResult.markedCount})`);

    // Verify receipt in database
    const receipt = await prisma.messageReceipt.findUnique({
      where: {
        messageId_userId_deviceId: {
          messageId: storeResult.message!.id,
          userId: userB.id,
          deviceId: 'dev-b-web',
        },
      },
    });

    assert(!!receipt && receipt.readAt !== null, 'MessageReceipt record created with populated readAt timestamp');

    // Verify unread count is now 0 for User B
    const unreadAfterRead = await SecureMessagingService.getUnreadCounts(userB.id, household.id);
    assert(unreadAfterRead.totalUnread === 0, 'User B unread count cleared to 0 after conversation opened');

    // ------------------------------------------------------------------------
    // TEST 6: Household Group Chat vs Direct Chat Privacy
    // ------------------------------------------------------------------------
    console.log('\n--- Test 6: Household Group Chat Notification Behavior ---');
    householdConv = await SecureMessagingService.getOrCreateHouseholdConversation(household.id);

    const groupMsgId = 'msg_group_' + Date.now();
    await SecureMessagingService.storeEncryptedMessage(userA.id, household.id, {
      conversationId: householdConv.id,
      clientMessageId: groupMsgId,
      senderDeviceId: 'dev-a-web',
      ciphertext: mockCiphertext,
      iv: mockIv,
      ephemeralPublicKey: mockEphemeralKey,
      recipientWrappedKeys: mockRecipientWrappedKeys,
      aad: JSON.stringify({ conversationId: householdConv.id }),
      encryptionVersion: 'v1',
    });

    const unreadGroupB = await SecureMessagingService.getUnreadCounts(userB.id, household.id);
    const unreadGroupC = await SecureMessagingService.getUnreadCounts(userC.id, household.id);

    assert(unreadGroupB.totalUnread === 1, 'In group chat: User B receives unread notification (count=1)');
    assert(unreadGroupC.totalUnread === 1, 'In group chat: User C receives unread notification (count=1)');

    // ------------------------------------------------------------------------
    // TEST 7: Cross-Household Rejection for Read Receipts
    // ------------------------------------------------------------------------
    console.log('\n--- Test 7: Unauthorized Read Receipt Protection ---');
    let rejected = false;
    try {
      await SecureMessagingService.markConversationAsRead(
        directConvAB.id,
        userC.id, // User C is not a member of directConvAB
        household.id,
        'dev-c-web'
      );
    } catch (err: any) {
      if (err.message?.includes('Forbidden')) rejected = true;
    }
    assert(rejected, 'Unauthorized non-participant cannot mark direct conversation read');

  } catch (err) {
    console.error('❌ Unexpected suite error:', err);
    failed++;
  } finally {
    // Cleanup test data
    if (household) {
      await prisma.household.delete({ where: { id: household.id } }).catch(() => {});
    }
  }

  console.log(`\n==================================================`);
  console.log(`REAL-TIME MESSAGE NOTIFICATIONS SUITE: ${passed} PASSED, ${failed} FAILED`);
  console.log(`==================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runRealtimeNotificationTests();
