# EduManage — Student Management System

EduManage is a full-stack student management application built with Next.js, Express, PostgreSQL, and Prisma. It includes role-based dashboards and tools for student records, classes, attendance, exams, fees, and notices.

## Tech stack

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- Backend: Node.js, Express
- Database: PostgreSQL, Prisma
- Authentication: JWT and bcrypt

## Requirements

- Node.js 20.9 or later
- npm
- PostgreSQL

## Local setup

1. Install dependencies:

   ```bash
   npm run install:all
   ```

2. Copy `backend/.env.example` to `backend/.env`. Set `DATABASE_URL` and `DIRECT_URL` to your PostgreSQL connection string. For a local database, these can be the same value.

3. Generate a strong JWT secret (at least 32 characters) and set it as `JWT_SECRET` in `backend/.env`. For example:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

4. In `frontend/.env.local`, set the API base URL:

   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

5. Apply the Prisma schema and optionally seed local demo data:

   ```bash
   npm run db:push
   npm run db:seed
   ```

   Demo seeding is disabled when `NODE_ENV=production`. The seed creates accounts with published demo passwords, so use it only with a disposable local database; never seed a production or shared database.

6. Start the backend and frontend in separate terminals:

   ```bash
   npm run dev:backend
   npm run dev:frontend
   ```

   The API runs at `http://localhost:5000`; the frontend runs at `http://localhost:3000`.

### Local demo accounts

These accounts are created only by the optional local seed:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@edumanage.com` | `Admin@123` |
| Teacher | `john.smith@edumanage.com` | `Teacher@123` |
| Student | `alice@student.com` | `Student@123` |

Do not use these credentials outside a disposable local demo database.

## Available scripts

Run scripts from the repository root unless noted:

| Command | Description |
| --- | --- |
| `npm run install:all` | Install backend and frontend dependencies |
| `npm run build` | Build the frontend for production |
| `npm test` | Run backend regression tests |
| `npm --prefix frontend run lint` | Lint the frontend TypeScript source |
| `npm run dev:backend` | Start the API in development mode |
| `npm run dev:frontend` | Start the Next.js development server |
| `npm run db:push` | Apply the Prisma schema to the configured database |
| `npm run db:seed` | Seed local demo data (never use in production) |
| `npm run db:studio` | Open Prisma Studio |

The backend requires a configured PostgreSQL database and a strong `JWT_SECRET` before it starts. Configure `FRONTEND_URL` to the exact frontend origin when running the API outside local development.

## Security and deployment notes

- Public self-registration always creates a student account; the requested role is never accepted from the client.
- Authentication endpoints validate email and password input. New passwords must be at least 12 characters and no more than 72 UTF-8 bytes (the bcrypt limit).
- Keep `.env` files and credentials private. Only `.env.example` belongs in the public repository.
- Use unique production database credentials and a newly generated JWT secret. Never use demo seed accounts or publish real student, staff, or payment data.
- Set `NODE_ENV=production`, `FRONTEND_URL`, `DATABASE_URL`, `DIRECT_URL`, and `JWT_SECRET` in the deployment platform's secret/environment settings.
- Run database migrations through a reviewed deployment process. Do not run `prisma db push` against a production database without reviewing the schema changes and backup plan.
- A successful frontend build is not a substitute for testing the API against a non-production database and reviewing the hosting, backups, TLS, monitoring, and recovery configuration.

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE).

## Project structure

```text
backend/
  prisma/       Prisma schema and local demo seed
  src/
    controllers/
    middleware/
    routes/
    utils/
frontend/
  src/
    app/
    components/
    hooks/
    lib/
```
