import { neon } from "@neondatabase/serverless";

type ApplicationInput = {
  jobId?: unknown;
  candidateName?: unknown;
  email?: unknown;
  resumeFilename?: unknown;
  coverLetter?: unknown;
};

function isApplicationInput(value: unknown): value is ApplicationInput {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isText(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Request body must be valid JSON." }, { status: 400 });
  }

  if (!isApplicationInput(body)) {
    return Response.json({ message: "Please provide valid application details." }, { status: 400 });
  }

  const input = body;
  const email = typeof input.email === "string" ? input.email.trim() : "";

  if (
    !isText(input.jobId, 120) ||
    !isText(input.candidateName, 120) ||
    !isText(email, 254) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !isText(input.resumeFilename, 255) ||
    (typeof input.coverLetter !== "string" || input.coverLetter.length > 3000)
  ) {
    return Response.json({ message: "Please provide valid application details." }, { status: 400 });
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    return Response.json(
      {
        code: "DATABASE_NOT_CONFIGURED",
        message: "Neon is not configured yet. This application can be saved in demo mode.",
      },
      { status: 503 },
    );
  }

  try {
    const sql = neon(connectionString);
    const [job] = await sql`
      SELECT id
      FROM jobs
      WHERE id = ${input.jobId} AND status = 'OPEN'
      LIMIT 1
    `;

    if (!job) {
      return Response.json({ message: "This job is no longer available." }, { status: 404 });
    }

    const [application] = await sql`
      INSERT INTO applications (job_id, candidate_name, email, resume_filename, cover_letter)
      VALUES (
        ${input.jobId},
        ${input.candidateName.trim()},
        ${email.toLowerCase()},
        ${input.resumeFilename.trim()},
        ${input.coverLetter.trim()}
      )
      ON CONFLICT (job_id, email) DO NOTHING
      RETURNING id, status, created_at AS "createdAt"
    `;

    if (!application) {
      return Response.json({ message: "You have already applied to this role." }, { status: 409 });
    }

    return Response.json({ application }, { status: 201 });
  } catch (error) {
    console.error("Failed to save application in Neon:", error);
    return Response.json(
      { message: "Unable to save your application. Please try again." },
      { status: 500 },
    );
  }
}
