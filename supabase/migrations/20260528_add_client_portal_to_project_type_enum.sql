-- Migration: 20260528_add_client_portal_to_project_type_enum.sql
--
-- Adds 'client_portal' to project_type_enum so the rewired
-- /portal-intake form (now sending projectType: "client_portal"
-- instead of the old "web_app" + projectSubType: "portal" workaround)
-- can persist quotes. Without this value the submit-estimate API
-- fails with: invalid input value for enum project_type_enum:
-- "client_portal".
--
-- Mirrors the 20260512_add_ai_integration_to_project_type_enum
-- pattern. Additive + idempotent — safe to re-run.

alter type project_type_enum add value if not exists 'client_portal';
