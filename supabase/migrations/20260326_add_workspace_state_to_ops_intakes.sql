alter table if exists public.ops_intakes
  add column if not exists workspace_state jsonb default '{}'::jsonb;
