ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'session', 'resource', 'friend_request', 'group_recommendation',
    'group', 'course', 'course_announcement', 'course_assignment',
    'course_discussion', 'course_resource', 'private_message'
  ));
