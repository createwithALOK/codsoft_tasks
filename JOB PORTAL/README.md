# CareerHub

CareerHub is a Next.js recruitment-platform MVP for job seekers and recruiters. It includes searchable job listings, category filters, saved jobs, application tracking, an application form, and a recruiter demo dashboard.

## Run locally

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Without a database connection the app uses sample jobs, and saved jobs, applications, and new job posts are kept in the current browser.

Use Node.js 20.9 or newer. To use Neon, copy `.env.example` to `.env.local` only if `.env.local` does not already exist, then set `DATABASE_URL` to your private connection string. In PowerShell, use `Copy-Item .env.example .env.local`; on macOS or Linux, use `cp .env.example .env.local`.

## Connect Neon PostgreSQL

1. Create a PostgreSQL project at [Neon](https://neon.tech/) and copy its connection string.
2. If `.env.local` does not already exist, copy `.env.example` to `.env.local` and set `DATABASE_URL` to the Neon connection string. Keep the connection string private.
3. Run [`database/schema.sql`](./database/schema.sql) in the Neon SQL Editor. It creates the jobs and applications tables and inserts sample listings.
4. Restart `npm run dev`. Job listings will now come from Neon and new applications will be stored there. Use the pooled connection string for app traffic; use a direct connection for schema changes.

The jobs API is `GET /api/jobs`. Applications are submitted with `POST /api/applications`; the server validates the request, confirms the job is open, and prevents duplicate applications from the same email address.

## Important before real deployment

- Recruiter-created jobs and saved jobs are stored in browser `localStorage` only; the job-posting flow is a demo and does not write to Neon.
- Applications in demo mode are stored in the current browser. With Neon configured, anyone can submit an application to the public API; records are persisted in PostgreSQL.
- Resume uploads are not yet sent to cloud storage. The application stores the selected resume's filename only. Connect a provider such as Cloudinary or S3 before collecting real resumes.
- This project does not yet include login, rate limiting, role-based access, or recruiter-side applicant management. The recruiter dashboard is demo-only. Add authentication, authorization, abuse protection, and real file storage before using it with real candidates or deploying it as a production service. Public GitHub visibility does not make the demo safe for handling real applicant data.

## Scripts

- `npm run dev` — start the local development server.
- `npm run lint` — lint the project.
- `npm run build` — create a production build.
- `npm audit --audit-level=high` — audit all dependencies.

## License

This project is licensed under the MIT License. See [`LICENSE`](./LICENSE).
