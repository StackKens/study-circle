CREATE TABLE IF NOT EXISTS resource_contents (
  resource_id UUID PRIMARY KEY REFERENCES resources(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  extracted_at TIMESTAMPTZ DEFAULT NOW()
);
