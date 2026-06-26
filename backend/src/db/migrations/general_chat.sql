-- General (platform-wide) chat table
-- All authenticated users can read and write here — no group membership needed
CREATE TABLE IF NOT EXISTS general_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_general_messages_created
  ON general_messages(created_at DESC);
