# ADR 0001: Adoption of Monorepo Modular Architecture via Turborepo and pnpm

**Date:** October 2026  
**Status:** Accepted  
**Deciders:** HomeMind Architecture & Engineering Leadership  
**Consulted:** SRE, Mobile Engineering, Backend Engineering  

---

## 1. Context & Problem Statement

HomeMind AI began as a multi-folder repository with loosely coupled `frontend/` (React SPA + Capacitor 7), `backend/` (Express API monolith), and `ai-service/` (Python FastAPI). As the product added features—such as automated bank/UPI SMS detection, receipt OCR, appliance lifecycle tracking, and recurring bill sweeps—several architectural friction points emerged:

1. **Type & Schema Drift:** Domain models, API request contracts, and Zod validation schemas were being duplicated across frontend and backend directories, introducing silent runtime serialization bugs.
2. **Coupled Workloads:** Asynchronous background tasks (SMS parsing, OCR processing, bill notification sweeps) competed for CPU and event-loop time directly within the Express API server process.
3. **Inconsistent Tooling & CI Lag:** Lack of unified build pipelines resulted in fragmented test runners, duplicate dependency installations, and missing cache reuse across local dev and GitHub Actions.

The engineering team required a cohesive architectural structure that enforces code sharing, decouples real-time API traffic from background workloads, and enables atomic commits across client, server, and worker layers.

---

## 2. Decision

We will migrate HomeMind to an **Enterprise Monorepo Architecture** orchestrated by **Turborepo** and **pnpm workspaces**:

```
HomeMind/
├── apps/
│   ├── web/        (React 18 + Vite SPA & Android Capacitor)
│   ├── api/        (Express REST & WebSocket Gateway)
│   └── worker/     (BullMQ Asynchronous Job Processor)
├── packages/
│   ├── shared/     (DTOs, lexers, interfaces, utilities)
│   ├── database/   (Prisma ORM schema, client, migrations, tenant extensions)
│   ├── config/     (Environment schemas, constants)
│   ├── validation/ (Shared Zod validation schemas)
│   └── observability/ (OpenTelemetry, Winston, Prometheus metrics)
└── infra/          (Docker, Kubernetes, Terraform)
```

---

## 3. Decision Drivers

- **Single Source of Truth:** Centralized `@homemind/validation` and `@homemind/shared` packages guarantee that frontend forms and backend API route validators evaluate the exact same schema definitions.
- **Computation Offloading:** Dedicated `apps/worker` ensures that bursty SMS parsing and vision OCR tasks run independently on isolated compute nodes, safeguarding API p99 latency.
- **Fast Deterministic Builds:** pnpm's content-addressable storage saves disk space and eliminates phantom dependencies; Turborepo provides smart dependency graphing and remote build caching.
- **Mobile Integration Continuity:** The Capacitor 7 Android app remains localized inside `apps/web/android`, inheriting compiled web assets seamlessly without disruption.

---

## 4. Alternatives Considered

| Alternative | Evaluation | Verdict |
| :--- | :--- | :--- |
| **Polyrepo (Separate Git Repos)** | Breaks atomic cross-service PRs; requires publishing private npm packages on every schema change; high overhead for a lean engineering team. | **Rejected** |
| **Nx Monorepo** | Powerful but heavy generator overhead and proprietary configuration paradigms with a steeper learning curve for the team. | **Rejected** |
| **npm / yarn v1 Workspaces** | Slow install times, non-deterministic hoisting bugs, lack of native pipeline caching. | **Rejected** |
| **Turborepo + pnpm Workspaces** | Lightweight, zero-config JSON pipeline (`turbo.json`), ultra-fast strict symlinking, native TypeScript composite project support. | **Selected** |

---

## 5. Consequences

### Positive Consequences
- **Zero Schema Desynchronization:** API endpoints and client hooks share compile-time TypeScript types.
- **Independent Autoscaling:** `apps/api` scales on HTTP latency/QPS; `apps/worker` scales on BullMQ queue depth.
- **Continuous Integration Speedup:** Turborepo skips unchanged packages, cutting CI build times by over 60%.
- **Cleaner Boundary Enforcement:** Prevents accidental leakage of backend database models into client bundles.

### Negative Consequences / Trade-offs
- **Initial Migration Overhead:** Requires refactoring imports and establishing TypeScript path aliases (`@homemind/*`).
- **Build Pipeline Learning Curve:** Developers must understand pnpm workspace protocols (`workspace:*`) and monorepo script execution.
- **Deployment Coordination:** Requires multi-stage Dockerfiles optimized for monorepo sparse caching (`turbo prune`).

---

## 6. Implementation Notes
- Migration will be conducted non-destructively in accordance with [ROADMAP.md](../ROADMAP.md).
- Production containers will use `turbo prune --scope=<app-name> --docker` to produce lean deployment images.
