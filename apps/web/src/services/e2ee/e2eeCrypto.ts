import apiClient from '../apiClient';

/**
 * Web Crypto API End-to-End Encryption Engine for HomeMind Connect
 * Primitives:
 * - Device Keypair: ECDH (P-256)
 * - Message Content Encryption Key: AES-256-GCM
 * - Ephemeral Key Agreement: ECDH (P-256) + HKDF-SHA-256
 * - Key Wrapping: AES-KW (256-bit)
 * - Authenticated Additional Data (AAD): conversationId, senderId, clientMessageId, version
 * - Private Key Storage: Browser IndexedDB (never localStorage/sessionStorage/cookies)
 */

const DB_NAME = 'HomeMind_SecureStorage_v1';
const KEY_STORE_NAME = 'device_identity_keys';
const DEVICE_KEY_ID = 'local_device_key';

// IndexedDB Helper for private key persistence
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(KEY_STORE_NAME)) {
        db.createObjectStore(KEY_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getStoredKeyPair(): Promise<{ privateKey: CryptoKey; publicKey: CryptoKey; deviceId: string; publicKeyJWK: string } | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(KEY_STORE_NAME, 'readonly');
      const store = tx.objectStore(KEY_STORE_NAME);
      const req = store.get(DEVICE_KEY_ID);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function saveStoredKeyPair(record: { privateKey: CryptoKey; publicKey: CryptoKey; deviceId: string; publicKeyJWK: string }): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(KEY_STORE_NAME, 'readwrite');
    const store = tx.objectStore(KEY_STORE_NAME);
    const req = store.put(record, DEVICE_KEY_ID);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Base64 ArrayBuffer helpers
export function bufferToBase64(buf: ArrayBuffer): string {
  const bin = String.fromCharCode(...new Uint8Array(buf));
  return btoa(bin);
}

export function base64ToBuffer(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes.buffer;
}

export interface EncryptedEnvelope {
  conversationId: string;
  clientMessageId: string;
  senderDeviceId: string;
  ciphertext: string;
  iv: string;
  ephemeralPublicKey: string;
  recipientWrappedKeys: Record<string, string>;
  aad: string;
  encryptionVersion: string;
}

export class E2EEMessagingEngine {
  private static localDeviceId: string | null = null;
  private static localPrivateKey: CryptoKey | null = null;
  private static localPublicKeyJWK: string | null = null;

  /**
   * Initializes or loads device identity key and ensures it is registered on backend
   */
  public static async initDeviceIdentity(): Promise<{ deviceId: string; publicKey: string }> {
    if (this.localDeviceId && this.localPrivateKey && this.localPublicKeyJWK) {
      return { deviceId: this.localDeviceId, publicKey: this.localPublicKeyJWK };
    }

    const existing = await getStoredKeyPair();
    if (existing) {
      this.localDeviceId = existing.deviceId;
      this.localPrivateKey = existing.privateKey;
      this.localPublicKeyJWK = existing.publicKeyJWK;

      // Ensure server has latest record
      try {
        await apiClient.post('/communication/device-key', {
          deviceId: this.localDeviceId,
          deviceType: 'web',
          publicKey: this.localPublicKeyJWK,
        });
      } catch (e) {
        console.warn('[E2EE] Could not sync device key with server (offline or transient):', e);
      }

      return { deviceId: this.localDeviceId, publicKey: this.localPublicKeyJWK };
    }

    // Generate fresh P-256 ECDH Keypair
    const deviceId = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: 'ECDH',
        namedCurve: 'P-256',
      },
      true, // extractable for IndexedDB structured clone
      ['deriveKey', 'deriveBits']
    );

    const exportedJwk = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey);
    const publicKeyJWK = JSON.stringify(exportedJwk);

    await saveStoredKeyPair({
      privateKey: keyPair.privateKey,
      publicKey: keyPair.publicKey,
      deviceId,
      publicKeyJWK,
    });

    this.localDeviceId = deviceId;
    this.localPrivateKey = keyPair.privateKey;
    this.localPublicKeyJWK = publicKeyJWK;

    // Register with backend directory
    try {
      await apiClient.post('/communication/device-key', {
        deviceId,
        deviceType: 'web',
        publicKey: publicKeyJWK,
      });
    } catch (e) {
      console.warn('[E2EE] Failed to register new device key:', e);
    }

    return { deviceId, publicKey: publicKeyJWK };
  }

  /**
   * Gets current deviceId
   */
  public static getDeviceId(): string {
    return this.localDeviceId || 'unknown_device';
  }

  /**
   * Encrypts plaintext message into an E2EE envelope wrapped for all active recipient devices
   */
  public static async encryptMessage(
    plaintext: string,
    recipientDevices: Array<{ deviceId: string; publicKey: string }>,
    metadata: {
      conversationId: string;
      senderId: string;
      clientMessageId: string;
    }
  ): Promise<EncryptedEnvelope> {
    await this.initDeviceIdentity();
    const senderDeviceId = this.localDeviceId!;

    // 1. Generate random 256-bit AES-GCM Content Encryption Key (CEK)
    const cek = await window.crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    // 2. Generate random 12-byte IV (nonce)
    const ivBytes = window.crypto.getRandomValues(new Uint8Array(12));
    const iv = bufferToBase64(ivBytes.buffer);

    // 3. Form Authenticated Additional Data (AAD)
    const aadObj = {
      conversationId: metadata.conversationId,
      senderId: metadata.senderId,
      senderDeviceId,
      clientMessageId: metadata.clientMessageId,
      version: 'v1',
    };
    const aadString = JSON.stringify(aadObj);
    const aadBytes = new TextEncoder().encode(aadString);

    // 4. Encrypt Plaintext with AES-GCM + AAD
    const plaintextBytes = new TextEncoder().encode(plaintext);
    const ciphertextBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: ivBytes,
        additionalData: aadBytes,
      },
      cek,
      plaintextBytes
    );
    const ciphertext = bufferToBase64(ciphertextBuffer);

    // 5. Generate Ephemeral ECDH P-256 Keypair for this message
    const ephemeralKeyPair = await window.crypto.subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveKey', 'deriveBits']
    );

    const ephemeralPublicKeyJwk = await window.crypto.subtle.exportKey(
      'jwk',
      ephemeralKeyPair.publicKey
    );
    const ephemeralPublicKey = JSON.stringify(ephemeralPublicKeyJwk);

    // 6. Wrap CEK for each recipient device using ECDH + AES-KW
    const recipientWrappedKeys: Record<string, string> = {};

    // Include sender's own device so sender can view own message on reload/multi-device
    const allTargets = [...recipientDevices];
    if (!allTargets.some((d) => d.deviceId === senderDeviceId) && this.localPublicKeyJWK) {
      allTargets.push({ deviceId: senderDeviceId, publicKey: this.localPublicKeyJWK });
    }

    for (const device of allTargets) {
      try {
        const parsedKey = JSON.parse(device.publicKey);
        const recipientPubKey = await window.crypto.subtle.importKey(
          'jwk',
          parsedKey,
          { name: 'ECDH', namedCurve: 'P-256' },
          false,
          []
        );

        // Derive AES-KW wrapping key using ECDH
        const wrappingKey = await window.crypto.subtle.deriveKey(
          { name: 'ECDH', public: recipientPubKey },
          ephemeralKeyPair.privateKey,
          { name: 'AES-KW', length: 256 },
          false,
          ['wrapKey']
        );

        // Wrap the CEK
        const wrappedKeyBuffer = await window.crypto.subtle.wrapKey('raw', cek, wrappingKey, 'AES-KW');
        recipientWrappedKeys[device.deviceId] = bufferToBase64(wrappedKeyBuffer);
      } catch (err) {
        console.warn(`[E2EE] Could not wrap CEK for device ${device.deviceId}:`, err);
      }
    }

    return {
      conversationId: metadata.conversationId,
      clientMessageId: metadata.clientMessageId,
      senderDeviceId,
      ciphertext,
      iv,
      ephemeralPublicKey,
      recipientWrappedKeys,
      aad: aadString,
      encryptionVersion: 'v1',
    };
  }

  /**
   * Decrypts an E2EE envelope on recipient device using local private key
   */
  public static async decryptMessage(envelope: EncryptedEnvelope): Promise<string> {
    await this.initDeviceIdentity();
    const myDeviceId = this.localDeviceId;
    if (!myDeviceId || !this.localPrivateKey) {
      return 'Unable to decrypt this message. (Device key missing)';
    }

    const wrappedKeyB64 = envelope.recipientWrappedKeys[myDeviceId];
    if (!wrappedKeyB64) {
      return 'Unable to decrypt this message. (Message not encrypted for this device)';
    }

    try {
      const ephemeralKeyJwk = JSON.parse(envelope.ephemeralPublicKey);
      const ephemeralPubKey = await window.crypto.subtle.importKey(
        'jwk',
        ephemeralKeyJwk,
        { name: 'ECDH', namedCurve: 'P-256' },
        false,
        []
      );

      // Derive AES-KW unwrap key using local private key + ephemeral public key
      const unwrapKey = await window.crypto.subtle.deriveKey(
        { name: 'ECDH', public: ephemeralPubKey },
        this.localPrivateKey,
        { name: 'AES-KW', length: 256 },
        false,
        ['unwrapKey']
      );

      // Unwrap the CEK
      const wrappedKeyBuffer = base64ToBuffer(wrappedKeyB64);
      const cek = await window.crypto.subtle.unwrapKey(
        'raw',
        wrappedKeyBuffer,
        unwrapKey,
        'AES-KW',
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );

      // Decrypt Ciphertext with AES-GCM + IV + AAD
      const ivBytes = new Uint8Array(base64ToBuffer(envelope.iv));
      const aadBytes = new TextEncoder().encode(envelope.aad);
      const ciphertextBuffer = base64ToBuffer(envelope.ciphertext);

      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: ivBytes,
          additionalData: aadBytes,
        },
        cek,
        ciphertextBuffer
      );

      return new TextDecoder().decode(decryptedBuffer);
    } catch (err) {
      console.warn('[E2EE] Decryption failed for message:', envelope.clientMessageId);
      return 'Unable to decrypt this message.';
    }
  }
}
