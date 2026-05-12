-- Migration: 20260512_add_ai_integration_to_project_type_enum.sql
--
-- Adds 'ai_integration' to project_type_enum so the new AI integration
-- intake form (/build/ai-intake) can persist quotes. Without this value
-- the submission API fails with an invalid enum value error.

alter type project_type_enum add value if not exists 'ai_integration';
