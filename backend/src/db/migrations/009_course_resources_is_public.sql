-- Add is_public flag to course_resources
-- When true: visible to everyone in the library
-- When false (default): only visible to students enrolled in that course
ALTER TABLE course_resources
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_course_resources_public ON course_resources(is_public) WHERE is_public = TRUE;
