CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT NOT NULL,
  work_mode TEXT NOT NULL CHECK (work_mode IN ('Remote', 'Hybrid', 'On-site')),
  employment_type TEXT NOT NULL CHECK (employment_type IN ('Full-time', 'Part-time', 'Contract')),
  salary TEXT NOT NULL,
  category TEXT NOT NULL,
  level TEXT NOT NULL,
  logo TEXT NOT NULL,
  logo_tone TEXT NOT NULL CHECK (logo_tone IN ('violet', 'blue', 'orange', 'green', 'rose', 'cyan')),
  posted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  description TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED'))
);

CREATE INDEX IF NOT EXISTS jobs_open_posted_idx
  ON jobs (status, featured DESC, posted_at DESC);

CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_name TEXT NOT NULL,
  email TEXT NOT NULL,
  resume_filename TEXT NOT NULL,
  cover_letter TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'IN_REVIEW'
    CHECK (status IN ('IN_REVIEW', 'SHORTLISTED', 'REJECTED', 'HIRED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (job_id, email)
);

CREATE INDEX IF NOT EXISTS applications_job_created_idx
  ON applications (job_id, created_at DESC);

INSERT INTO jobs (
  id, title, company, location, work_mode, employment_type, salary,
  category, level, logo, logo_tone, posted_at, description, tags, featured
) VALUES
  (
    'product-designer-figma', 'Product Designer', 'Figma', 'San Francisco, CA',
    'Remote', 'Full-time', '$120k – $160k', 'Design', 'Mid-level', 'F',
    'violet', NOW() - INTERVAL '2 days',
    'Help shape the future of collaborative design. You will work closely with product and engineering to make powerful tools feel simple, thoughtful, and delightful.',
    ARRAY['Product design', 'Figma', 'Design systems'], TRUE
  ),
  (
    'frontend-engineer-linear', 'Frontend Engineer', 'Linear', 'New York, NY',
    'Hybrid', 'Full-time', '$140k – $190k', 'Engineering', 'Senior', 'L',
    'blue', NOW() - INTERVAL '1 day',
    'Build fast, focused experiences for teams that care about their craft. Partner with a small product team and ship work that makes a visible difference.',
    ARRAY['React', 'TypeScript', 'Next.js'], TRUE
  ),
  (
    'growth-marketer-notion', 'Growth Marketing Manager', 'Notion', 'Remote · US',
    'Remote', 'Full-time', '$110k – $145k', 'Marketing', 'Mid-level', 'N',
    'orange', NOW() - INTERVAL '3 days',
    'Create experiments that help more people discover a better way to work. Own campaigns from the first idea through measurement and iteration.',
    ARRAY['Growth', 'Content', 'Analytics'], FALSE
  ),
  (
    'product-manager-airbnb', 'Product Manager', 'Airbnb', 'Austin, TX',
    'Hybrid', 'Full-time', '$135k – $175k', 'Product', 'Senior', 'A',
    'rose', NOW() - INTERVAL '5 days',
    'Bring people together through products that make travel feel more human. Set a clear product direction and lead cross-functional teams from insight to impact.',
    ARRAY['Product strategy', 'Roadmaps', 'Research'], FALSE
  ),
  (
    'data-analyst-stripe', 'Data Analyst', 'Stripe', 'Remote · US',
    'Remote', 'Full-time', '$105k – $140k', 'Engineering', 'Entry-level', 'S',
    'cyan', NOW() - INTERVAL '7 days',
    'Turn complex product questions into clear, actionable insights. Work with curious teammates and help businesses around the world grow their revenue.',
    ARRAY['SQL', 'Python', 'Data'], FALSE
  ),
  (
    'brand-designer-canva', 'Brand Designer', 'Canva', 'Melbourne, AU',
    'Hybrid', 'Full-time', '$95k – $125k', 'Design', 'Mid-level', 'C',
    'green', NOW() - INTERVAL '4 days',
    'Build a brand that empowers the world to design. Collaborate with a generous creative team on stories, campaigns, and experiences seen by millions.',
    ARRAY['Brand', 'Illustration', 'Creative'], FALSE
  )
ON CONFLICT (id) DO NOTHING;
