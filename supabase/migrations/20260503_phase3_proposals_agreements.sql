-- proposals: one-per-quote lifecycle tracker
create table if not exists proposals (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null unique references quotes(id) on delete cascade,
  portal_project_id uuid references customer_portal_projects(id) on delete set null,
  status text not null default 'draft'
    check (status in ('draft','sent','viewed','accepted','declined','expired')),
  current_version_id uuid,
  sent_at timestamptz,
  viewed_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- proposal_versions: append-only body snapshots
create table if not exists proposal_versions (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references proposals(id) on delete cascade,
  version_no integer not null default 1,
  scope_summary text not null default '',
  price_target numeric,
  body_json jsonb not null default '{}'::jsonb,
  created_by text not null default 'studio',
  created_at timestamptz not null default now()
);

-- circular FK added after both tables exist
alter table proposals
  add constraint fk_proposals_current_version
  foreign key (current_version_id)
  references proposal_versions(id)
  on delete set null;

-- agreements: cryptographic audit trail for accepted agreements
create table if not exists agreements (
  id uuid primary key default gen_random_uuid(),
  portal_project_id uuid not null
    references customer_portal_projects(id) on delete cascade,
  proposal_version_id uuid references proposal_versions(id) on delete set null,
  body_text text not null default '',
  body_hash text not null default '',
  published_at timestamptz not null default now(),
  published_by text not null default 'studio',
  accepted_at timestamptz,
  accepted_by_email text,
  accepted_ip text,
  accepted_user_agent text,
  status text not null default 'published'
    check (status in ('published','accepted','declined','superseded','voided')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS: studio-only read/write (no client-facing queries in Phase 3)
alter table proposals enable row level security;
alter table proposal_versions enable row level security;
alter table agreements enable row level security;
