-- PREPARED ONLY: production migration candidate. DO NOT RUN until QA and backup verified.
-- Requires verified schema backup, maintenance window and rollback plan.
-- Does not infer historical 'normal' events: legacy lizas remain indeterminate.
begin;
set local lock_timeout='5s';
set local statement_timeout='60s';
-- Fail closed if prerequisite scoring functions are absent.
do $$ begin
 if to_regprocedure('public.add_score_event(uuid,public.team_side,public.score_event_type,integer,uuid,uuid)') is null
 or to_regprocedure('public.correct_score_event_v2(uuid,public.team_side,public.score_event_type,integer,uuid,uuid,text)') is null
 then raise exception 'Scoring RPC signature mismatch: stop migration'; end if;
end $$;

alter table public.score_events add column if not exists concept text;
alter table public.score_events drop constraint if exists score_events_concept_valid;
alter table public.score_events add constraint score_events_concept_valid
check (concept is null or concept in
 ('dominada','multa','paso_corrido','salida','salida_a_dos_caritas',
  'chivo','pase_con_ficha','capicua','paso_salida_doble'));
-- Existing rows remain NULL intentionally. No retroactive inference.


-- Depends on score_events.concept from sql/lizas_lab_concept.sql
create or replace function public.add_score_event_classified(
 p_game_id uuid,p_team public.team_side,p_event_type public.score_event_type,
 p_points integer default null,p_responsible_member_id uuid default null,
 p_credited_member_id uuid default null,p_concept text default null
) returns uuid language plpgsql security definer set search_path=pg_catalog,public
as $$
declare v_id uuid; v_concept text;
begin
 if auth.uid() is null or not public.is_active_club_member() then
  raise exception 'Solo miembros activos pueden anotar';
 end if;
 v_concept := case
  when p_event_type='normal' then p_concept
  when p_event_type ='dos_carotas' then 'salida_a_dos_caritas'
  else p_event_type::text end;
 if p_event_type='normal' and (p_concept is null or p_concept not in ('dominada','salida')) then
  raise exception 'Las anotaciones manuales requieren concepto dominada o salida.';
 end if;
 if p_event_type<>'normal' and p_concept is not null and p_concept<>v_concept then
  raise exception 'Concepto incompatible con el tipo de jugada';
 end if;
 v_id:=public.add_score_event(p_game_id,p_team,p_event_type,p_points,p_responsible_member_id,p_credited_member_id);
 update public.score_events set concept=v_concept where id=v_id;
 if not found then raise exception 'No se pudo clasificar la anotación'; end if;
 return v_id;
end $$;
revoke all on function public.add_score_event_classified(uuid,public.team_side,public.score_event_type,integer,uuid,uuid,text) from public,anon;
grant execute on function public.add_score_event_classified(uuid,public.team_side,public.score_event_type,integer,uuid,uuid,text) to authenticated;
-- Existing add_score_event is unchanged for compatibility.


-- Wrapper reuses the original authorized correction, then classifies atomically.
create or replace function public.correct_score_event_classified(
 p_event_id uuid,p_new_team public.team_side,p_new_event_type public.score_event_type,
 p_new_points integer default null,p_new_responsible_member_id uuid default null,
 p_new_credited_member_id uuid default null,p_reason text default null,p_concept text default null
) returns void language plpgsql security definer set search_path=pg_catalog,public
as $$
declare v_concept text;
begin
 if auth.uid() is null or not public.is_active_club_member() then raise exception 'No autorizado'; end if;
 v_concept:=case when p_new_event_type='normal' then p_concept
  when p_new_event_type ='dos_carotas' then 'salida_a_dos_caritas'
  else p_new_event_type::text end;
 if p_new_event_type='normal' and (p_concept is null or p_concept not in ('dominada','salida')) then
  raise exception 'Selecciona dominada o salida para anotación manual';
 end if;
 if p_new_event_type<>'normal' and p_concept is not null and p_concept<>v_concept then
  raise exception 'Concepto incompatible';
 end if;
 perform public.correct_score_event_v2(p_event_id,p_new_team,p_new_event_type,p_new_points,
 p_new_responsible_member_id,p_new_credited_member_id,p_reason);
 update public.score_events set concept=v_concept where id=p_event_id and voided=false;
 if not found then raise exception 'No se pudo clasificar la corrección'; end if;
end $$;
revoke all on function public.correct_score_event_classified(uuid,public.team_side,public.score_event_type,integer,uuid,uuid,text,text) from public,anon;
grant execute on function public.correct_score_event_classified(uuid,public.team_side,public.score_event_type,integer,uuid,uuid,text,text) to authenticated;


-- Postconditions: both classified RPCs exist and anonymous cannot execute.
do $$ begin
 if to_regprocedure('public.add_score_event_classified(uuid,public.team_side,public.score_event_type,integer,uuid,uuid,text)') is null
 or to_regprocedure('public.correct_score_event_classified(uuid,public.team_side,public.score_event_type,integer,uuid,uuid,text,text)') is null
 then raise exception 'Classified RPC missing'; end if;
 if has_function_privilege('anon','public.add_score_event_classified(uuid,public.team_side,public.score_event_type,integer,uuid,uuid,text)','EXECUTE')
 or has_function_privilege('anon','public.correct_score_event_classified(uuid,public.team_side,public.score_event_type,integer,uuid,uuid,text,text)','EXECUTE')
 then raise exception 'Anonymous execution must be forbidden'; end if;
end $$;
commit;
