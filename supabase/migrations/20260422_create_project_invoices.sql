create table if not exists project_invoices (
  id uuid primary key default gen_random_uuid(),
  portal_project_id uuid not null references customer_portal_projects(id) on delete cascade,
  invoice_type text not null check (invoice_type in ('deposit', 'milestone', 'final', 'retainer')),
  amount numeric not null,
  currency text not null default 'usd',
  status text not null default 'draft' check (status in ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  stripe_session_id text,
  stripe_payment_url text,
  due_date timestamptz,
  paid_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_project_invoices_portal_project
  on project_invoices(portal_project_id, created_at desc);

create index if not exists idx_project_invoices_status
  on project_invoices(status, due_date);

create index if not exists idx_project_invoices_session
  on project_invoices(stripe_session_id);
