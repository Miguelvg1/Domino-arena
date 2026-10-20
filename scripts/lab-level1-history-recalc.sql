\set ON_ERROR_STOP on
BEGIN;
CREATE TYPE team_side AS ENUM ('L','C');
CREATE TYPE game_status AS ENUM ('activa','finalizada');
CREATE TYPE score_event_type AS ENUM ('normal','multa','capicua','paso_corrido','chivo','pase_con_ficha','paso_salida_doble','dos_carotas');
CREATE TABLE members(id uuid PRIMARY KEY, active boolean NOT NULL);
CREATE TABLE games(id uuid PRIMARY KEY,status game_status NOT NULL DEFAULT 'activa',largos_score integer NOT NULL DEFAULT 0,cortos_score integer NOT NULL DEFAULT 0,winner team_side,finished_at timestamptz);
CREATE TABLE game_players(game_id uuid NOT NULL REFERENCES games,member_id uuid NOT NULL REFERENCES members,team team_side NOT NULL,PRIMARY KEY(game_id,member_id));
CREATE TABLE score_events(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),game_id uuid NOT NULL REFERENCES games,team team_side NOT NULL,event_type score_event_type NOT NULL,points integer NOT NULL,credited_member_id uuid REFERENCES members,responsible_member_id uuid REFERENCES members,voided boolean NOT NULL DEFAULT false);
CREATE TABLE score_event_audit(score_event_id uuid REFERENCES score_events,action text NOT NULL,new_points integer);
CREATE FUNCTION expected_event_points(t score_event_type) RETURNS integer LANGUAGE sql IMMUTABLE AS $$ SELECT CASE WHEN t IN ('multa','capicua','paso_corrido','paso_salida_doble') THEN 30 WHEN t='dos_carotas' THEN 60 WHEN t IN ('chivo','pase_con_ficha') THEN 100 ELSE NULL END $$;
CREATE FUNCTION recalculate_game_score(p_game_id uuid) RETURNS void LANGUAGE plpgsql AS $$
DECLARE v_l integer;v_c integer;v_status game_status;v_winner team_side;
BEGIN
 SELECT coalesce(sum(points) FILTER (WHERE team='L' AND voided=false),0),coalesce(sum(points) FILTER (WHERE team='C' AND voided=false),0) INTO v_l,v_c FROM score_events WHERE game_id=p_game_id;
 v_status:=CASE WHEN v_l>=200 OR v_c>=200 THEN 'finalizada'::game_status ELSE 'activa'::game_status END;
 v_winner:=CASE WHEN v_l>=200 AND v_l>=v_c THEN 'L'::team_side WHEN v_c>=200 AND v_c>=v_l THEN 'C'::team_side ELSE NULL END;
 UPDATE games SET largos_score=v_l,cortos_score=v_c,status=v_status,winner=v_winner,finished_at=CASE WHEN v_status='finalizada' THEN coalesce(finished_at,now()) ELSE NULL END WHERE id=p_game_id;
END $$;
-- Lab-only authenticated-member surrogate. Production uses auth.uid() and member access statuses.
CREATE FUNCTION add_score_event(p_game_id uuid,p_team team_side,p_event_type score_event_type,p_points integer DEFAULT NULL,p_responsible_member_id uuid DEFAULT NULL,p_credited_member_id uuid DEFAULT NULL) RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE v_id uuid;v_points integer;v_type score_event_type;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM members WHERE id=p_credited_member_id AND active) THEN RAISE EXCEPTION 'Member inactive or missing'; END IF;
 IF NOT EXISTS(SELECT 1 FROM games WHERE id=p_game_id AND status='activa') THEN RAISE EXCEPTION 'Game not active'; END IF;
 IF NOT EXISTS(SELECT 1 FROM game_players WHERE game_id=p_game_id AND member_id=p_credited_member_id AND team=p_team) THEN RAISE EXCEPTION 'Credited player wrong team'; END IF;
 v_type:=CASE WHEN p_event_type='paso_salida_doble' THEN 'dos_carotas'::score_event_type ELSE p_event_type END;
 v_points:=coalesce(expected_event_points(v_type),p_points);
 IF v_points IS NULL OR v_points<1 OR v_points>250 THEN RAISE EXCEPTION 'Invalid points'; END IF;
 IF v_type IN ('multa','chivo','pase_con_ficha') AND (p_responsible_member_id IS NULL OR NOT EXISTS(SELECT 1 FROM game_players WHERE game_id=p_game_id AND member_id=p_responsible_member_id AND team<>p_team)) THEN RAISE EXCEPTION 'Responsible must be opponent'; END IF;
 INSERT INTO score_events(game_id,team,event_type,points,credited_member_id,responsible_member_id) VALUES(p_game_id,p_team,v_type,v_points,p_credited_member_id,p_responsible_member_id) RETURNING id INTO v_id;
 INSERT INTO score_event_audit VALUES(v_id,'crear',v_points);
 PERFORM recalculate_game_score(p_game_id);
 RETURN v_id;
