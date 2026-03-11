-- Phase 1 ecommerce vertical schema
create table if not exists public.ecom_intakes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  auth_user_id uuid references auth.users(id) on delete set null,
  business_name text,
  contact_name text,
  email text,
  phone text,
  store_url text,
  sales_channels text[] not null default '{}',
  service_types text[] not null default '{}',
  sku_count text,
  units_in_stock text,
  product_size text,
  fragile text,
  storage_type text,
  monthly_orders text,
  peak_orders text,
  avg_items_per_order text,
  monthly_returns text,
  readiness_stage text,
  budget_range text,
  timeline text,
  decision_maker text,
  notes text,
  status text not null default 'new'
);

create table if not exists public.ecom_quotes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  ecom_intake_id uuid not null references public.ecom_intakes(id) on delete cascade,
  estimate_setup_fee numeric,
  estimate_monthly_fee numeric,
  estimate_fulfillment_model text,
  quote_json jsonb not null default '{}'::jsonb,
  status text not null default 'draft'
);

create table if not exists public.ecom_call_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  ecom_intake_id uuid not null references public.ecom_intakes(id) on delete cascade,
  best_time text,
  preferred_times text,
  timezone text,
  notes text,
  status text not null default 'new'
);

create table if not exists public.ecom_projects (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  ecom_quote_id uuid not null references public.ecom_quotes(id) on delete cascade,
  client_status text,
  service_plan text,
  project_notes text,
  status text not null default 'new'
);
