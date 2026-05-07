-- Migration: 20260507_silo_intake_to_unified_portal.sql
--
-- Phase 3.8: Synthetic-quote bridge from silo intake tables
-- (ops_intakes, ecom_intakes) into the unified customer_portal_projects
-- engine. For each silo row, we create:
--   1. A lead (if one with that email doesn't exist already)
--   2. A synthetic quote row with project_type set + intake fields mapped
--      into intake_normalized
--   3. A customer_portal_projects row with seeded milestones + a
--      lane-specific direction record on scope_snapshot
--
-- Idempotent: skips silo rows whose original_id already appears in
-- quotes.debug.silo_migration.original_id. Re-running is safe.
--
-- Silo data is NOT deleted — the original ops_intakes and ecom_intakes
-- rows remain so existing /portal/ops/[id] and /portal/ecommerce/[id]
-- routes continue to work for in-flight clients. The unified portals
-- give admin a single place to manage them in the new engine.

do $$
declare
  intake record;
  lead_id_var uuid;
  quote_id_var uuid;
  portal_id_var uuid;
  ms record;
begin
  -- ─── ops_intakes → automation ──────────────────────────────────────────
  for intake in
    select * from ops_intakes order by created_at
  loop
    -- Skip rows already migrated (by original_id stamp on the quote).
    if exists (
      select 1 from quotes q
      where q.debug->'silo_migration'->>'original_id' = intake.id::text
        and q.debug->'silo_migration'->>'source' = 'ops_intake'
    ) then
      continue;
    end if;

    -- Find or create lead by email.
    select id into lead_id_var
    from leads
    where lower(email::text) = lower(intake.email)
    limit 1;

    if lead_id_var is null then
      insert into leads (email, meta, preferred_locale, created_at, last_seen_at)
      values (
        intake.email,
        jsonb_build_object('source', 'silo_migration', 'silo_table', 'ops_intakes'),
        coalesce(intake.preferred_locale, 'en'),
        intake.created_at,
        now()
      )
      returning id into lead_id_var;
    end if;

    -- Synthetic quote with all silo fields mapped into intake_normalized.
    insert into quotes (
      lead_id,
      project_type,
      status,
      intake_raw,
      intake_normalized,
      debug,
      preferred_locale,
      created_at,
      updated_at
    )
    values (
      lead_id_var,
      'automation',
      'imported_from_silo',
      to_jsonb(intake) - 'id' - 'created_at' - 'updated_at',
      jsonb_build_object(
        'companyName', intake.company_name,
        'contactName', intake.contact_name,
        'email', intake.email,
        'phone', intake.phone,
        'industry', intake.industry,
        'teamSize', intake.team_size,
        'jobVolume', intake.job_volume,
        'urgency', intake.urgency,
        'readiness', intake.readiness,
        'currentTools', intake.current_tools,
        'painPoints', intake.pain_points,
        'workflowsNeeded', intake.workflows_needed,
        'notes', intake.notes,
        'recommendationTier', intake.recommendation_tier,
        'recommendationPriceRange', intake.recommendation_price_range
      ),
      jsonb_build_object(
        'silo_migration', jsonb_build_object(
          'source', 'ops_intake',
          'original_id', intake.id::text,
          'migrated_at', now()
        )
      ),
      coalesce(intake.preferred_locale, 'en'),
      intake.created_at,
      now()
    )
    returning id into quote_id_var;

    -- Customer portal project. Mirror Phase 3.3's seeding: scope_snapshot
    -- carries the workflow_direction record + the silo migration stamp.
    insert into customer_portal_projects (
      quote_id,
      access_token,
      project_type,
      project_status,
      client_status,
      deposit_status,
      scope_snapshot,
      created_at,
      updated_at
    )
    values (
      quote_id_var,
      encode(gen_random_bytes(24), 'hex'),
      'automation',
      'imported',
      'new',
      'pending',
      jsonb_build_object(
        'silo_migration', jsonb_build_object(
          'source', 'ops_intake',
          'original_id', intake.id::text,
          'silo_url_hint', '/portal/ops/' || intake.id::text
        ),
        'direction', jsonb_build_object(
          'type', 'workflow_direction',
          'status', 'waiting_on_client',
          'payload', jsonb_build_object(
            'currentProcess', '',
            'painPoints', intake.pain_points,
            'trigger', '',
            'toolsInvolved', intake.current_tools,
            'workflowSteps', intake.workflows_needed,
            'inputs', '[]'::jsonb,
            'outputs', '[]'::jsonb,
            'approvals', '[]'::jsonb,
            'notifications', '[]'::jsonb,
            'errorCases', '[]'::jsonb,
            'successMetric', '',
            'accessNeeded', '[]'::jsonb
          ),
          'submittedAt', null,
          'reviewedAt', null,
          'approvedAt', null,
          'lockedAt', null,
          'changesRequestedAt', null,
          'adminPublicNote', null,
          'adminInternalNote', null
        )
      ),
      intake.created_at,
      now()
    )
    returning id into portal_id_var;

    -- Seed automation workflow milestones (matches Phase 3.1 template).
    insert into customer_portal_milestones (portal_project_id, title, status, sort_order, notes) values
      (portal_id_var, 'Workflow diagnosis complete',  'todo', 10, 'Owner: studio'),
      (portal_id_var, 'Automation scope approved',    'todo', 20, 'Owner: client'),
      (portal_id_var, 'Tool access confirmed',        'todo', 30, 'Owner: client'),
      (portal_id_var, 'Workflow built',               'todo', 40, 'Owner: studio'),
      (portal_id_var, 'Test run complete',            'todo', 50, 'Owner: studio'),
      (portal_id_var, 'Client approval',              'todo', 60, 'Owner: client'),
      (portal_id_var, 'Automation live',              'todo', 70, 'Owner: studio'),
      (portal_id_var, 'Handoff & documentation',      'todo', 80, 'Owner: studio');

    -- Seed automation required actions (matches AUTOMATION_WORKFLOW_TEMPLATE).
    insert into customer_portal_required_actions (
      portal_project_id, action_key, owner, title, description, status, unlocks_milestone_key
    ) values
      (portal_id_var, 'complete_workflow_direction', 'client', 'Complete Workflow Direction',
       'Describe the current manual process, tools, triggers, outputs, approvals, and success metric.',
       'waiting_on_client', 'automation_scope_approved'),
      (portal_id_var, 'provide_tool_access', 'client', 'Provide tool access',
       'Provide required logins, API access, Zapier/Make access, or test credentials.',
       'not_started', 'tool_access_confirmed'),
      (portal_id_var, 'review_test_run', 'client', 'Review test run',
       'Confirm the automation performs correctly using real or realistic test data.',
       'not_started', 'client_approval');
  end loop;

  -- ─── ecom_intakes → ecommerce ──────────────────────────────────────────
  for intake in
    select * from ecom_intakes order by created_at
  loop
    if exists (
      select 1 from quotes q
      where q.debug->'silo_migration'->>'original_id' = intake.id::text
        and q.debug->'silo_migration'->>'source' = 'ecom_intake'
    ) then
      continue;
    end if;

    -- ecom_intakes.email is nullable; skip rows without an email.
    if intake.email is null or intake.email = '' then
      continue;
    end if;

    select id into lead_id_var
    from leads
    where lower(email::text) = lower(intake.email)
    limit 1;

    if lead_id_var is null then
      insert into leads (email, meta, preferred_locale, created_at, last_seen_at)
      values (
        intake.email,
        jsonb_build_object('source', 'silo_migration', 'silo_table', 'ecom_intakes'),
        coalesce(intake.preferred_locale, 'en'),
        intake.created_at,
        now()
      )
      returning id into lead_id_var;
    end if;

    insert into quotes (
      lead_id,
      project_type,
      status,
      intake_raw,
      intake_normalized,
      debug,
      preferred_locale,
      created_at,
      updated_at
    )
    values (
      lead_id_var,
      'ecommerce',
      'imported_from_silo',
      to_jsonb(intake) - 'id' - 'created_at' - 'updated_at',
      jsonb_build_object(
        'businessName', intake.business_name,
        'contactName', intake.contact_name,
        'email', intake.email,
        'phone', intake.phone,
        'storeUrl', intake.store_url,
        'platform', intake.platform,
        'salesChannels', to_jsonb(intake.sales_channels),
        'serviceTypes', to_jsonb(intake.service_types),
        'skuCount', intake.sku_count,
        'monthlyOrders', intake.monthly_orders,
        'peakOrders', intake.peak_orders,
        'readinessStage', intake.readiness_stage,
        'budgetRange', intake.budget_range,
        'timeline', intake.timeline,
        'notes', intake.notes,
        'compliance', to_jsonb(intake.compliance)
      ),
      jsonb_build_object(
        'silo_migration', jsonb_build_object(
          'source', 'ecom_intake',
          'original_id', intake.id::text,
          'migrated_at', now()
        )
      ),
      coalesce(intake.preferred_locale, 'en'),
      intake.created_at,
      now()
    )
    returning id into quote_id_var;

    insert into customer_portal_projects (
      quote_id,
      access_token,
      project_type,
      project_status,
      client_status,
      deposit_status,
      scope_snapshot,
      created_at,
      updated_at
    )
    values (
      quote_id_var,
      encode(gen_random_bytes(24), 'hex'),
      'ecommerce',
      'imported',
      'new',
      'pending',
      jsonb_build_object(
        'silo_migration', jsonb_build_object(
          'source', 'ecom_intake',
          'original_id', intake.id::text,
          'silo_url_hint', '/portal/ecommerce/' || intake.id::text
        ),
        'direction', jsonb_build_object(
          'type', 'store_direction',
          'status', 'waiting_on_client',
          'payload', jsonb_build_object(
            'platform', coalesce(intake.platform, ''),
            'productCatalogSize', coalesce(intake.sku_count, ''),
            'productCategories', '[]'::jsonb,
            'paymentNeeds', '[]'::jsonb,
            'shippingRules', '',
            'taxRules', '',
            'inventoryWorkflow', '',
            'fulfillmentWorkflow', '',
            'policyNeeds', '[]'::jsonb,
            'conversionPriorities', '[]'::jsonb,
            'storeExamples', '[]'::jsonb
          ),
          'submittedAt', null,
          'reviewedAt', null,
          'approvedAt', null,
          'lockedAt', null,
          'changesRequestedAt', null,
          'adminPublicNote', null,
          'adminInternalNote', null
        )
      ),
      intake.created_at,
      now()
    )
    returning id into portal_id_var;

    -- Seed ecommerce workflow milestones.
    insert into customer_portal_milestones (portal_project_id, title, status, sort_order, notes) values
      (portal_id_var, 'Store scope confirmed',         'todo', 10, 'Owner: studio'),
      (portal_id_var, 'Store direction approved',      'todo', 20, 'Owner: client'),
      (portal_id_var, 'Products/assets received',      'todo', 30, 'Owner: client'),
      (portal_id_var, 'Storefront build started',      'todo', 40, 'Owner: studio'),
      (portal_id_var, 'Checkout configured',           'todo', 50, 'Owner: studio'),
      (portal_id_var, 'Shipping/tax configured',       'todo', 60, 'Owner: studio'),
      (portal_id_var, 'Test order complete',           'todo', 70, 'Owner: studio'),
      (portal_id_var, 'Launch approved',               'todo', 80, 'Owner: client'),
      (portal_id_var, 'Store live',                    'todo', 90, 'Owner: studio');

    insert into customer_portal_required_actions (
      portal_project_id, action_key, owner, title, description, status, unlocks_milestone_key
    ) values
      (portal_id_var, 'complete_store_direction', 'client', 'Complete Store Direction',
       'Confirm platform, products, checkout, shipping, tax, policies, and store goals.',
       'waiting_on_client', 'store_direction_approved'),
      (portal_id_var, 'upload_product_catalog', 'client', 'Upload product catalog',
       'Provide product names, prices, descriptions, images, categories, variants, and inventory notes.',
       'not_started', 'products_assets_received'),
      (portal_id_var, 'review_test_order', 'client', 'Review test order',
       'Confirm checkout, order email, shipping, and payment flow are correct.',
       'not_started', 'launch_approved');
  end loop;
end $$;
