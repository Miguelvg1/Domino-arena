-- Titanes Dominó: read-only verification after proposed production migration.
-- Run ONLY after the migration has been deployed and independently reviewed.
DO $$
BEGIN
 IF has_table_privilege('anon','public.members','INSERT') THEN RAISE EXCEPTION 'FAIL: anon INSERT'; END IF;
 IF has_table_privilege('anon','public.members','UPDATE') THEN RAISE EXCEPTION 'FAIL: anon UPDATE'; END IF;
 IF has_table_privilege('authenticated','public.members','DELETE') THEN RAISE EXCEPTION 'FAIL: authenticated DELETE'; END IF;
 IF has_table_privilege('authenticated','public.members','TRUNCATE') THEN RAISE EXCEPTION 'FAIL: authenticated TRUNCATE'; END IF;
 IF has_column_privilege('authenticated','public.members','role','UPDATE') THEN RAISE EXCEPTION 'FAIL: role UPDATE'; END IF;
 IF has_column_privilege('authenticated','public.members','auth_user_id','UPDATE') THEN RAISE EXCEPTION 'FAIL: owner UPDATE'; END IF;
 IF has_column_privilege('authenticated','public.members','access_status','UPDATE') THEN RAISE EXCEPTION 'FAIL: status UPDATE'; END IF;
 IF has_column_privilege('authenticated','public.members','active','UPDATE') THEN RAISE EXCEPTION 'FAIL: active UPDATE'; END IF;
 IF NOT has_table_privilege('authenticated','public.members','SELECT') THEN RAISE EXCEPTION 'FAIL: member SELECT'; END IF;
 IF NOT has_column_privilege('authenticated','public.members','full_name','UPDATE') THEN RAISE EXCEPTION 'FAIL: name UPDATE'; END IF;
 IF NOT has_column_privilege('authenticated','public.members','nickname','UPDATE') THEN RAISE EXCEPTION 'FAIL: nickname UPDATE'; END IF;
 IF NOT has_column_privilege('authenticated','public.members','phone','UPDATE') THEN RAISE EXCEPTION 'FAIL: phone UPDATE'; END IF;
 IF NOT has_column_privilege('authenticated','public.members','photo_url','UPDATE') THEN RAISE EXCEPTION 'FAIL: photo UPDATE'; END IF;
 IF NOT has_table_privilege('service_role','public.members','UPDATE') THEN RAISE EXCEPTION 'FAIL: service_role UPDATE'; END IF;
 RAISE NOTICE 'PASS: expected member privileges';
END $$;
