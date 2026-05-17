-- Add a btree index on proposals.portal_project_id for FK join performance.
-- The base table (proposals) was created in 20260503_phase3_proposals_agreements.sql
-- with the FK constraint but no covering index, while the sibling agreements
-- and proposal_versions tables both got CREATE INDEX statements. Mirror that
-- pattern so admin queries that join proposals by portal_project_id can use
-- the index instead of a sequential scan.
--
-- CONCURRENTLY would be safer for production reads, but Supabase wraps each
-- migration file in a transaction (which CONCURRENTLY cannot run inside), so
-- we use a plain CREATE INDEX. The table is small in practice and the lock
-- duration is negligible.
create index if not exists proposals_portal_project_id_idx
  on public.proposals (portal_project_id);
