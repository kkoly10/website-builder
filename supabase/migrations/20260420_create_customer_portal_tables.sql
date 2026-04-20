create table if not exists customer_portal_projects (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null unique references quotes(id) on delete cascade,
  access_token text not null unique,
  project_status text not null default 'new',
  client_status text not null default 'new',
  client_updated_at timestamptz,
  client_notes text default '',
  deposit_status text not null default 'pending',
  deposit_paid_at timestamptz,
  deposit_amount_cents integer,
  deposit_checkout_url text,
  deposit_notes text,
  admin_public_note text,
  preview_url text,
  production_url text,
  preview_status text not null default 'Awaiting published preview',
  preview_updated_at timestamptz,
  preview_notes text,
  client_review_status text not null default 'Preview pending',
  agreement_status text not null default 'Not published yet',
  agreement_model text,
  agreement_published_at timestamptz,
  agreement_accepted_at timestamptz,
  agreement_text text,
  ownership_model text,
  launch_status text not null default 'Not ready',
  domain_status text not null default 'Pending',
  analytics_status text not null default 'Pending',
  forms_status text not null default 'Pending',
  seo_status text not null default 'Pending',
  handoff_status text not null default 'Pending',
  launch_notes text,
  kickoff_notes text,
  payment_reference text,
  scope_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_customer_portal_projects_quote_id
  on customer_portal_projects(quote_id);

create index if not exists idx_customer_portal_projects_access_token
  on customer_portal_projects(access_token);

create table if not exists customer_portal_milestones (
  id uuid primary key default gen_random_uuid(),
  portal_project_id uuid not null references customer_portal_projects(id) on delete cascade,
  title text not null,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  notes text,
  due_date timestamptz,
  sort_order integer not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_customer_portal_milestones_project
  on customer_portal_milestones(portal_project_id, sort_order, created_at);

create table if not exists customer_portal_assets (
  id uuid primary key default gen_random_uuid(),
  portal_project_id uuid not null references customer_portal_projects(id) on delete cascade,
  source text default 'portal_link',
  asset_type text default 'general',
  label text not null,
  asset_url text,
  notes text,
  status text not null default 'submitted' check (status in ('submitted', 'received', 'approved')),
  storage_bucket text,
  storage_path text,
  file_name text,
  mime_type text,
  file_size bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_customer_portal_assets_project
  on customer_portal_assets(portal_project_id, created_at desc);

create table if not exists customer_portal_revisions (
  id uuid primary key default gen_random_uuid(),
  portal_project_id uuid not null references customer_portal_projects(id) on delete cascade,
  request_text text not null,
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  status text not null default 'new' check (status in ('new', 'reviewed', 'scheduled', 'done')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_customer_portal_revisions_project
  on customer_portal_revisions(portal_project_id, created_at desc);
