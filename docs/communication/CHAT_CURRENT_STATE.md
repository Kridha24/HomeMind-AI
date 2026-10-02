# HomeMind Connect — Chat Current State Audit

**Date**: 2026-10-02  
**Branch**: `feat/family-connect-secure-comms`  
**Auditor**: Antigravity Core Agent  

---

## Executive Summary

An audit of the pre-existing chat implementation in HomeMind-AI revealed that while real-time text chat UI exists in `FamilyChat.tsx` and an ephemeral Socket.IO listener was wired in `server.ts` (`family_send_message`), **the chat system lacked message persistence, read receipts, delivery acknowledgments, typing indicators, and end-to-end encryption (E2EE)**. Furthermore, the UI previously displayed an unjustified "End-to-End Encrypted Workspace" badge despite transmitting plaintext over websockets without server-side encryption or device identity keys.

---

## Detailed Audit Findings

### 1. Database & Persistence
- **Conversation Model**: **DOES NOT EXIST**. There were no database entities for `Conversation` or `ConversationMember`.
- **Message Model**: **DOES NOT EXIST**. Messages were purely ephemeral in-memory objects generated on-the-fly inside the Socket.IO event handler (`'msg_' + Date.now()`).
- **Offline Delivery**: **NO**. If a recipient device is offline or closed when a message is sent, the message is permanently lost.
- **Plaintext in Storage**: **NO** (because messages were not stored at all).

### 2. Real-Time Signaling & Sockets
- **Socket Event**: `family_send_message` and `family_new_message` in `server.ts`.
- **Authorization**: Checked socket session `householdId` and `userId`, but did not validate conversation membership or device credentials.
- **Typing Indicators**: **NO**. No events existed for `typing:start` or `typing:stop`.
- **Presence**: Partial (tracked online user IDs in `onlineHouseholdUsers` set, but no per-conversation presence).

### 3. Delivery & Receipts
- **Sent State**: **NO** (no server persistence confirmation).
- **Delivered State**: **NO** (no recipient delivery acknowledgment).
- **Read Receipts**: **NO** (no read tracking or persistent receipt data).

### 4. Cryptographic Security & E2EE
- **Device Identity Keys**: **DOES NOT EXIST**. Devices had no cryptographic identity keys (ECDH / Ed25519 / P-256).
- **Client-Side Encryption**: **NO**. Text was sent as plain string (`text: payload.text`).
- **Server Knowledge**: Server inspected plaintext text directly.
- **True Message E2EE**: **NO**.
- **Attachment Encryption**: **DOES NOT EXIST**.

---

## Status Report Matrix

```
CHAT EXISTS:
YES (UI Component in FamilyChat.tsx and Socket event in server.ts)

MESSAGE DB MODEL:
NONE (Messages were ephemeral and unpersisted)

PLAINTEXT CURRENTLY STORED:
NO (Messages were not stored in DB, but were transmitted as plaintext in websocket payloads)

READ RECEIPTS:
NO

OFFLINE DELIVERY:
NO

CURRENT ENCRYPTION:
TRANSPORT TLS ONLY (HTTPS/WSS). Zero message-layer or device-layer encryption.

TRUE MESSAGE E2EE:
NO

SECURITY GAPS:
1. False E2EE badge in UI ("End-to-End Encrypted Workspace") with zero client-side crypto.
2. Plaintext message bodies transmitted over WebSocket.
3. No message persistence or conversation authorization model.
4. No device identity keys or public key directory.
5. No delivery receipts or read state tracking.
6. Offline recipients lose all messages sent while disconnected.
```
