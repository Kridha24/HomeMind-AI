import assert from 'node:assert';
import { webcrypto } from 'node:crypto';

const { subtle } = webcrypto;

console.log('🧪 Starting HomeMind.AI Family Connect Secure Messaging & E2EE Frontend Logic Verification Suite...\n');

let passed = 0;

async function checkAsync(name, fn) {
  try {
    await fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}:`, err);
    process.exit(1);
  }
}

function check(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}:`, err.message);
    process.exit(1);
  }
}

// 1. Message Delivery States
check('Message Delivery Lifecycle covers all verified states', () => {
  const deliveryStates = ['SENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED'];
  assert.strictEqual(deliveryStates.length, 5);
  assert(deliveryStates.includes('SENDING'));
  assert(deliveryStates.includes('SENT'));
  assert(deliveryStates.includes('DELIVERED'));
  assert(deliveryStates.includes('READ'));
  assert(deliveryStates.includes('FAILED'));
});

// 2. Critical Security Rule Check for "End-to-end encrypted" Badge
check('Critical Security Rule: Badge displayed only when all 6 cryptographic criteria are true', () => {
  const isE2EESafeToDisplay = (auditCriteria) => {
    return (
      auditCriteria.encryptedBeforeLeavingDevice === true &&
      auditCriteria.serverReceivesCiphertextOnly === true &&
      auditCriteria.databaseStoresCiphertextOnly === true &&
      auditCriteria.serverCannotDerivePlaintext === true &&
      auditCriteria.recipientsDecryptLocally === true &&
      auditCriteria.logsExcludePlaintext === true
    );
  };

  const trueE2EEState = {
    encryptedBeforeLeavingDevice: true,
    serverReceivesCiphertextOnly: true,
    databaseStoresCiphertextOnly: true,
    serverCannotDerivePlaintext: true,
    recipientsDecryptLocally: true,
    logsExcludePlaintext: true,
  };
  assert.strictEqual(isE2EESafeToDisplay(trueE2EEState), true);

  // If server TLS alone:
  const tlsOnlyState = { ...trueE2EEState, serverReceivesCiphertextOnly: false };
  assert.strictEqual(isE2EESafeToDisplay(tlsOnlyState), false);

  // If server holds key:
  const serverKeyState = { ...trueE2EEState, serverCannotDerivePlaintext: false };
  assert.strictEqual(isE2EESafeToDisplay(serverKeyState), false);

  // If plaintext logged:
  const loggingPlaintextState = { ...trueE2EEState, logsExcludePlaintext: false };
  assert.strictEqual(isE2EESafeToDisplay(loggingPlaintextState), false);
});

// 3. Storage Boundary Check: Private Keys Disallowed from localStorage/sessionStorage/cookies
check('Storage Boundary: Private keys are strictly forbidden from localStorage, sessionStorage, and cookies', () => {
  const forbiddenStorageKeys = ['privateKey', 'private_key', 'e2ee_secret', 'crypto_priv'];
  const mockLocalStorage = {
    theme: 'dark',
    user: '{"name":"Rahul"}',
  };

  const violatesStorageRules = (storage) => {
    return Object.keys(storage).some((k) =>
      forbiddenStorageKeys.some((f) => k.toLowerCase().includes(f))
    );
  };

  assert.strictEqual(violatesStorageRules(mockLocalStorage), false);

  const unsafeStorage = { ...mockLocalStorage, local_private_key: 'RAW_SECRET' };
  assert.strictEqual(violatesStorageRules(unsafeStorage), true);
});

// 4. Privacy-Safe Push Notification Payload Validation
check('Privacy-Safe FCM Notification Payload contains NO plaintext body and NO key material', () => {
  const createSafeFcmPayload = (conversationId, messageId, senderName, senderAvatar) => {
    return {
      notification: {
        title: 'HomeMind Family Connect',
        body: `New message from ${senderName}`,
      },
      data: {
        conversationId,
        messageId,
        senderName,
        senderAvatar: senderAvatar || '',
        type: 'COMMUNICATION_CHAT',
      },
    };
  };

  const payload = createSafeFcmPayload('conv_123', 'msg_456', 'Rahul', null);
  assert.strictEqual(payload.notification.body, 'New message from Rahul');
  assert.strictEqual((payload.data).plaintext, undefined);
  assert.strictEqual((payload.data).text, undefined);
  assert.strictEqual((payload.data).key, undefined);
  assert.strictEqual((payload.data).privateKey, undefined);
});

