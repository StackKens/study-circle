-- Reply likes for course discussion replies
CREATE TABLE IF NOT EXISTS course_discussion_reply_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reply_id UUID NOT NULL REFERENCES course_discussion_replies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(reply_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reply_likes_reply ON course_discussion_reply_likes(reply_id);
