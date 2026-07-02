ALTER TABLE assignment_submissions
ADD COLUMN IF NOT EXISTS grade INTEGER,
ADD COLUMN IF NOT EXISTS feedback TEXT,
ADD COLUMN IF NOT EXISTS graded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS graded_by UUID REFERENCES users(id);

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'session', 'resource', 'friend_request', 'group_recommendation',
    'group', 'course', 'course_announcement', 'course_assignment',
    'course_discussion', 'course_resource', 'private_message', 'assignment_graded'
  ));
