import { neon } from "@neondatabase/serverless";
import { connection } from "next/server";
import { sampleJobs } from "@/lib/jobs";

export async function GET() {
  await connection();

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    return Response.json({ jobs: sampleJobs, demoMode: true });
  }

  try {
    const sql = neon(connectionString);
    const jobs = await sql`
      SELECT
        id,
        title,
        company,
        location,
        work_mode AS "workMode",
        employment_type AS "employmentType",
        salary,
        category,
        level,
        logo,
        logo_tone AS "logoTone",
        to_char(posted_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "postedAt",
        description,
        tags,
        featured
      FROM jobs
      WHERE status = 'OPEN'
      ORDER BY featured DESC, posted_at DESC
      LIMIT 100
    `;

    return Response.json({ jobs, demoMode: false });
  } catch (error) {
    console.error("Failed to retrieve jobs from Neon:", error);
    return Response.json(
      { message: "Unable to load jobs from the database." },
      { status: 500 },
    );
  }
}
