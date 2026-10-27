-- Candidate migration for Titanes Dominó; review and stage-test before production.
-- Restrict direct API roles while preserving service_role and owner privileges.
BEGIN;
REVOKE ALL PRIVILEGES ON TABLE public.members FROM anon, authenticated;
-- Public member directory is currently readable by RLS-authorized users.
GRANT SELECT ON TABLE public.members TO authenticated;
-- Existing update_my_profile() is SECURITY INVOKER and needs these column grants.
GRANT UPDATE (full_name, nickname, phone, photo_url) ON TABLE public.members TO authenticated;
-- Intentionally do not grant INSERT: existing signup and approval use privileged service paths.
-- Review any auth triggers that execute as INVOKER before deployment.
COMMIT;

-- Post-deployment verification (read-only):
-- SELECT grantee, privilege_type FROM information_schema.role_table_grants
-- WHERE table_schema='public' AND table_name='members'
-- AND grantee IN ('anon','authenticated','service_role');
-- SELECT grantee, privilege_type, column_name
-- FROM information_schema.column_privileges
-- WHERE table_schema='public' AND table_name='members'
-- AND grantee='authenticated' AND privilege_type='UPDATE';
