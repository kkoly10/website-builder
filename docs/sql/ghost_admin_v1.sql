-- Ghost Admin v1 migration
-- Internal intelligence layer tables (no client-facing usage)

create table if not exists public.ghost_sessions (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid null,
  lane text not null check (lane in ('website','ops','ecommerce','global')),
  project_id text null,
  session_label text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ghost_project_snapshots (
  id uuid primary key default gen_random_uuid(),
  session_id uuid null references public.ghost_sessions(id) on delete set null,
  lane text not null check (lane in ('website','ops','ecommerce')),
  project_id text not null,
  phase text not null,
  status text not null,
  health_state text not null check (health_state in ('healthy','watch','at-risk')),
  waiting_on text not null,
  next_action_title text not null,
  risk_flags jsonb not null default '[]'::jsonb,
  latest_activity_summary text not null,
  source_facts jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ghost_message_analysis (
  id uuid primary key default gen_random_uuid(),
  session_id uuid null references public.ghost_sessions(id) on delete set null,
  lane text not null check (lane in ('website','ops','ecommerce','global')),
  project_id text null,
  source_message_text text not null,
  category_label text not null,
  sentiment_label text not null,
  urgency_label text not null,
  risk_label text not null,
  what_client_is_really_asking text not null,
  coaching_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ghost_reply_suggestions (
  id uuid primary key default gen_random_uuid(),
  message_analysis_id uuid null references public.ghost_message_analysis(id) on delete set null,
  default_reply text not null,
  variants_json jsonb not null default '{}'::jsonb,
  why_this_works text not null,
  caution_text text not null,
  next_action_text text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.ghost_guardrail_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid null references public.ghost_sessions(id) on delete set null,
  lane text not null check (lane in ('website','ops','ecommerce','global')),
  project_id text null,
  event_type text not null,
  severity text not null check (severity in ('low','medium','high')),
  event_text text not null,
  event_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ghost_project_snapshots_lane_project_idx
  on public.ghost_project_snapshots(lane, project_id, created_at desc);

create index if not exists ghost_message_analysis_lane_project_idx
  on public.ghost_message_analysis(lane, project_id, created_at desc);

create index if not exists ghost_guardrail_events_lane_project_idx
  on public.ghost_guardrail_events(lane, project_id, created_at desc);
