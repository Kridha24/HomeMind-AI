import assert from 'assert';
import { DeviceTokenService, DEFAULT_NOTIFICATION_PREFERENCES } from '../modules/communication/deviceTokenService';
import { fcmProvider, FcmProvider } from '../infrastructure/notifications/fcmProvider';
import { NotificationDispatcher } from '../modules/notifications/notificationDispatcher';

async function runPushNotificationTests() {
  console.log('🧪 Starting HomeMind.AI Multi-Device Push Notification Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => Promise<void> | void) {
    return Promise.resolve()
      .then(fn)
      .then(() => {
        console.log(`  ✅ PASS: ${name}`);
        passed++;
      })
      .catch((err) => {
        console.error(`  ❌ FAIL: ${name}\n     ${err.message}`);
        failed++;
      });
  }

  // 1. Token Masking & Sanitization Security
  await test('Security: Token masking never logs or exposes complete push tokens', () => {
    const rawToken = 'fKz9P8xQw1234567890abcdefghijklmnopqrstuvwxyz';
    const masked = FcmProvider.maskToken(rawToken);
    assert.strictEqual(masked.startsWith('fKz9...'), true);
    assert.strictEqual(masked.endsWith('wxyz'), true);
    assert.strictEqual(masked.includes('abcdefgh'), false, 'Masked token leaked middle characters!');
    assert.strictEqual(FcmProvider.maskToken(''), 'null');
    assert.strictEqual(FcmProvider.maskToken('short'), '***');
  });

  await test('Security: Internal route sanitization prevents open redirects and arbitrary URLs', () => {
    assert.strictEqual(FcmProvider.sanitizeInternalRoute('/finance'), '/finance');
    assert.strictEqual(FcmProvider.sanitizeInternalRoute('/bills?view=overdue'), '/bills?view=overdue');
    assert.strictEqual(FcmProvider.sanitizeInternalRoute('https://evil.com/phish'), '/');
    assert.strictEqual(FcmProvider.sanitizeInternalRoute('//evil.com'), '/');
    assert.strictEqual(FcmProvider.sanitizeInternalRoute('javascript:alert(1)'), '/');
    assert.strictEqual(FcmProvider.sanitizeInternalRoute(undefined), '/');
  });

  // 2. Multi-Device Registration per User
  await test('Multi-Device: Same user can register multiple distinct devices (laptop, phone, desktop)', async () => {
    const userId = 'user-multidev-101';
    const laptopToken = 'token_laptop_macbook_chrome_101';
    const phoneToken = 'token_phone_android_chrome_102';
    const desktopToken = 'token_desktop_windows_edge_103';

    // Register laptop
    await DeviceTokenService.registerToken(userId, {
      token: laptopToken,
      platform: 'web',
      deviceName: 'Chrome on macOS',
      browser: 'Chrome',
    });

    // Register phone
    await DeviceTokenService.registerToken(userId, {
      token: phoneToken,
      platform: 'android',
      deviceName: 'Chrome on Android',
      browser: 'Chrome',
    });

    // Register desktop
    await DeviceTokenService.registerToken(userId, {
      token: desktopToken,
      platform: 'web',
      deviceName: 'Edge on Windows',
      browser: 'Edge',
    });

    // Verify all active tokens
    const activeTokens = await DeviceTokenService.getActiveTokensForUser(userId);
    assert.strictEqual(activeTokens.length, 3, 'User should have 3 registered devices');
    assert.ok(activeTokens.includes(laptopToken));
    assert.ok(activeTokens.includes(phoneToken));
    assert.ok(activeTokens.includes(desktopToken));

    // Verify device listing excludes raw token
    const devices = await DeviceTokenService.getUserDevices(userId);
    assert.strictEqual(devices.length, 3);
    for (const dev of devices) {
      assert.ok(!dev.maskedToken.includes('token_laptop_macbook'), 'Raw token was exposed in device list!');
      assert.ok(dev.preferences.finance, 'Default finance pref should be true');
    }
  });

  // 3. Independent Device Unregistration & Cross-User Protection
  await test('Security & Unregistration: Device unregister deactivates only target token and blocks cross-user attacks', async () => {
    const userA = 'user-alice-201';
    const userB = 'user-bob-202';
    const tokenA = 'token_alice_phone_201';
    const tokenB = 'token_bob_phone_202';

    await DeviceTokenService.registerToken(userA, { token: tokenA, platform: 'web' });
    await DeviceTokenService.registerToken(userB, { token: tokenB, platform: 'web' });

    // User A cannot unregister User B's token
    const unauthorizedAttempt = await DeviceTokenService.unregisterToken(userA, tokenB);
    assert.strictEqual(unauthorizedAttempt, false, 'User A should NOT be able to unregister User B token');

    // Bob still has active token
    const bobTokens = await DeviceTokenService.getActiveTokensForUser(userB);
    assert.ok(bobTokens.includes(tokenB));

    // User A unregisters their own token
    const successUnregister = await DeviceTokenService.unregisterToken(userA, tokenA);
    assert.strictEqual(successUnregister, true);

    const aliceTokens = await DeviceTokenService.getActiveTokensForUser(userA);
    assert.strictEqual(aliceTokens.length, 0, 'Alice token should be inactive');
  });

  // 4. Stale Token Deactivation
  await test('Reliability: Stale or invalid tokens are automatically deactivated', async () => {
    const userId = 'user-stale-test-301';
    const staleToken = 'token_stale_expired_by_fcm_301';

    await DeviceTokenService.registerToken(userId, { token: staleToken, platform: 'web' });
    let tokensBefore = await DeviceTokenService.getActiveTokensForUser(userId);
    assert.strictEqual(tokensBefore.length, 1);

    // Trigger stale token deactivation (same as FCM provider callback on 404/UNREGISTERED)
    await DeviceTokenService.deactivateStaleToken(staleToken);

    let tokensAfter = await DeviceTokenService.getActiveTokensForUser(userId);
    assert.strictEqual(tokensAfter.length, 0, 'Stale token must be deactivated immediately');
  });

  // 5. Category Preference Filtering
  await test('Preferences: Category preferences filter out notifications for disabled categories', async () => {
    const userId = 'user-prefs-401';
    const deviceToken = 'token_custom_prefs_device_401';

    await DeviceTokenService.registerToken(userId, {
      token: deviceToken,
      platform: 'web',
      preferences: {
        finance: false, // Disabled finance
        bills: true,
        tasks: true,
        groceries: false, // Disabled groceries
        family: true,
        security: true,
      },
    });

    // Query for FINANCE -> should return 0 tokens (filtered out!)
    const financeTokens = await DeviceTokenService.getActiveTokensForUser(userId, 'FINANCE');
    assert.strictEqual(financeTokens.length, 0, 'Finance notifications must be filtered when preference is false');

    // Query for GROCERIES -> should return 0 tokens (filtered out!)
    const groceryTokens = await DeviceTokenService.getActiveTokensForUser(userId, 'GROCERIES');
    assert.strictEqual(groceryTokens.length, 0, 'Grocery notifications must be filtered when preference is false');

    // Query for BILLS -> should return 1 token (enabled!)
    const billTokens = await DeviceTokenService.getActiveTokensForUser(userId, 'BILLS');
    assert.strictEqual(billTokens.length, 1, 'Bill notifications must be delivered when preference is true');
    assert.strictEqual(billTokens[0], deviceToken);

    // Query for TASKS -> should return 1 token (enabled!)
    const taskTokens = await DeviceTokenService.getActiveTokensForUser(userId, 'TASKS');
    assert.strictEqual(taskTokens.length, 1, 'Task notifications must be delivered when preference is true');
  });

  // 6. Notification Dispatcher: Actor Exclusion
  await test('Dispatch: Actor who performed the action is strictly excluded from notification delivery', async () => {
    const actorId = 'actor-carlos-501';
    const recipientId = 'recipient-maria-502';

    const actorToken = 'token_actor_carlos_501';
    const recipientToken = 'token_recipient_maria_502';

    await DeviceTokenService.registerToken(actorId, { token: actorToken, platform: 'web' });
    await DeviceTokenService.registerToken(recipientId, { token: recipientToken, platform: 'web' });

    // Dispatch event where Carlos added an expense
    const result = await NotificationDispatcher.dispatchEvent({
      householdId: 'household-test-500',
      actorId,
      recipientUserIds: [actorId, recipientId],
      category: 'FINANCE',
      title: 'New Shared Expense',
      body: 'A new shared expense was added',
      link: '/finance',
    });

    // Only Maria should be reached, Carlos (actor) must be excluded
    assert.strictEqual(result.recipientCount, 1, 'Should reach only the 1 authorized recipient (actor excluded)');
    assert.strictEqual(result.deviceCount, 1, 'Should deliver to exactly 1 device');
  });

  // 7. Deduplication Protection
  await test('Dispatch: Rapid retries or duplicate events are suppressed via deduplication', async () => {
    const recipientId = 'user-dedup-601';
    const recipientToken = 'token_dedup_test_601';
    await DeviceTokenService.registerToken(recipientId, { token: recipientToken, platform: 'web' });

    const dedupKey = `test-dedup-${Date.now()}`;

    // First attempt
    const res1 = await NotificationDispatcher.dispatchEvent({
      householdId: 'household-dedup-600',
      recipientUserIds: [recipientId],
      category: 'BILLS',
      title: 'Bill Reminder',
      body: 'Electricity bill due',
      link: '/bills',
      dedupKey,
    });
    assert.strictEqual(res1.deduped, undefined, 'First attempt should not be deduped');

    // Immediate second attempt with same dedupKey
    const res2 = await NotificationDispatcher.dispatchEvent({
      householdId: 'household-dedup-600',
      recipientUserIds: [recipientId],
      category: 'BILLS',
      title: 'Bill Reminder',
      body: 'Electricity bill due',
      link: '/bills',
      dedupKey,
    });
    assert.strictEqual(res2.deduped, true, 'Second attempt must be recognized as duplicate');
    assert.strictEqual(res2.deviceCount, 0, 'Duplicate attempt must not dispatch push');
  });

  // 8. Sandbox & Graceful Error Handling
  await test('Reliability: FCM sandbox mode gracefully handles delivery without crash when cloud keys are unconfigured', async () => {
    const sendResult = await fcmProvider.sendPushNotification('mock_valid_push_token_701', {
      title: 'Test Notification',
      body: 'Everything is running smoothly',
      category: 'GENERAL',
      link: '/settings',
    });

    assert.strictEqual(sendResult.success, true);
    assert.ok(sendResult.messageId, 'Message ID must be generated');
  });

  console.log(`\n==================================================`);
  console.log(`MULTI-DEVICE PUSH NOTIFICATION SUITE: ${passed} PASSED, ${failed} FAILED`);
  console.log(`==================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runPushNotificationTests();