END $$;
INSERT INTO members VALUES('11111111-1111-4111-8111-111111111111',true),('22222222-2222-4222-8222-222222222222',true),('99999999-9999-4999-8999-999999999999',false);
INSERT INTO games(id) VALUES('33333333-3333-4333-8333-333333333333'),('44444444-4444-4444-8444-444444444444');
INSERT INTO game_players VALUES('33333333-3333-4333-8333-333333333333','11111111-1111-4111-8111-111111111111','L'),('33333333-3333-4333-8333-333333333333','22222222-2222-4222-8222-222222222222','C'),('44444444-4444-4444-8444-444444444444','11111111-1111-4111-8111-111111111111','L'),('44444444-4444-4444-8444-444444444444','22222222-2222-4222-8222-222222222222','C');
-- Seed history, not fake scoreboard. Scores are derived from events exactly as in production.
INSERT INTO score_events(game_id,team,event_type,points) VALUES
('33333333-3333-4333-8333-333333333333','L','normal',100),
('33333333-3333-4333-8333-333333333333','L','normal',85),
('33333333-3333-4333-8333-333333333333','C','normal',100),
('33333333-3333-4333-8333-333333333333','C','normal',30),
('44444444-4444-4444-8444-444444444444','L','normal',100),
('44444444-4444-4444-8444-444444444444','L','normal',90),
('44444444-4444-4444-8444-444444444444','C','normal',100),
('44444444-4444-4444-8444-444444444444','C','normal',50);
SELECT recalculate_game_score('33333333-3333-4333-8333-333333333333');
SELECT recalculate_game_score('44444444-4444-4444-8444-444444444444');
DO $$
DECLARE n integer;
BEGIN
 IF (SELECT (largos_score,cortos_score)=(185,130) FROM games WHERE id='33333333-3333-4333-8333-333333333333') IS NOT TRUE THEN RAISE EXCEPTION 'Fixture not based on history'; END IF;
 BEGIN
 PERFORM add_score_event('33333333-3333-4333-8333-333333333333','C','normal',25,NULL,'11111111-1111-4111-8111-111111111111');
 RAISE EXCEPTION 'INVALID PLAYER ACCEPTED';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM='INVALID PLAYER ACCEPTED' THEN RAISE; END IF;
 END;
 SELECT count(*) INTO n FROM score_events;
 IF n<>8 THEN RAISE EXCEPTION 'Failed attempt inserted history'; END IF;
 PERFORM add_score_event('33333333-3333-4333-8333-333333333333','C','normal',25,NULL,'22222222-2222-4222-8222-222222222222');
 IF (SELECT (largos_score,cortos_score,status)=(185,155,'activa') FROM games WHERE id='33333333-3333-4333-8333-333333333333') IS NOT TRUE THEN RAISE EXCEPTION 'Corrected score wrong'; END IF;
 IF (SELECT count(*) FROM score_event_audit)<>1 THEN RAISE EXCEPTION 'Audit missing/duplicate'; END IF;
 PERFORM add_score_event('44444444-4444-4444-8444-444444444444','L','normal',15,NULL,'11111111-1111-4111-8111-111111111111');
 IF (SELECT (largos_score,cortos_score,status,winner)=(205,150,'finalizada','L') FROM games WHERE id='44444444-4444-4444-8444-444444444444') IS NOT TRUE THEN RAISE EXCEPTION 'Victory incorrect'; END IF;
 BEGIN
 PERFORM add_score_event('44444444-4444-4444-8444-444444444444','L','normal',5,NULL,'11111111-1111-4111-8111-111111111111');
 RAISE EXCEPTION 'POST VICTORY ACCEPTED';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM='POST VICTORY ACCEPTED' THEN RAISE; END IF;
 END;
 IF (SELECT count(*) FROM score_event_audit)<>2 THEN RAISE EXCEPTION 'Audit changed after victory'; END IF;
END $$;
ROLLBACK;
SELECT 'HISTORY-BASED SCORING TEST PASSED' AS result;
