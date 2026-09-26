# Customer Service Dashboard

Phase 1 skeleton: authentication, roles, and an empty dashboard. See
[CustomerServiceDashboard.md](CustomerServiceDashboard.md) for the business
overview and [spec.md](spec.md) for the full technical specification.

## Stack

- Backend: Node.js + Express + TypeScript, Prisma ORM
- Frontend: React + TypeScript + Vite + MUI
- Database: PostgreSQL

## Prerequisites

- Node.js 20+
- Docker (for local PostgreSQL) — or a PostgreSQL 16 instance you already have

## Setup

### 1. Database

```bash
docker compose up -d
```

This starts PostgreSQL on `localhost:5432` (user/password `postgres`, db
`customer_service_dashboard`).

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

The API runs on `http://localhost:4000`. The seed script creates an admin
user using `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` from `.env` (defaults:
`admin@example.com` / `ChangeMe123!`).

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs on `http://localhost:5173` and proxies `/api` to the backend.
Log in with the seeded admin credentials.

## What's implemented (Phase 1)

- Email/password login issuing a JWT, role stored on the user (Admin,
  Manager, Agent).
- `GET /api/auth/me` for the current session.
- Prisma schema for the full data model from spec.md section 7 (User,
  Inquiry, InquiryMessage, InquiryAttachment, AuditLog), ready for
  migrations.
- Protected dashboard route in the frontend with a KPI row skeleton (only
  "Total Open Inquiries" is wired to real data; the rest arrive with
  reporting in Phase 3).
- GitHub Actions CI workflow that installs and builds both apps.

Inquiry CRUD, filtering, and the full reporting suite are out of scope for
this phase — see spec.md sections 9 (Phase 2/3) for what's next.
