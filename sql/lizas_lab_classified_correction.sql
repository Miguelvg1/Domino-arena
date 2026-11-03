-- LAB ONLY. Depends on sql/lizas_lab_concept.sql.
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
 if p_new_event_type='normal' and p_concept is distinct from 'dominada' then
  raise exception 'Selecciona el concepto dominada para anotación manual';
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
