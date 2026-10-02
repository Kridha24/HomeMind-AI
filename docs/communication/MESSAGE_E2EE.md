# HomeMind Connect — Message End-to-End Encryption (E2EE) Specification

## 1. Overview & Security Guarantee

HomeMind Connect implements a zero-knowledge, client-side End-to-End Encrypted messaging protocol designed for household communication across Web and Android platforms.

### Core Guarantees
- **Message Content Privacy:** Plaintext is encrypted on the sender's device before leaving memory.
- **Zero-Knowledge Backend:** The HomeMind API backend and PostgreSQL database store only authenticated ciphertext (`AES-256-GCM`), initialization vectors, ephemeral public keys, and wrapped key bundles.
- **No Server Decryption:** The backend holds no private keys and cannot derive message plaintext under any circumstances.
- **Strict Endpoint Verification:** Decryption occurs exclusively on authorized recipient devices using locally held private keys stored in secure storage.
- **Privacy-Safe Push Notifications:** Push notifications sent via Firebase Cloud Messaging (FCM) convey only sender identity and conversation metadata — **never plaintext message content**.

---

## 2. Cryptographic Primitives

HomeMind uses standard, audited Web Crypto API (`window.crypto.subtle`) primitives:

| Category | Primitive / Algorithm | Parameters | Purpose |
| :--- | :--- | :--- | :--- |
| **Device Keypair** | ECDH | Curve P-256 (secp256r1) | Long-term asymmetric device identity |
| **Content Encryption** | AES-GCM | 256-bit key, 96-bit IV, 128-bit tag | Authenticated payload encryption |
| **Key Wrapping** | AES-KW (RFC 3394) | 256-bit key | Encapsulation of per-message CEK |
| **Key Agreement** | ECDH + HKDF | P-256 + SHA-256 | Pairwise unwrap key derivation |
| **Integrity / AAD** | AEAD Additional Data | Canonical JSON string | Envelope binding against swapping/replay |

---

## 3. Key Generation & Secure Storage

### Web Platform
1. **Generation:** When a user logs in, `E2EEMessagingEngine.initDeviceIdentity()` checks browser `IndexedDB` (`HomeMind_SecureStorage_v1`).
2. If absent, a new ECDH P-256 keypair is generated via `window.crypto.subtle.generateKey`.
3. **Storage:** The private key is persisted in IndexedDB.
   - **Prohibited Storage:** Private keys are **NEVER** stored in `localStorage`, `sessionStorage`, or cookies.
4. **Registration:** The public key (JWK format) is registered with the backend key directory via `POST /api/v1/communication/device-key`.

### Android (Capacitor)
- Native key material is isolated within application sandbox storage. WebViews share encrypted storage with the app boundary.

---

## 4. Message Send Flow

When a user submits a message:

```
[Plaintext String]
       │
       ▼
1. Generate random 256-bit Content Encryption Key (CEK)
2. Generate random 96-bit IV
3. Assemble Authenticated Additional Data (AAD):
   { conversationId, senderId, senderDeviceId, clientMessageId, version: "v1" }
4. Encrypt Plaintext using AES-256-GCM + IV + AAD ──► Ciphertext + Auth Tag
       │
       ▼
5. Generate Ephemeral ECDH P-256 Keypair (unique per message)
6. Fetch active recipient device public keys for household conversation
       │
       ▼
7. For each recipient device:
   ├── Derive pairwise key = ECDH(Ephemeral Private Key, Device Public Key)
   └── Wrap CEK using AES-KW(pairwise key, CEK) ──► recipientWrappedKeys[deviceId]
       │
       ▼
8. Assemble Envelope:
   {
     conversationId,
     clientMessageId,
     senderDeviceId,
     ciphertext,
     iv,
     ephemeralPublicKey,
     recipientWrappedKeys,
     aad,
     encryptionVersion: "v1"
   }
       │
       ▼
9. Transmit via Socket.IO `message:send`
       │
       ▼
[Server: Validates Auth ──► Persists Ciphertext in DB ──► Broadcasts `message:new`]
```

---

## 5. Message Receive Flow

When a recipient device receives `message:new` (or fetches historical messages from `/messages`):

```
[Encrypted Envelope]
       │
       ▼
1. Extract wrappedKey for local deviceId:
   wrappedKey = envelope.recipientWrappedKeys[localDeviceId]
   (If missing: display "Unable to decrypt this message.")
       │
       ▼
2. Import Ephemeral Public Key from envelope
3. Derive unwrap key = ECDH(Local Private Key, Ephemeral Public Key)
4. Unwrap CEK = AES-KW.unwrapKey(derivedKey, wrappedKey)
       │
       ▼
5. Decrypt Ciphertext = AES-GCM.decrypt(CEK, iv, aad, ciphertext)
       │
       ▼
[Render Decrypted Plaintext in Memory / UI]
       │
       ├──► Emit socket `message:delivered`
       └──► Emit socket `message:read`
```

---

## 6. Multi-Device Architecture

HomeMind does not assume one device per user:
- A user may operate a web browser and an Android phone simultaneously.
- When sending a message, the sender client encrypts the CEK for **all active devices** belonging to every active household member, plus the sender's other devices.
- Sender's current device also wraps the CEK for itself so messages can be seamlessly decrypted when reloading history.

---

## 7. Removed-Member Forward Secrecy

When a member is removed from a household:
1. Backend household authorization immediately revokes their membership.
2. Subsequent calls to `/communication/conversation/:id/recipients` exclude the removed member and all their registered devices.
3. The sender device never wraps future CEKs for the removed member.
4. **Result:** The removed member cannot decrypt any future household messages.
5. *Historical Access Limitation:* The removed member may still retain past messages they previously downloaded and decrypted while authorized. E2EE does not perform retroactive physical erasure from remote devices.

---

## 8. Server-Visible Metadata (Transparency)

E2EE protects the content of messages. The HomeMind API server processes the following operational metadata:

- `conversationId`: Needed for room routing and household authorization.
- `senderId` / `senderDeviceId`: Needed to confirm authenticity and manage multi-device sync.
- `clientMessageId`: Needed for idempotency and deduplication.
- `createdAt`: Chronological ordering.
- `ciphertext` length: Payload limits.
- `recipientWrappedKeys` device IDs: Delivery routing.
- Delivery and Read timestamps: Real-time read receipts.

---

## 9. Known Limitations & Design Trade-offs

1. **New Device Historical Access:** A newly registered device will not have historical messages encrypted for its keypair. Historical messages will display `"Unable to decrypt this message."` unless transferred via device-to-device sync.
2. **Search Limitations:** The server cannot perform plaintext search over ciphertext. Message search is implemented client-side across locally decrypted messages.
3. **No Retroactive Erasure:** Deleting a message on the server creates a soft-delete tombstone. Recipient devices that have already decrypted and stored the message locally cannot be cryptographically forced to erase it.
