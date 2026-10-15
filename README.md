# CODSOFT Internship Tasks

This repository contains three independent full-stack projects completed for the CODSOFT internship tasks. Each project has its own source code, dependencies, setup instructions, and detailed README.

## Projects

| Project | Description | Technologies |
| --- | --- | --- |
| [CareerHub](./JOB%20PORTAL/) | Recruitment platform MVP with searchable jobs, applications, saved jobs, and a recruiter demo dashboard. | Next.js, TypeScript, Neon PostgreSQL |
| [DineDesk](./RESTAURANT%20ORDERING%20PLATFORM/) | Restaurant ordering and table management platform with customer, kitchen, and admin experiences. | Next.js, TypeScript, Express, Prisma, PostgreSQL, Socket.io |
| [EduManage](./STUDENT%20MANAGEMENT%20SYSTEM/) | Student management system with role-based tools for records, classes, attendance, exams, fees, and notices. | Next.js, TypeScript, Express, Prisma, PostgreSQL |

## Repository layout

```text
CODSOFT_TASKS/
├── JOB PORTAL/
│   └── README.md
├── RESTAURANT ORDERING PLATFORM/
│   └── README.md
├── STUDENT MANAGEMENT SYSTEM/
│   └── README.md
└── README.md
```

The projects are separate applications; there is no shared root-level install or start command. Open the relevant project directory and follow its README:

- [CareerHub setup and documentation](./JOB%20PORTAL/README.md)
- [DineDesk setup and documentation](./RESTAURANT%20ORDERING%20PLATFORM/README.md)
- [EduManage setup and documentation](./STUDENT%20MANAGEMENT%20SYSTEM/README.md)

## Requirements

All projects require Node.js 20.9 or newer and npm. DineDesk and EduManage also require PostgreSQL for their backend features. CareerHub can run with sample data without a database; Neon PostgreSQL is optional.

## Security

- Do not commit `.env`, `.env.local`, database connection strings, API keys, or other secrets. Only commit the provided `.env.example` templates.
- Use local demo accounts and seed data only with disposable development databases. Never use the published demo credentials in a deployed environment.
- Review each project's README for its specific limitations and deployment guidance before using it with real users or data.

## License

Each project includes its own license file. Refer to the license in the relevant project directory.
