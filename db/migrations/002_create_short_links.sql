CREATE TABLE IF NOT EXISTS short_links (
  id BIGSERIAL PRIMARY KEY,
  short_code VARCHAR(255) NOT NULL UNIQUE,
  original_url TEXT NOT NULL,
  owner_id BIGINT NULL REFERENCES users (id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS short_links_short_code_idx ON short_links (short_code);
