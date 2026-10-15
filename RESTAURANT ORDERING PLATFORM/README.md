# DineDesk — Restaurant Ordering Platform

A full-stack restaurant ordering and table management system. Customers browse a digital menu, place orders, reserve tables, and track status in real time. Kitchen staff run a live order board. Admins manage the menu, tables, and reports.

## Features

- Online menu browsing with categories, search, and cart
- Checkout with Stripe Payment Element, plus a local demo checkout when Stripe keys are not set
- Table reservations with availability checks
- Real-time order tracking via Socket.io
- Kitchen Kanban dashboard (placed → confirmed → preparing → ready)
- Admin panel for menu CRUD, table status, and orders
- JWT role-based access: customer, kitchen, admin

## Tech Stack

| Layer | Stack |
| --- | --- |
| Frontend | Next.js 16, TypeScript, Tailwind CSS 4, Zustand, Stripe.js, Socket.io client |
| Backend | Node.js, Express, Prisma, PostgreSQL, Socket.io, JWT, Stripe |
| Auth | JSON Web Tokens stored in `localStorage` |

## Prerequisites

- Node.js 20.9 or newer
- PostgreSQL 14 or newer, or a Supabase PostgreSQL project
- A Stripe account is optional (the app falls back to demo payment when keys are missing)

## Local Setup

1. Open the repo root: `RESTAURANT ORDERING PLATFORM`
2. Install workspace dependencies:

```bash
npm install
```

3. Copy the environment templates and fill in values.

PowerShell:

```bash
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env.local
```

macOS/Linux:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

4. Configure the backend PostgreSQL connection strings in `backend/.env`. For Supabase, use the transaction pooler for `DATABASE_URL` and the session pooler for `DIRECT_URL`. Apply the schema:

```bash
cd backend
npx prisma generate
npx prisma db push
```

The demo seed deletes all app data before inserting its sample records. Only run it against a disposable local/demo database:

PowerShell:

```powershell
$env:RESET_DATABASE = "true"
node src/prisma/seed.js
```

macOS/Linux:

```bash
RESET_DATABASE=true node src/prisma/seed.js
```

5. From the repo root, start both apps:

```bash
npm run dev
```

- API: http://localhost:4000 (`GET /api/health`)
- App: http://localhost:3000

## Local Demo Credentials

These accounts are created only by the destructive demo seed. Do not use these credentials in a deployed environment.

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@dinedesk.com | admin123 |
| Kitchen | kitchen@dinedesk.com | kitchen123 |
| Customer | customer@dinedesk.com | customer123 |

## API Reference

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/health` | No | Health check |
| POST | `/api/auth/register` | No | Register customer |
| POST | `/api/auth/login` | No | Login |
| GET | `/api/auth/me` | Yes | Current user |
| GET | `/api/menu/categories` | No | List categories |
| GET | `/api/menu/items` | No | List / filter items |
| GET | `/api/menu/items/:id` | No | Item detail |
| POST | `/api/menu/categories` | Admin | Create category |
| POST | `/api/menu/items` | Admin | Create item |
| PUT | `/api/menu/items/:id` | Admin | Update item |
| DELETE | `/api/menu/items/:id` | Admin | Soft-delete item |
| GET | `/api/tables` | Yes | List tables |
| PUT | `/api/tables/:id/status` | Admin | Update table status |
| POST | `/api/reservations` | Customer | Create reservation |
| GET | `/api/reservations` | Yes | List reservations |
| PUT | `/api/reservations/:id` | Yes | Confirm / cancel |
| POST | `/api/orders` | Yes | Place order |
| GET | `/api/orders` | Yes | List orders |
| GET | `/api/orders/:id` | Yes | Order detail |
| PUT | `/api/orders/:id/status` | Kitchen / Admin | Update order status |
| POST | `/api/payments/create-intent` | Customer | Stripe PaymentIntent |
| POST | `/api/payments/demo-complete` | Customer | Demo pay (no Stripe keys) |
| POST | `/api/payments/webhook` | Stripe | Payment webhook |
| GET | `/api/kitchen/orders` | Kitchen / Admin | Active kitchen queue |
| PUT | `/api/kitchen/orders/:id/status` | Kitchen / Admin | Kitchen status update |

## Project Structure

```
backend/
  src/
    controllers/
    middleware/
    prisma/          # schema.prisma + seed.js
    routes/
    index.js         # Express + Socket.io
frontend/
  app/               # Next.js App Router pages
  components/
  lib/               # api, auth, utils
  store/             # Zustand cart
  types/
```

## Environment Variables

**Backend (`backend/.env`)**

- `DATABASE_URL` — PostgreSQL runtime connection string (Supabase transaction pooler)
- `DIRECT_URL` — PostgreSQL direct connection string for Prisma schema operations (Supabase session pooler)
- `JWT_SECRET` — secret used to sign auth tokens; use a strong, unique value in production
- `PORT` — API port (default `4000`)
- `FRONTEND_URL` — CORS origin for the Next.js app
- `STRIPE_SECRET_KEY` — optional Stripe secret
- `STRIPE_WEBHOOK_SECRET` — optional Stripe webhook secret

**Frontend (`frontend/.env.local`)**

- `NEXT_PUBLIC_API_URL` — backend origin, e.g. `http://localhost:4000`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — optional Stripe publishable key
