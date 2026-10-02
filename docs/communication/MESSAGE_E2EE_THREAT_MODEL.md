# HomeMind Connect — Message End-to-End Encryption Threat Model

## 1. Executive Summary

This document formalizes the threat model and cryptographic security boundaries for HomeMind Connect's household secure messaging system.

HomeMind Connect provides **True Message End-to-End Encryption (E2EE)** for all household communication. Plaintext messages are encrypted directly on the sender's client device using modern Web Crypto API primitives and authenticated key encapsulation. The HomeMind API backend and PostgreSQL database receive, persist, and relay **ciphertext envelopes only**. Server-held keys cannot decrypt message contents.

---

## 2. Cryptographic Primitives & Envelope Scheme

- **Device Identity & Key Agreement:** Elliptic Curve Diffie-Hellman (ECDH) over NIST curve **P-256** (secp256r1).
- **Symmetric Content Encryption:** **AES-256-GCM** (Galois/Counter Mode) with a unique, cryptographically random 96-bit IV per message.
- **Key Wrapping:** **AES-KW (AES Key Wrap, RFC 3394)** using 256-bit derived pairwise wrapping keys.
- **Key Derivation:** **HKDF-SHA-256** applied to pairwise ECDH shared secrets.
- **Authenticated Additional Data (AAD):** `{"conversationId": "...", "senderId": "...", "senderDeviceId": "...", "clientMessageId": "...", "version": "v1"}` bound cryptographically into the AES-GCM authentication tag.

---

## 3. Threat Actors & Attack Surface Analysis

### 3.1. Network Attacker (Man-in-the-Middle / Passive Wiretap)
- **Capability:** Intercepts, modifies, or replays TLS connections between clients and HomeMind API / TURN servers.
- **Mitigation:**
  - TLS 1.3 encryption in transit prevents passive interception.
  - Even if TLS were terminated or broken (e.g., enterprise proxy, rogue root CA), the message body payload is ciphertext encrypted with recipient device public keys.
  - Replay defense: Each message includes a unique `clientMessageId` and cryptographically random AES-GCM IV.
- **Outcome:** **Content Confidentiality & Integrity Preserved.**

### 3.2. Database Compromise (SQL Injection, Stolen DB Snapshot, Backup Leak)
- **Capability:** Complete read access to all rows in `Conversation`, `Message`, `MessageReceipt`, and `DeviceKey` tables.
- **Mitigation:**
  - The database stores **zero plaintext**. The `Message` table contains only `ciphertext`, `iv`, `ephemeralPublicKey`, `recipientWrappedKeys`, and `aad`.
  - The database contains public keys of devices (`DeviceKey.publicKey`), but **never private keys**.
  - Without any recipient endpoint's private key, the database snapshot yields no recoverable plaintext.
- **Audit Verification:** Audit phrase `HOME_MIND_E2EE_TEST_92741` does not exist in any database table.
- **Outcome:** **Full Content Secrecy Preserved.**

### 3.3. Malicious or Subverted Backend Server (Compromised Node.js Runtime)
- **Capability:** Attacker has code execution on the HomeMind API server.
- **Mitigation:**
  - Private keys are generated client-side using `window.crypto.subtle` and stored exclusively in browser IndexedDB / native Android keystore. Private keys are never transmitted to the API.
  - The API cannot forge valid AES-GCM ciphertext without being detected or having to generate its own keypair, which would trigger unauthenticated device alerts.
  - The API cannot decrypt envelopes in transit or in memory.
- **Outcome:** **Server Cannot Eavesdrop on Message Plaintext.**

### 3.4. Stolen Endpoint / Stolen Device
- **Capability:** Physical possession of an active user's smartphone or laptop.
- **Mitigation:**
  - Hardware-level protection: Android Keystore / OS-level encrypted storage protects browser IndexedDB and device storage.
  - Remote Device Revocation: Household admin or the affected user can invoke `DELETE /communication/device-key/:deviceId`, immediately revoking that device's identity key from the directory.
  - Subsequent messages sent by any household member will not include wrapped keys for the revoked device.
- **Outcome:** **Future Secrecy Preserved via Device Revocation.**

### 3.5. Removed Household Member (Forward Secrecy Behavior)
- **Capability:** A user who was previously in Household A is removed by the owner.
- **Mitigation:**
  - Real-time recipient filtering: When encrypting any message, sender client queries `/communication/conversation/:id/recipients`. The backend excludes removed members (`active: false, softDelete: true`).
  - The sender's client wraps the message Content Encryption Key (CEK) only for active member devices.
  - The removed member receives neither Socket.IO broadcasts nor wrapped keys, rendering them cryptographically incapable of decrypting future messages.
  - *Historical Note:* The removed member may retain messages they already received and decrypted while authorized. E2EE does not retroactively erase local memory.
- **Outcome:** **Immediate Forward Secrecy for All Post-Removal Messages.**

### 3.6. New Device Added to Account
- **Policy & Behavior:**
  - A newly registered device generates a fresh ECDH keypair and registers its public key.
  - Old messages in the database were encrypted with ephemeral CEKs wrapped only for devices existing at that time.
  - A new device cannot decrypt historical messages prior to its registration date unless an existing verified device performs a client-to-client secure key transfer.
  - This avoids dangerous server-side key escrow or backdoor recovery keys.
- **Outcome:** **No Backdoor Key Escrow; Clear Security Guarantee.**

### 3.7. Replay Attacks & Envelope Swapping
- **Capability:** An attacker replays an old encrypted envelope or swaps an envelope into a different conversation.
- **Mitigation:**
  - Deduplication: Unique constraint on `clientMessageId` and server deduplication in `SecureMessagingService`.
  - AAD Binding: Conversation ID and sender metadata are authenticated additional data in AES-256-GCM. If swapped to another conversation, AES-GCM authentication verification fails (`OperationError`), and recipient device displays `"Unable to decrypt this message."`
- **Outcome:** **Replay & Swapping Attacks Cryptographically Neutralized.**

---

## 4. Metadata Transparency & Leakage

End-to-End Encryption protects message payload content. HomeMind is completely transparent about what metadata the server processes:

| Metadata Element | Server Visible? | Purpose / Justification |
| :--- | :---: | :--- |
| **Message Plaintext** | ❌ **NO** | Never sent to or stored on server |
| **Sender User ID** | ✅ YES | Authentication & conversation routing |
| **Sender Device ID** | ✅ YES | Multi-device routing & receipt tracking |
| **Conversation ID** | ✅ YES | Household authorization & room isolation |
| **Timestamp** | ✅ YES | Chronological ordering & sync |
| **Ciphertext Size** | ✅ YES | Packet transport & quota management |
| **Recipient Device IDs**| ✅ YES | Key envelope delivery routing |
| **Delivery / Read State**| ✅ YES | Real-time receipts (`DELIVERED`, `READ`) |
| **Typing State** | ✅ YES (Transient)| Real-time typing indicators (in-memory only)|

---

## 5. Summary Conclusion

HomeMind Connect satisfies all requirements of a true E2EE architecture:
1. Client-side encryption before transmission.
2. Ciphertext-only storage on API and database.
3. Server possesses no private keys.
4. Recipients decrypt locally on their endpoints.
5. Logs contain zero plaintext or cryptographic secrets.
6. The `🔒 End-to-end encrypted` badge is mathematically verified.
