\set ON_ERROR_STOP on
BEGIN;
CREATE TYPE team_side AS ENUM ('L','C');
CREATE TYPE score_event_type AS ENUM ('normal','multa','capicua','paso_corrido','chivo','pase_con_ficha','paso_salida_doble','dos_carotas');
CREATE TYPE game_status AS ENUM ('preparando','activa','finalizada','anulada');
CREATE TABLE members(id uuid PRIMARY KEY,full_name text NOT NULL);
CREATE TABLE games(id uuid PRIMARY KEY,status game_status NOT NULL,largos_score integer NOT NULL,cortos_score integer NOT NULL,winner team_side);
CREATE TABLE game_players(id uuid PRIMARY KEY,game_id uuid NOT NULL REFERENCES games(id),member_id uuid NOT NULL REFERENCES members(id),team team_side NOT NULL,seat smallint NOT NULL);
CREATE TABLE score_events(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),game_id uuid NOT NULL REFERENCES games(id),team team_side NOT NULL,event_type score_event_type NOT NULL,points integer NOT NULL,credited_member_id uuid NOT NULL REFERENCES members(id),responsible_member_id uuid REFERENCES members(id),voided boolean NOT NULL DEFAULT false);
-- Test-only contract-compatible function, NOT a copy of production's implementation.
CREATE FUNCTION add_score_event(p_game_id uuid,p_team team_side,p_event_type score_event_type,p_points integer DEFAULT NULL,p_responsible_member_id uuid DEFAULT NULL,p_credited_member_id uuid DEFAULT NULL) RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE g games%ROWTYPE; new_id uuid; current_score integer;
BEGIN
 IF p_points IS NULL OR p_points NOT BETWEEN 1 AND 250 THEN RAISE EXCEPTION 'Invalid points'; END IF;
 SELECT * INTO g FROM games WHERE id=p_game_id FOR UPDATE;
 IF NOT FOUND OR g.status<>'activa' THEN RAISE EXCEPTION 'Game not active'; END IF;
 IF NOT EXISTS (SELECT 1 FROM game_players WHERE game_id=p_game_id AND member_id=p_credited_member_id AND team=p_team) THEN RAISE EXCEPTION 'Wrong team or player'; END IF;
 IF p_event_type IN ('multa','chivo','pase_con_ficha') AND p_responsible_member_id IS NULL THEN RAISE EXCEPTION 'Missing responsible'; END IF;
 IF p_responsible_member_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM game_players WHERE game_id=p_game_id AND member_id=p_responsible_member_id AND team<>p_team) THEN RAISE EXCEPTION 'Invalid responsible'; END IF;
 INSERT INTO score_events(game_id,team,event_type,points,credited_member_id,responsible_member_id) VALUES(p_game_id,p_team,p_event_type,p_points,p_credited_member_id,p_responsible_member_id) RETURNING id INTO new_id;
 current_score:=CASE WHEN p_team='L' THEN g.largos_score ELSE g.cortos_score END+p_points;
 UPDATE games SET largos_score=largos_score+CASE WHEN p_team='L' THEN p_points ELSE 0 END,cortos_score=cortos_score+CASE WHEN p_team='C' THEN p_points ELSE 0 END,status=CASE WHEN current_score>=200 THEN 'finalizada'::game_status ELSE 'activa'::game_status END,winner=CASE WHEN current_score>=200 THEN p_team ELSE NULL END WHERE id=p_game_id;
 RETURN new_id;
END $$;
INSERT INTO members VALUES('11111111-1111-4111-8111-111111111111','Juan'),('22222222-2222-4222-8222-222222222222','Carlos');
INSERT INTO games VALUES('33333333-3333-4333-8333-333333333333','activa',185,130,NULL),('44444444-4444-4444-8444-444444444444','activa',190,150,NULL);
INSERT INTO game_players VALUES('55555555-5555-4555-8555-555555555555','33333333-3333-4333-8333-333333333333','11111111-1111-4111-8111-111111111111','L',1),('66666666-6666-4666-8666-666666666666','33333333-3333-4333-8333-333333333333','22222222-2222-4222-8222-222222222222','C',2),('77777777-7777-4777-8777-777777777777','44444444-4444-4444-8444-444444444444','11111111-1111-4111-8111-111111111111','L',1),('88888888-8888-4888-8888-888888888888','44444444-4444-4444-8444-444444444444','22222222-2222-4222-8222-222222222222','C',2);
DO $$
BEGIN
 BEGIN
 PERFORM add_score_event('33333333-3333-4333-8333-333333333333','C','normal',25,NULL,'11111111-1111-4111-8111-111111111111');
 RAISE EXCEPTION 'WRONG TEAM ACCEPTED';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM='WRONG TEAM ACCEPTED' THEN RAISE; END IF;
 END;
 IF (SELECT count(*) FROM score_events)<>0 THEN RAISE EXCEPTION 'Unexpected history'; END IF;
 PERFORM add_score_event('33333333-3333-4333-8333-333333333333','C','normal',25,NULL,'22222222-2222-4222-8222-222222222222');
 IF (SELECT (largos_score,cortos_score,status)=(185,155,'activa') FROM games WHERE id='33333333-3333-4333-8333-333333333333') IS NOT TRUE THEN RAISE EXCEPTION 'Incorrect corrected score'; END IF;
 IF (SELECT count(*) FROM score_events WHERE game_id='33333333-3333-4333-8333-333333333333')<>1 THEN RAISE EXCEPTION 'Duplicate event'; END IF;
 PERFORM add_score_event('44444444-4444-4444-8444-444444444444','L','normal',15,NULL,'11111111-1111-4111-8111-111111111111');
 IF (SELECT (largos_score,status,winner)=(205,'finalizada','L') FROM games WHERE id='44444444-4444-4444-8444-444444444444') IS NOT TRUE THEN RAISE EXCEPTION 'Victory not registered'; END IF;
 BEGIN
 PERFORM add_score_event('44444444-4444-4444-8444-444444444444','L','normal',5,NULL,'11111111-1111-4111-8111-111111111111');
 RAISE EXCEPTION 'POST VICTORY ACCEPTED';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM='POST VICTORY ACCEPTED' THEN RAISE; END IF;
 END;
 IF (SELECT count(*) FROM score_events WHERE game_id='44444444-4444-4444-8444-444444444444')<>1 THEN RAISE EXCEPTION 'History changed after victory'; END IF;
END $$;
ROLLBACK;
SELECT 'CONTRACT SHAPE ISOLATED CHECKS PASSED' AS result;
