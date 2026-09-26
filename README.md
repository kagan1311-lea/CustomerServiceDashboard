# Customer Service Dashboard

**Live:** [frontend](https://kagan1311-lea.github.io/CustomerServiceDashboard/) (GitHub Pages) ·
[backend](https://customer-service-dashboard-backend.onrender.com) (Render, free tier — the
first request after idle may take ~30-60s to wake up).

Phase 1 skeleton: authentication, roles, and an empty dashboard. See
[CustomerServiceDashboard.md](CustomerServiceDashboard.md) for the business
overview and [spec.md](spec.md) for the full technical specification.

## Stack

- Backend: Node.js + Express + TypeScript
- Frontend: React + TypeScript + Vite + MUI
- Data layer: Airtable (via the Airtable REST API) — see spec.md section 6.3

## Prerequisites

- Node.js 20+
- An Airtable account with access to the "Customer Service Dashboard" base,
  and a Personal Access Token (PAT) for it

## Setup

### 1. Airtable access

1. Create a Personal Access Token at
   [airtable.com/create/tokens](https://airtable.com/create/tokens) scoped to
   the "Customer Service Dashboard" base, with at least `data.records:read`.
   Add `data.records:write` too once you need `npm run seed` or anything
   from Phase 2 (inquiry create/update) — read-only is enough for Phase 1
   login and the dashboard summary.
2. Note the base ID (starts with `app...`) from the base's API docs page or
   its URL.

### 2. Backend

```bash
cd backend
cp .env.example .env
# edit .env: set AIRTABLE_API_KEY to your PAT, AIRTABLE_BASE_ID to your base
npm install
npm run dev
```

The API runs on `http://localhost:4000`. Log in with a user already present
in the Airtable "Users" table (see spec.md section 7.1 for the fields). If
your token has `data.records:write`, `npm run seed` will create a first
admin user using `SEED_ADMIN_NAME` / `SEED_ADMIN_EMAIL` /
`SEED_ADMIN_PASSWORD` from `.env` (defaults: `Admin` /
`admin@example.com` / `ChangeMe123!`) — with a read-only token it will fail.

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
  Manager, Agent), backed by an Airtable "Users" table.
- `GET /api/auth/me` for the current session.
- Airtable "Users" and "Inquiries" tables matching the data model from
  spec.md section 7; InquiryMessages/InquiryAttachments/AuditLog are
  documented but not yet created (Phase 2+).
- Protected dashboard route in the frontend with a KPI row skeleton (only
  "Total Open Inquiries" is wired to real data via the Airtable API; the
  rest arrive with reporting in Phase 3).
- GitHub Actions CI workflow that installs and builds both apps.

Inquiry CRUD, filtering, and the full reporting suite are out of scope for
this phase — see spec.md sections 9 (Phase 2/3) for what's next.
