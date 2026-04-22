create table if not exists project_activity (
  id uuid primary key default gen_random_uuid(),
  portal_project_id uuid not null references customer_portal_projects(id) on delete cascade,
  actor_role text not null check (actor_role in ('client', 'studio', 'system')),
  event_type text not null,
  summary text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_project_activity_project_created
  on project_activity(portal_project_id, created_at desc);

create index if not exists idx_project_activity_event
  on project_activity(event_type, created_at desc);

create table if not exists nudge_log (
  id uuid primary key default gen_random_uuid(),
  portal_project_id uuid not null references customer_portal_projects(id) on delete cascade,
  rule_id text not null,
  context_key text not null default '',
  payload jsonb not null default '{}'::jsonb,
  sent_at timestamptz not null default now()
);

create unique index if not exists idx_nudge_log_unique_context
  on nudge_log(portal_project_id, rule_id, context_key);

create index if not exists idx_nudge_log_sent
  on nudge_log(sent_at desc);

alter table customer_portal_projects
  add column if not exists last_client_seen_at timestamptz;

alter table customer_portal_projects
  add column if not exists preview_viewed_at timestamptz;
