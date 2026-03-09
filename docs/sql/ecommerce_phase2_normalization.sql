-- Phase 2 hardening: numeric normalization + indexes for SLA/aging dashboards

alter table if exists public.ecom_intakes
  add column if not exists sku_count_num integer,
  add column if not exists units_in_stock_num integer,
  add column if not exists monthly_orders_num integer,
  add column if not exists peak_orders_num integer,
  add column if not exists avg_items_per_order_num numeric,
  add column if not exists monthly_returns_num integer;

update public.ecom_intakes
set
  sku_count_num = nullif(regexp_replace(coalesce(sku_count, ''), '[^0-9]', '', 'g'), '')::integer,
  units_in_stock_num = nullif(regexp_replace(coalesce(units_in_stock, ''), '[^0-9]', '', 'g'), '')::integer,
  monthly_orders_num = nullif(regexp_replace(coalesce(monthly_orders, ''), '[^0-9]', '', 'g'), '')::integer,
  peak_orders_num = nullif(regexp_replace(coalesce(peak_orders, ''), '[^0-9]', '', 'g'), '')::integer,
  avg_items_per_order_num = nullif(regexp_replace(coalesce(avg_items_per_order, ''), '[^0-9\.]', '', 'g'), '')::numeric,
  monthly_returns_num = nullif(regexp_replace(coalesce(monthly_returns, ''), '[^0-9]', '', 'g'), '')::integer
where true;

create index if not exists ecom_intakes_created_status_idx on public.ecom_intakes (created_at desc, status);
create index if not exists ecom_call_requests_intake_created_idx on public.ecom_call_requests (ecom_intake_id, created_at desc);
create index if not exists ecom_quotes_intake_created_idx on public.ecom_quotes (ecom_intake_id, created_at desc);

-- Optional read model for admin SLA/aging reporting.
create or replace view public.ecom_sla_aging_view as
select
  i.id as ecom_intake_id,
  i.created_at as intake_created_at,
  i.status as intake_status,
  coalesce(c.status, 'not requested') as call_status,
  c.created_at as latest_call_created_at,
  coalesce(q.status, 'not started') as quote_status,
  q.created_at as latest_quote_created_at,
  floor(extract(epoch from now() - i.created_at) / 86400)::int as intake_age_days
from public.ecom_intakes i
left join lateral (
  select status, created_at
  from public.ecom_call_requests cr
  where cr.ecom_intake_id = i.id
  order by created_at desc
  limit 1
) c on true
left join lateral (
  select status, created_at
  from public.ecom_quotes eq
  where eq.ecom_intake_id = i.id
  order by created_at desc
  limit 1
) q on true;
