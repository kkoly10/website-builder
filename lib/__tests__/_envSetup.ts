// Side-effect-only module that stubs Supabase env BEFORE any test
// file imports a lib that transitively loads lib/supabaseAdmin (which
// throws at module load if the env vars are missing). Import this
// FIRST in any test file that needs to use a lib coupled to
// supabaseAdmin.
process.env.NEXT_PUBLIC_SUPABASE_URL ||= "http://localhost:54321";
process.env.SUPABASE_SERVICE_ROLE_KEY ||= "test-service-role-key";
