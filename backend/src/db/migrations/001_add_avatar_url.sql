-- Run this once against your live DB
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
