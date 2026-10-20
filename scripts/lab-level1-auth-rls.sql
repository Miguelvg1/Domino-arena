\set ON_ERROR_STOP on
BEGIN;
CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
CREATE TYPE member_access_status AS ENUM ('activo','pendiente','suspension_temporal','suspension_momentanea','suspension_indefinida');
CREATE TABLE members(id uuid PRIMARY KEY,auth_user_id uuid,active boolean NOT NULL,access_status member_access_status NOT NULL,deleted_at timestamptz,suspension_ends_at timestamptz);
CREATE TABLE games(id uuid PRIMARY KEY,status text NOT NULL);
CREATE TABLE score_events(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),game_id uuid REFERENCES games,points integer NOT NULL,created_by uuid);
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_events ENABLE ROW LEVEL SECURITY;
CREATE ROLE titanes_lab_client NOLOGIN;
GRANT USAGE ON SCHEMA public,auth TO titanes_lab_client;
GRANT SELECT ON members,games TO titanes_lab_client;
GRANT SELECT,INSERT ON score_events TO titanes_lab_client;
CREATE POLICY member_own_row ON members FOR SELECT TO titanes_lab_client USING(auth_user_id=auth.uid());
CREATE POLICY active_games ON games FOR SELECT TO titanes_lab_client USING(status='activa');
CREATE POLICY score_select ON score_events FOR SELECT TO titanes_lab_client USING(EXISTS(SELECT 1 FROM members WHERE auth_user_id=auth.uid() AND active AND access_status='activo' AND deleted_at IS NULL));
CREATE POLICY score_insert ON score_events FOR INSERT TO titanes_lab_client WITH CHECK(EXISTS(SELECT 1 FROM members WHERE auth_user_id=auth.uid() AND active AND access_status='activo' AND deleted_at IS NULL));
INSERT INTO members VALUES
('11111111-1111-4111-8111-111111111111','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true,'activo',NULL,NULL),
('22222222-2222-4222-8222-222222222222','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',false,'pendiente',NULL,NULL),
('33333333-3333-4333-8333-333333333333','cccccccc-cccc-4ccc-8ccc-cccccccccccc',true,'activo',now(),NULL);
INSERT INTO games VALUES('44444444-4444-4444-8444-444444444444','activa');
SET LOCAL ROLE titanes_lab_client;
SELECT set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
INSERT INTO score_events(game_id,points,created_by) VALUES('44444444-4444-4444-8444-444444444444',25,'11111111-1111-4111-8111-111111111111');
DO $$ BEGIN
 IF (SELECT count(*) FROM score_events)<>1 THEN RAISE EXCEPTION 'Active member denied'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);
DO $$ BEGIN
 BEGIN
 INSERT INTO score_events(game_id,points,created_by) VALUES('44444444-4444-4444-8444-444444444444',30,'22222222-2222-4222-8222-222222222222');
 RAISE EXCEPTION 'PENDING MEMBER ACCEPTED';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM='PENDING MEMBER ACCEPTED' THEN RAISE; END IF;
 END;
 IF (SELECT count(*) FROM score_events)<>0 THEN RAISE EXCEPTION 'Pending member can read protected events'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','cccccccc-cccc-4ccc-8ccc-cccccccccccc',true);
DO $$ BEGIN
 BEGIN
 INSERT INTO score_events(game_id,points,created_by) VALUES('44444444-4444-4444-8444-444444444444',30,'33333333-3333-4333-8333-333333333333');
 RAISE EXCEPTION 'DELETED MEMBER ACCEPTED';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM='DELETED MEMBER ACCEPTED' THEN RAISE; END IF;
 END;
END $$;
RESET ROLE;
ROLLBACK;
SELECT 'ISOLATED AUTH/RLS TESTS PASSED' AS result;
