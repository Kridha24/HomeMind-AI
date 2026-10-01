# Phase 1: Baseline Audit & Pre-Migration Verification

**Date:** October 2026  
**Branch:** `refactor/production-foundation`  
**Base Commit:** `290e2f7` (Docs suite pushed to master)  
**Status:** Completed  

---

## 1. Existing Directory Layout

Prior to Phase 1 migration, the repository is arranged in a flat multi-directory layout:

```
homemade/
├── backend/                  # Node.js + Express + Prisma Monolith
│   ├── prisma/
│   │   ├── schema.prisma     # 30+ relational models
│   │   └── seed.ts
│   ├── src/
│   │   ├── controllers/      # Route handler logic
│   │   ├── middleware/       # Auth, rateLimiter, validator
│   │   ├── routes/           # Express router definitions
│   │   ├── services/         # Business logic, AI orchestrator, SMS parsers
│   │   ├── utils/            # Validators, helpers
│   │   └── server.ts         # Main server entrypoint (:5001)
│   └── package.json
│
├── frontend/                 # React 18 + Vite + Capacitor 7 SPA
│   ├── android/              # Native Android wrapper project
│   ├── src/
│   │   ├── components/       # Common, layout, modals, dashboard
│   │   ├── pages/            # View routes
│   │   ├── stores/           # Zustand state management
│   │   └── utils/            # i18n, helpers
│   ├── index.html
│   ├── vite.config.ts        # Port 3000, API proxy to :5001
│   └── package.json
│
├── ai-service/               # Python 3.11 + FastAPI microservice
│   ├── app/
│   └── Dockerfile
│
├── docs/                     # Comprehensive enterprise architecture docs
│   ├── architecture/
│   ├── security/
│   ├── operations/
│   └── performance/
│
├── docker-compose.yml
└── README.md
```

---

## 2. Command Inventory & Execution Status

### 2.1. Frontend (`frontend/`)

| Action | Baseline Command | Result | Notes |
| :--- | :--- | :--- | :--- |
| **Dependencies** | `npm install` | **PASS** | Dependencies present in `frontend/node_modules` |
| **Typecheck** | `tsc --noEmit` | **PASS** | Exited `0` with 0 errors |
| **Production Build** | `vite build` | **PASS** | Output in `frontend/dist/` (1.43s build time) |
| **Lint** | `eslint . --ext ts,tsx` | **FAIL (Pre-existing)** | `./node_modules/.bin/eslint` not installed in node_modules |
| **Tests** | N/A | **N/A** | No frontend test suite currently configured |

### 2.2. Backend (`backend/`)

| Action | Baseline Command | Result | Notes |
| :--- | :--- | :--- | :--- |
| **Dependencies** | `npm install` | **PASS** | Dependencies present in `backend/node_modules` |
| **Prisma Generation**| `prisma generate` | **PASS** | Generated Prisma Client v5.22.0 in 114ms |
| **Typecheck** | `tsc --noEmit` | **PASS** | Exited `0` with 0 errors |
| **Production Build** | `npm run build` | **PASS** | Compiles to `backend/dist/server.js` |
| **Lint** | N/A | **N/A** | No eslint script defined in `backend/package.json` |
| **Tests** | N/A | **N/A** | No unit/integration test files configured |

### 2.3. Database Commands

- **Prisma Client Generation:** `cd backend && npx prisma generate`
- **Schema Push / Migrations:** `cd backend && npx prisma db push` / `npx prisma migrate dev`
- **Seed Data:** `cd backend && npx ts-node prisma/seed.ts`

---

## 3. Environment & Runtime Requirements

- **Node.js:** v20.x recommended (Host runtime: v20.18.0 Darwin arm64)
- **Package Manager:** `pnpm` 12.8.1 installed globally
- **Databases:**
  - SQLite (Local standalone dev `file:./dev.db`)
  - PostgreSQL 15+ (Production / Docker Compose)
- **Port Allocations:**
  - Frontend: `http://localhost:3000`
  - Backend API: `http://localhost:5001`
  - AI Service: `http://localhost:8000`

---

## 4. Pre-Existing Failure Summary (Isolated from Migration)

1. `frontend/package.json` has `"lint": "eslint . ..."` in scripts, but `eslint` was missing from local `devDependencies` execution binary.
2. No project-level test harness existed in either `frontend` or `backend`. Integration and IDOR security tests will be authored during Phase 1.
