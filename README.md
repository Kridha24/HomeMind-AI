# HomeMind AI – Intelligent Household Operating System

<div align="center">

  ![HomeMind AI Banner](https://img.shields.io/badge/HomeMind_AI-Household_Operating_System-3b82f6?style=for-the-badge&logo=sparkles&logoColor=white)
  
  **"The AI that manages your home, predicts your needs, and simplifies everyday living."**

  [![React 19](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)](https://react.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-20-green?style=flat-square&logo=node.js)](https://nodejs.org/)
  [![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
  [![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
  [![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker)](https://www.docker.com/)

</div>

---

## 📌 Executive Overview

**HomeMind AI** is an enterprise-grade, multi-tenant Household Operating System SaaS platform powered by Artificial Intelligence. Designed like a high-end commercial SaaS application, HomeMind AI moves beyond simple expense trackers or grocery reminder apps to deliver unified household intelligence.

It orchestrates:
- 💳 **Financial Telemetry & Expense Outlays**
- ⚡ **Utility Bill Tracking & Payment Warnings**
- 🛒 **Pantry Inventory & Expiry Management**
- 📸 **Computer Vision Pantry & Receipt OCR**
- 🍲 **Zero-Food-Waste AI Recipe Recommendations**
- 📺 **Appliance Telemetry & Predictive Maintenance**
- 💊 **Prescription Tracking & Family Intake Schedules**
- 📋 **Household Task Workspace & Priority Tags**
- 👥 **Family Workspace & Permission Role Management**
- 🌿 **Sustainability Score & Carbon Footprint Telemetry (0–100 Rating)**
- 🤖 **DB-Grounded Natural Language Conversational AI Assistant**
- 📄 **Automated PDF Executive Report Exporting**

---

## 🔒 Enterprise Authentication & Data Isolation

### 1. Authentication Flows
HomeMind AI strictly enforces enterprise security and supports **only** two authentication methods:
- 🔵 **Continue with Google (Google OAuth)**: Verifies Google OAuth tokens, initializes an isolated household context, and returns JWT access & refresh token pairs.
- 🟢 **Continue with Mobile Number + 6-Digit OTP**: Verifies mobile SMS OTP codes, creates or retrieves user credentials, and attaches household context.

*(Note: Legacy email/password logins and demo credentials have been completely removed to prevent unauthorized access).*

### 2. Multi-Tenant Data Isolation & Audit Schema
- **Strict Household Scoping**: Every database table includes a mandatory `householdId` relation. All backend API controllers extract `userId` and `householdId` from the authenticated JWT token payload, preventing any cross-tenant data leaks.
- **Enterprise Audit Columns**: Every record includes `id`, `householdId`, `createdBy`, `updatedBy`, `softDelete`, `createdAt`, and `updatedAt`.

### 3. Clean Slate / Zero Demo Data Onboarding
Every new user starts with **0 Expenses, 0 Bills, 0 Groceries, 0 Appliances, 0 Medicines, and 0 Tasks**. The dashboard automatically renders an Apple-inspired onboarding wizard (*"Welcome to HomeMind AI – Let's setup your home"*) with one-click setup actions (`+ Add Expense`, `+ Add Grocery`, `+ Add Appliance`, `+ Invite Family`).

---

## 🛠️ System Architecture

```
                               ┌───────────────────────────┐
                               │ React 19 + Vite Frontend  │
                               │  Apple SaaS UI / Recharts │
                               └─────────────┬─────────────┘
                                             │ REST / Socket.IO
                                             ▼
                               ┌───────────────────────────┐
                               │  Node.js + Express API    │
                               │  TypeScript / Prisma ORM  │
                               └──────┬─────────────┬──────┘
                                      │             │
                    DB-Grounded Context │             │ PostgreSQL / SQLite
                                      ▼             ▼
                        ┌───────────────────┐ ┌───────────────────┐
                        │ Python FastAPI AI │ │  Database Engine  │
                        │ OCR / Forecasting │ │ User & Household  │
                        └───────────────────┘ └───────────────────┘
```

---

## 🚀 Detailed Features & Modules

### 1. 📊 Command Center Dashboard
- **Telemetry Cards**: Real-time monthly spend outlays, net savings rate, pending bill tickers, and expiring inventory count.
- **Visual Velocity Charts**: Interactive Recharts area graphs displaying 6-month spending velocity vs monthly ceiling caps.
- **AI Recommendation Banner**: Actionable predictive prompts generated from live household statistics.

### 2. 📸 Pantry Vision & Receipt OCR
- **Receipt OCR**: Upload paper store receipts to parse store name, purchase date, itemized prices, and line items. Auto-ingests into Expenses and Inventory.
- **Pantry Shelf Vision**: Snap photos of fridge or pantry shelves. Computer vision detects products (Milk, Bread, Yogurt, Fruits) and updates quantity levels.

### 3. 🍲 Zero-Food-Waste Recipe Recommendation Engine
- Analyzes items near expiry date to generate healthy, quick, and budget-friendly meals, preventing food waste ($12.50+ average savings per recommendation).

### 4. 📈 Predictive Utility & Financial Forecasting
- Statistical polynomial time-series algorithms forecast next month's Electricity, Gas, Water, and overall expense outlays with energy-saving tips.

### 5. 📺 Appliance Telemetry & Service Manager
- Tracks purchase dates, active warranty countdowns, technician service logs, and AI maintenance predictions.

### 6. 💊 Family Medicine & Prescription Tracker
- Manages prescription dosages, pill counts, doctor details, expiry warnings, and interactive intake completion toggles.

### 7. 🌿 Sustainability Score Dashboard (0–100 Rating)
- Calculates carbon footprint, power grid draw (kWh), water conservation (L), and food waste reduction (kg) to rate household eco-efficiency.

### 8. 🤖 DB-Grounded AI Assistant Chat
- Conversational drawer grounded on live database records. Answers questions like *"How much did I spend this month?"* or *"Which bill is due next?"* without hallucination.

### 9. 📄 Executive PDF Report Exporter
- Streams compiled PDF performance reports built with PDFKit.

---

## 📦 Directory Structure

```
├── backend/
│   ├── prisma/
│   │   └── schema.prisma         # Prisma ORM Database Schema
│   ├── src/
│   │   ├── config/               # JWT & Environment Config
│   │   ├── controllers/          # REST Controllers
│   │   ├── middleware/           # Auth & Error Middleware
│   │   ├── repositories/         # Prisma DB Repository
│   │   ├── routes/               # API Route Handlers
│   │   ├── services/             # AI Client & PDF Exporter
│   │   └── server.ts             # Express & Socket.IO Entrypoint
│   └── package.json
├── ai-service/
│   ├── app/
│   │   ├── main.py               # FastAPI App Entrypoint
│   │   └── routers/              # OCR, Forecast, Recipe, Chat Routers
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/           # Navbar, Sidebar, Drawers & Modals
│   │   ├── pages/                # 13 Application Modules & Auth Pages
│   │   ├── services/             # Axios API Client
│   │   ├── stores/               # Zustand Global Auth Store
│   │   ├── App.tsx               # Protected Routing
│   │   └── main.tsx              # React 19 Entrypoint
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## ⚙️ Local Installation & Setup

### Prerequisites
- Node.js (v18+)
- Python (v3.11+)
- Git

### 1. Backend API Setup
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```
*Backend API Server will run on `http://localhost:5001`*

### 2. Python AI Service Setup
```bash
cd ai-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
*AI Service will run on `http://localhost:8000`*

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Frontend Web App will run on `http://localhost:3000`*

---

## 🐳 Docker Compose Deployment

To launch all services (PostgreSQL, Backend API, Python AI Service, Vite Frontend) in containerized mode:

```bash
docker-compose up --build
```

---

## 📝 License

This project is open-source under the [MIT License](LICENSE).
