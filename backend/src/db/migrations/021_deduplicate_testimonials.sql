-- Remove duplicate testimonials: keep only the first active row per name
WITH duplicates AS (
  SELECT id,
    ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at ASC, id ASC) AS rn
  FROM testimonials
  WHERE is_active = TRUE
)
UPDATE testimonials
SET is_active = FALSE
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);
