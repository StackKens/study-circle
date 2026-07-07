ALTER TABLE assignment_submissions
ADD COLUMN IF NOT EXISTS strengths TEXT,
ADD COLUMN IF NOT EXISTS weaknesses TEXT;
