-- Add instructors table to store instructor-specific profile data
CREATE TABLE IF NOT EXISTS instructors (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  department VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_instructors_department ON instructors(department);
