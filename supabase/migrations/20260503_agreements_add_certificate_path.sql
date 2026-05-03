-- Applied via Supabase MCP on 2026-05-03 as part of the Certificate of Completion feature.
-- Adds the storage path for the generated PDF certificate linked to each accepted agreement.

ALTER TABLE agreements
  ADD COLUMN IF NOT EXISTS certificate_path text;