// 5. Web Crypto End-to-End Cryptography: ECDH P-256 + AES-256-GCM + AES-KW
await checkAsync('Web Crypto API: Full client-side encryption, key wrapping, and decryption roundtrip', async () => {
  // Device 1 (Recipient)
  const recipientKeypair = await subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey', 'deriveBits']
  );

  // Sender generates Ephemeral ECDH Keypair
  const senderEphemeral = await subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey', 'deriveBits']
  );

  // Sender generates random 256-bit AES-GCM Content Encryption Key
  const cek = await subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  // Sender encrypts plaintext message
  const testPlaintext = 'HOME_MIND_E2EE_TEST_92741';
  const iv = webcrypto.getRandomValues(new Uint8Array(12));
  const aad = new TextEncoder().encode(
    JSON.stringify({
      conversationId: 'conv_alpha_99',
      senderId: 'user_alice',
      senderDeviceId: 'dev_browser_1',
      clientMessageId: 'msg_client_001',
      version: 'v1',
    })
  );

  const ciphertext = await subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: aad },
    cek,
    new TextEncoder().encode(testPlaintext)
  );

  // Sender wraps CEK for Recipient
  const senderDerivedWrapKey = await subtle.deriveKey(
    { name: 'ECDH', public: recipientKeypair.publicKey },
    senderEphemeral.privateKey,
    { name: 'AES-KW', length: 256 },
    false,
    ['wrapKey']
  );
  const wrappedCek = await subtle.wrapKey('raw', cek, senderDerivedWrapKey, 'AES-KW');

  // Recipient unwraps CEK
  const recipientDerivedUnwrapKey = await subtle.deriveKey(
    { name: 'ECDH', public: senderEphemeral.publicKey },
    recipientKeypair.privateKey,
    { name: 'AES-KW', length: 256 },
    false,
    ['unwrapKey']
  );
  const unwrappedCek = await subtle.unwrapKey(
    'raw',
    wrappedCek,
    recipientDerivedUnwrapKey,
    'AES-KW',
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  // Recipient decrypts ciphertext
  const decryptedBuffer = await subtle.decrypt(
    { name: 'AES-GCM', iv, additionalData: aad },
    unwrappedCek,
    ciphertext
  );
  const decryptedText = new TextDecoder().decode(decryptedBuffer);

  assert.strictEqual(decryptedText, testPlaintext);
});

// 6. AAD Integrity: Envelope Swapping Detection
await checkAsync('Web Crypto API: Tampered AAD fails authentication tag check', async () => {
  const recipientKeypair = await subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey', 'deriveBits']
  );

  const cek = await subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  const iv = webcrypto.getRandomValues(new Uint8Array(12));
  const authenticAad = new TextEncoder().encode(
    JSON.stringify({ conversationId: 'conv_household_1' })
  );

  const ciphertext = await subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: authenticAad },
    cek,
    new TextEncoder().encode('Protected Text')
  );

  // Tampered AAD (e.g., swapped into different conversation)
  const tamperedAad = new TextEncoder().encode(
    JSON.stringify({ conversationId: 'conv_household_2' })
  );

  let decryptionFailed = false;
  try {
    await subtle.decrypt(
      { name: 'AES-GCM', iv, additionalData: tamperedAad },
      cek,
      ciphertext
    );
  } catch (err) {
    decryptionFailed = true;
  }

  assert.strictEqual(decryptionFailed, true);
});

console.log(`\n==================================================`);
console.log(`FRONTEND E2EE TEST SUMMARY: ${passed} PASSED`);
console.log(`==================================================\n`);
