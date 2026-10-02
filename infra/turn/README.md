# HomeMind.AI Production TURN Infrastructure Reference

This directory provides the production deployment architecture, security configuration, firewall requirements, and capacity planning for HomeMind.AI's WebRTC relay infrastructure.

---

## 1. Architecture Overview

WebRTC media communication attempts direct peer-to-peer (P2P) traversal using public STUN servers first. When endpoints reside behind symmetric NATs, mobile carrier CGNAT, or restrictive enterprise firewalls, direct UDP hole punching fails. In these scenarios, media traffic automatically falls back to an authenticated TURN (Traversal Using Relays around NAT) relay server.

```
Caller (Web / Android)
   │
   ├────── STUN Binding Request (stun.l.google.com:19302)
   │
   ├────── Direct P2P Attempt (Host / Server Reflexive)
   │           │
   │           ├── Success ──> Direct P2P Media Stream (DTLS-SRTP)
   │           │
   │           └── Blocked by Symmetric NAT / Enterprise Firewall
   │
   └────── Authenticated TURN Relay Request (turn:turn.homemind.ai:3478)
               │
               ▼
       Coturn Relay Server
               │
               ▼
       Callee (Web / Android)
```

> **Security Note**: All media traversing the TURN relay remains encrypted with **DTLS 1.2/1.3 and SRTP**. The TURN relay only forwards encrypted UDP/TCP packets and cannot decrypt audio or video content.

---

## 2. Firewall & Port Requirements

Ensure the following inbound rules are provisioned in your cloud firewall / security group (AWS EC2, GCP GCE, or DigitalOcean):

| Protocol | Port / Port Range | Direction | Purpose | Description |
| :--- | :--- | :--- | :--- | :--- |
| **UDP** | `3478` | Inbound | STUN / TURN standard | Primary UDP relay allocation port |
| **TCP** | `3478` | Inbound | STUN / TURN fallback | TCP fallback when UDP is blocked by firewall |
| **TCP** | `5349` | Inbound | TURNS (TLS) | Secure TURN over TLS (traverses restrictive proxies) |
| **UDP** | `49152 – 65535` | Inbound | Dynamic Media Relay | Ephemeral UDP ports allocated for relayed media streams |

---

## 3. Ephemeral TURN REST API Authentication

HomeMind.AI does **NOT** ship permanent static TURN credentials to clients.

The server implements the **TURN REST API (RFC 5766 / draft-uberti-behave-turn-rest-00)** specification via `GET /api/v1/communication/ice-config`.

### Credential Derivation:
1. `expiryTimestamp = Math.floor(Date.now() / 1000) + TTL_SECONDS` (default: 3600s / 1 hour)
2. `username = "${expiryTimestamp}:${userId}"`
3. `credential = Base64(HMAC-SHA1(TURN_SHARED_SECRET, username))`

The static `TURN_SHARED_SECRET` exists strictly on the backend and inside `turnserver.conf`. Clients only receive ephemeral credentials that expire automatically.

---

## 4. Production Environment Configuration

Set the following environment variables on your backend API:

```env
# WebRTC STUN/TURN Configuration
WEBRTC_STUN_URLS="stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302"
TURN_URL="turn:turn.homemind.ai:3478?transport=udp,turn:turn.homemind.ai:3478?transport=tcp,turns:turn.homemind.ai:5349?transport=tcp"
TURN_SHARED_SECRET="<OUTPUT_OF_OPENSSL_RAND_HEX_32>"
TURN_CREDENTIAL_TTL_SECONDS="3600"
```

---

## 5. Capacity & Bandwidth Planning

Unlike signaling servers (which only handle small JSON text messages), a TURN relay actively handles raw audio and video RTP streams. Because a relay receives media from one peer and transmits it to another, each relayed stream consumes **2x bandwidth** on the TURN server (ingress + egress).

### Baseline Bitrate Profiles:
- **Audio (Opus HD Voice)**: ~40 kbps
- **720p Video (VP8/H.264 @ 30fps)**: ~1,500 kbps (1.5 Mbps)
- **Combined 1:1 Video Call (per participant)**: ~1.54 Mbps
- **Relay Ingress + Egress per Call**: `1.54 Mbps × 2 participants × 2 (in/out) = ~6.16 Mbps total relay bandwidth per call`.

### Concurrency Bandwidth Estimations:

| Concurrent Relayed Calls | Total Concurrent Relay Streams | Relay Network Bandwidth Required | Recommended Server Specs |
| :--- | :--- | :--- | :--- |
| **10 calls** | 20 streams | **~62 Mbps** | 2 vCPU, 2 GB RAM, 100 Mbps uplink |
| **50 calls** | 100 streams | **~310 Mbps** | 4 vCPU, 4 GB RAM, 1 Gbps uplink |
| **100 calls** | 200 streams | **~620 Mbps** | 8 vCPU, 8 GB RAM, 1 Gbps uplink |
| **500 calls** | 1,000 streams | **~3.1 Gbps** | Multi-node cluster with Anycast DNS / Geo-DNS |

> **Direct vs Relay Ratio**: In typical consumer applications, 80–85% of 1:1 calls successfully connect via direct P2P (STUN). Approximately 15–20% require TURN relaying. Sizing for 100 concurrent relayed calls supports an active calling pool of ~500–600 simultaneous active calls.

---

## 6. TLS / TURNS Certificate Setup

For secure `turns:` on port 5349:
1. Place valid SSL/TLS certificates (e.g. Let's Encrypt for `turn.homemind.ai`) in `infra/turn/certs/`:
   - `fullchain.pem`
   - `privkey.pem`
2. Start the container:
   ```bash
   docker compose -f docker-compose.turn.yml up -d
   ```
3. Test using `turnutils_stunclient`:
   ```bash
   turnutils_stunclient turn.homemind.ai 3478
   ```
