create table if not exists customer_portal_messages (
  id uuid primary key default gen_random_uuid(),
  portal_project_id uuid not null references customer_portal_projects(id) on delete cascade,
  sender_role text not null check (sender_role in ('client', 'studio', 'internal')),
  sender_name text not null,
  body text not null default '',
  attachment_url text,
  attachment_name text,
  attachment_type text,
  attachment_size bigint,
  attachment_storage_bucket text,
  attachment_storage_path text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_portal_messages_project
  on customer_portal_messages(portal_project_id);

create index if not exists idx_portal_messages_created
  on customer_portal_messages(portal_project_id, created_at desc);
