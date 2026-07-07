-- Add privacy flag to groups
-- When TRUE: group is private — only joinable via invite link
-- When FALSE (default): group is public — anyone can browse and join
ALTER TABLE groups
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT FALSE;

-- Invite tokens for private (and public) groups
CREATE TABLE IF NOT EXISTS group_invite_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  token VARCHAR(64) NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,             -- NULL = never expires
  max_uses INTEGER,                   -- NULL = unlimited
  use_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_invite_tokens_token ON group_invite_tokens(token);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_group ON group_invite_tokens(group_id);
