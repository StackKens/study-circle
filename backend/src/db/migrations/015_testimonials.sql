CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  university VARCHAR(255) NOT NULL,
  course VARCHAR(255) NOT NULL,
  year_of_study INTEGER CHECK (year_of_study BETWEEN 1 AND 6),
  quote TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  avatar_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (name, quote)
);

ALTER TABLE testimonials
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_testimonials_user_id
  ON testimonials(user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_testimonials_active_order
  ON testimonials(is_active, display_order, created_at DESC);

-- Retire the earlier dummy portrait seed if it was already run.
UPDATE testimonials
SET is_active = FALSE
WHERE user_id IS NULL
  AND avatar_url LIKE 'https://randomuser.me/%';

WITH ranked_users AS (
  SELECT
    id,
    name,
    university,
    course,
    year_of_study,
    avatar_url,
    ROW_NUMBER() OVER (ORDER BY created_at DESC, id) AS rn
  FROM users
  WHERE avatar_url IS NOT NULL
    AND TRIM(avatar_url) <> ''
  ORDER BY created_at DESC, id
  LIMIT 5
)
INSERT INTO testimonials (
  user_id,
  name,
  university,
  course,
  year_of_study,
  quote,
  rating,
  avatar_url,
  display_order
)
SELECT
  id,
  name,
  university,
  course,
  year_of_study,
  CASE rn
    WHEN 1 THEN 'StudyCircle helped me find classmates who were serious about revision. Our sessions became consistent, and I finally stopped studying alone.'
    WHEN 2 THEN 'The group resources saved me so much time. I could catch up on missed topics and join focused discussions before tests.'
    WHEN 3 THEN 'I like how easy it is to organize a study group and schedule sessions. It made accountability feel natural instead of forced.'
    WHEN 4 THEN 'Finding people in my course changed everything. We share notes, explain hard concepts, and keep each other ready for practicals.'
    ELSE 'StudyCircle made group work easier to manage. We plan sessions, share materials, and everyone knows what to revise before we meet.'
  END,
  5,
  avatar_url,
  rn
FROM ranked_users
ON CONFLICT (user_id) WHERE user_id IS NOT NULL DO UPDATE SET
  name = EXCLUDED.name,
  university = EXCLUDED.university,
  course = EXCLUDED.course,
  year_of_study = EXCLUDED.year_of_study,
  quote = EXCLUDED.quote,
  rating = EXCLUDED.rating,
  avatar_url = EXCLUDED.avatar_url,
  display_order = EXCLUDED.display_order,
  is_active = TRUE;
