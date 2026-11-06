-- LAB ONLY. Review security and integration before promotion.
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
-- Correction RPC must be extended separately before UI activation.
