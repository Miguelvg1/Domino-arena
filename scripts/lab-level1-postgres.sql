\set ON_ERROR_STOP on
BEGIN;
CREATE SCHEMA lab;
CREATE TABLE lab.players(id uuid PRIMARY KEY,name text NOT NULL,team text NOT NULL CHECK(team IN ('L','C')));
CREATE TABLE lab.games(id uuid PRIMARY KEY,largos_score integer NOT NULL DEFAULT 0,cortos_score integer NOT NULL DEFAULT 0,status text NOT NULL DEFAULT 'activa' CHECK(status IN ('activa','finalizada')),winner text CHECK(winner IN ('L','C')));
CREATE TABLE lab.score_events(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,game_id uuid NOT NULL REFERENCES lab.games(id),credited_player uuid NOT NULL REFERENCES lab.players(id),team text NOT NULL CHECK(team IN ('L','C')),points integer NOT NULL CHECK(points BETWEEN 1 AND 250));
CREATE FUNCTION lab.register_score(p_game uuid,p_player uuid,p_team text,p_points integer) RETURNS void LANGUAGE plpgsql AS $$
DECLARE g lab.games%ROWTYPE; t text;
BEGIN
 SELECT team INTO t FROM lab.players WHERE id=p_player;
 IF t IS NULL OR t<>p_team THEN RAISE EXCEPTION 'Player/team mismatch'; END IF;
 SELECT * INTO g FROM lab.games WHERE id=p_game FOR UPDATE;
 IF NOT FOUND OR g.status<>'activa' THEN RAISE EXCEPTION 'Game not active'; END IF;
 IF p_points NOT BETWEEN 1 AND 250 THEN RAISE EXCEPTION 'Invalid points'; END IF;
 INSERT INTO lab.score_events(game_id,credited_player,team,points) VALUES(p_game,p_player,p_team,p_points);
 UPDATE lab.games SET largos_score=largos_score+CASE WHEN p_team='L' THEN p_points ELSE 0 END,
 cortos_score=cortos_score+CASE WHEN p_team='C' THEN p_points ELSE 0 END,
 status=CASE WHEN (CASE WHEN p_team='L' THEN largos_score ELSE cortos_score END)+p_points>=200 THEN 'finalizada' ELSE 'activa' END,
 winner=CASE WHEN (CASE WHEN p_team='L' THEN largos_score ELSE cortos_score END)+p_points>=200 THEN p_team ELSE NULL END WHERE id=p_game;
END $$;
INSERT INTO lab.players VALUES ('11111111-1111-4111-8111-111111111111','Juan','L'),('22222222-2222-4222-8222-222222222222','Carlos','C');
INSERT INTO lab.games VALUES ('33333333-3333-4333-8333-333333333333',185,130,'activa',NULL);
DO $$ BEGIN
 BEGIN
 PERFORM lab.register_score('33333333-3333-4333-8333-333333333333','11111111-1111-4111-8111-111111111111','C',25);
 RAISE EXCEPTION 'Mismatched player accepted';
 EXCEPTION WHEN raise_exception THEN
 IF SQLERRM='Mismatched player accepted' THEN RAISE; END IF;
 END;
 IF (SELECT count(*) FROM lab.score_events)<>0 THEN RAISE EXCEPTION 'Wrong-team event was persisted'; END IF;
 PERFORM lab.register_score('33333333-3333-4333-8333-333333333333','22222222-2222-4222-8222-222222222222','C',25);
 IF (SELECT (largos_score,cortos_score,status)=(185,155,'activa') FROM lab.games) IS NOT TRUE THEN RAISE EXCEPTION 'Incorrect corrected score'; END IF;
 IF (SELECT count(*) FROM lab.score_events)<>1 THEN RAISE EXCEPTION 'History event count incorrect'; END IF;
 END $$;
INSERT INTO lab.games VALUES ('44444444-4444-4444-8444-444444444444',190,150,'activa',NULL);
DO $$ BEGIN
 PERFORM lab.register_score('44444444-4444-4444-8444-444444444444','11111111-1111-4111-8111-111111111111','L',15);
 IF (SELECT (largos_score,status,winner)=(205,'finalizada','L') FROM lab.games WHERE id='44444444-4444-4444-8444-444444444444') IS NOT TRUE THEN RAISE EXCEPTION 'Victory incorrect'; END IF;
 BEGIN
 PERFORM lab.register_score('44444444-4444-4444-8444-444444444444','11111111-1111-4111-8111-111111111111','L',5);
 RAISE EXCEPTION 'Finished game accepted points';
 EXCEPTION WHEN raise_exception THEN
 IF SQLERRM='Finished game accepted points' THEN RAISE; END IF;
 END;
 IF (SELECT count(*) FROM lab.score_events WHERE game_id='44444444-4444-4444-8444-444444444444')<>1 THEN RAISE EXCEPTION 'Post-victory history changed'; END IF;
 END $$;
ROLLBACK;
SELECT 'LAB SQL TRANSACTION TESTS PASSED' AS result;
