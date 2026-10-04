# HomeMind AI — Intelligent Family Household Operating System

<div align="center">

  ![HomeMind AI Banner](https://img.shields.io/badge/HomeMind_AI-Household_Operating_System-6366f1?style=for-the-badge&logo=homeadvisor&logoColor=white)

  **A unified, privacy-first, intelligent operating system for modern families and households.**

  [![React 18](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)](https://react.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
  [![Express](https://img.shields.io/badge/Express-4.18-000000?style=flat-square&logo=express)](https://expressjs.com/)
  [![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
  [![Redis](https://img.shields.io/badge/Redis-7.0-DC382D?style=flat-square&logo=redis)](https://redis.io/)
  [![Socket.IO](https://img.shields.io/badge/Socket.IO-4.7-010101?style=flat-square&logo=socketdotio)](https://socket.io/)
  [![WebRTC](https://img.shields.io/badge/WebRTC-P2P_Calling-333333?style=flat-square&logo=webrtc)](https://webrtc.org/)
  [![Turborepo](https://img.shields.io/badge/Turborepo-Monorepo-EF4444?style=flat-square&logo=turborepo)](https://turbo.build/)

</div>

---

## 📌 Executive Overview

**HomeMind AI** is an intelligent, multi-tenant Household Operating System designed to replace fragmented utility apps, spreadsheets, chat groups, and paper chore lists with a single cohesive command center.

Crafted around a warm, premium, and human-centric living experience, HomeMind AI balances proactive smart home intelligence with strict tenant data isolation, role-based governance, and end-to-end cryptographic privacy.

---

## 🌟 Core System Capabilities

### 1. 🏠 Executive Command Center (Dashboard)
- **Personalized Living Greeting**: Real-time context, live household clock, active member presence, and environmental indicators.
- **Quick Action Command Bar**: Instant one-click triggers for `+ Income`, `+ Expense`, `+ Bill`, `+ Grocery`, and `+ Task`.
- **Financial Velocity Metrics**: Glowing visual cards displaying total income, monthly expenditure, net balance, and active budget utilization.
- **Today Living Overview**: Consolidated snapshot tracking overdue and upcoming bills, assigned chores, and urgent pantry shortages.
- **Household Status Strip**: Multi-device synchronization state, active home mode, and network health.

### 2. 💳 Finance & Wealth Command Center
- **Transaction Engine**: Real-time income and expense tracking with category-aware indexing and multi-account support.
- **Interactive Period Filters**: Switch effortlessly between weekly, monthly, quarterly, yearly, and custom reporting intervals.
- **Visual Analytics**: Interactive category distribution charts, cash-flow timelines, and monthly spending velocity graphs.
- **Multi-Currency Support**: Universal formatting supporting USD (`$`), INR (`₹`), EUR (`€`), GBP (`£`), JPY (`¥`), and customizable symbols.
- **Automated SMS Parser Bridge**: Privacy-conscious cellular and bank SMS transaction parsing engine with idempotency safeguards.

### 3. ⚡ Utility Bills & Recurring Obligations
- **Bills Management**: Due-date countdowns, bill category tags (Electricity, Water, Internet, Subscriptions, Insurance), and overdue alerts.
- **One-Click Settlement**: Direct "Mark as Paid" action that reconciles ledger balances and logs payment confirmation stamps.
- **Predictive Recurring Schedules**: Automatic renewal tracking with customizable reminder thresholds (1 day, 3 days, 1 week before due).

### 4. 🛒 Smart Groceries & Pantry Inventory OS
- **Real-Time Shopping Mode**: Distraction-free, interactive mobile checklist with animated progress tracking and instant item completion.
- **Inventory Stock Categorization**: Grouped views sorted by urgency (`Urgent`, `Normal`, `Low`) and storage area (`Pantry`, `Fridge`, `Freezer`, `Household`).
- **Pantry Vision & Receipt OCR**: Computer vision ingestion interface for scanning store receipts and shelf photography into structured inventory records.
- **Zero-Food-Waste Intelligence**: Smart meal and recipe suggestions prioritized around expiring inventory items.

### 5. 📋 Household Tasks & Chore Allocation
- **Collaborative Family Allocation**: Assign tasks to specific household members with priority indicators (`High`, `Medium`, `Low`).
- **Chore Tab Views**: Segregated perspectives for `Today`, `Upcoming`, `Completed`, and full household backlogs.
- **Live Sync**: Instant state updates across family devices powered by real-time WebSockets.

### 6. 👥 Family Workspace & Role Governance
- **Role-Based Access Control (RBAC)**: Fine-grained permissions separating `OWNER`, `ADMIN`, and `MEMBER` privileges.
- **Cryptographic Household Codes**: Secure household invite codes for onboarding family members without sharing account credentials.
- **Directory & Presence**: Live status badges (`Online`, `Away`, `Offline`) and responsibility matrix for transparent family coordination.

### 7. 🔒 Family Connect: Encrypted Messaging & WebRTC Calling
- **End-to-End Encrypted (E2EE) Chat**: Device-level cryptographic key exchange ensuring household conversations remain unreadable to server operators.
- **Peer-to-Peer Audio & Video Calling**: Ultra-low latency WebRTC calling with live camera/mic toggles, speaker switching, and DTLS/SRTP protection.
- **Signaling Server**: Isolated room signaling over Socket.IO with ephemeral credential support.

### 8. 🤖 Proactive AI Copilot & Natural Language Agent
- **DB-Grounded Natural Language Ingestion**: Add expenses, groceries, and tasks via plain language (e.g., *"Added $42 for organic groceries at Whole Foods"*).
- **Proactive Budget & Expiry Alerts**: Contextual notifications predicting grocery replenishment needs and identifying abnormal utility usage spikes.

### 9. ⚙️ Centralized Settings & Personalization
- **Theme Customization**: Light, Dark, and Glassmorphism design system with curated semantic tone tokens.
- **Localization**: Customizable currency, timezone, date conventions (`MM/DD/YYYY`, `DD/MM/YYYY`, `YYYY-MM-DD`), and number formats.
- **Active Session Security**: Inspect active client sessions, IP locations, and user-agent details with one-click remote session revocation.
- **Privacy Controls**: Granular toggles for AI proactive suggestions, OCR processing, and notification preferences.

---

## 🏗️ Architecture & Monorepo Structure

HomeMind AI is structured as a scalable, high-performance monorepo powered by **Turborepo** and **pnpm workspaces**:

```
homemind-ai/
├── apps/
│   ├── api/                    # Primary REST & Socket.IO backend service
│   │   ├── prisma/             # Multi-tenant PostgreSQL database schema
│   │   ├── src/controllers/    # HTTP route controllers
│   │   ├── src/modules/        # Domain engines (copilot, finance, bills, chat, calling)
│   │   ├── src/services/       # Outbox, cache, and WebSocket managers
│   │   └── src/server.ts       # Express bootstrap & HTTP/WS server
│   ├── web/                    # Vite + React 18 frontend single-page application
│   │   ├── src/components/     # Design system, layout, and shared UI components
│   │   ├── src/features/       # Domain modules (finance, groceries, tasks, household, analytics)
│   │   ├── src/stores/         # Zustand state stores (auth, settings, household)
│   │   └── src/index.css       # Tailwind CSS design system & semantic tokens
│   └── worker/                 # Asynchronous background job worker (BullMQ & Redis)
│       ├── src/processors/     # Async task, notification, and outbox processors
│       └── src/worker.ts       # Worker process entrypoint
├── packages/
│   ├── config/                 # Shared environment schemas & linting rules
│   ├── database/               # Centralized Prisma client and migration utilities
│   ├── observability/          # OpenTelemetry metrics and structured logging
│   ├── shared/                 # Common TypeScript interfaces, DTOs, and event contracts
│   └── validation/             # Zod input validation schemas
├── ai-service/                 # Optional Python FastAPI Computer Vision microservice
├── docker-compose.yml          # Local containerized orchestration (PostgreSQL + Redis)
├── pnpm-workspace.yaml         # PNPM workspace definition
├── turbo.json                  # Turborepo task pipeline caching configuration
└── README.md
```

---

## 🔒 Security & Tenant Isolation

- **Mandatory Tenant Scoping**: Every database entity belongs to a `householdId`. All queries enforce tenant isolation at both the service layer and the database access layer to prevent IDOR / BOLA vulnerabilities.
- **Token Security**: Dual-token architecture using short-lived signed JWT access tokens (RS256/HS256) and cryptographically secure refresh token rotation stored in HTTP-only/secure cookies.
- **Safe Development Defaults**: Zero real credentials or personal identifiers are committed to source control. Template configurations utilize strict validation.
- **Zero Third-Party Telemetry Leaks**: Analytical telemetry is strictly self-hosted; family data is never used to train external public models.

---

## 🛠️ Technology Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend Core** | React 18, TypeScript 5.3, Vite 5, Tailwind CSS |
| **UI & Icons** | Lucide React, Framer Motion, Recharts, Custom Semantic System |
| **State Management** | Zustand, TanStack React Query v5 |
| **Backend Core** | Node.js 20, Express, TypeScript, Socket.IO 4.7 |
| **ORM & Database** | Prisma 5.22, PostgreSQL 15 / SQLite (embedded development) |
| **Queues & Cache** | Redis 7, BullMQ, Transactional Outbox Pattern |
| **Communications** | WebRTC (P2P Audio/Video), Native WebSocket Signaling, E2EE |
| **Build & Tooling** | Turborepo, pnpm workspaces, ESLint, TypeScript Strict Mode |

---


```

---

## 📄 License

This repository is licensed under the [MIT License](LICENSE).
