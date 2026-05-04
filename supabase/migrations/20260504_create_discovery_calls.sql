CREATE TABLE IF NOT EXISTS discovery_calls (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id           uuid        REFERENCES leads(id) ON DELETE SET NULL,
  lead_email        text        NOT NULL,
  lead_name         text,
  company           text,
  project_type      text,
  availability_note text,
  status            text        NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  preferred_locale  text        NOT NULL DEFAULT 'en',
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON discovery_calls (lead_id);
CREATE INDEX ON discovery_calls (lead_email);
CREATE INDEX ON discovery_calls (created_at DESC);

ALTER TABLE discovery_calls ENABLE ROW LEVEL SECURITY;
