create or replace function public.save_tournament_lab_revision(
  p_key text, p_revision integer, p_operation uuid, p_state jsonb
) returns integer language plpgsql security definer set search_path = '' as $$
declare
  organizer_role text;
  capacity integer := 32;
  prior public.tournament_lab_history%rowtype;
  repeated public.tournament_lab_history%rowtype;
begin
  select m.role into organizer_role from public.members m
  where m.auth_user_id = auth.uid() and m.active
    and m.access_status = 'activo' and m.deleted_at is null and m.is_guest is not true
    and m.role in ('admin', 'directiva');
  if organizer_role is null then
    raise exception 'Acceso reservado a organizadores' using errcode = '42501';
  end if;

  if p_state ? 'capacity' then
    if jsonb_typeof(p_state->'capacity') is distinct from 'number'
      or coalesce(p_state->>'capacity', '') !~ '^[0-9]{1,2}$' then
      raise exception 'Cupo inválido' using errcode = '22023';
    end if;
    capacity := (p_state->>'capacity')::integer;
  end if;

  if p_key is null or p_key !~ '^[a-z0-9-]{8,64}$'
    or p_revision is null or p_revision < 0 or p_operation is null
    or jsonb_typeof(p_state) is distinct from 'object'
    or jsonb_typeof(p_state->'matches') is distinct from 'array'
    or jsonb_typeof(p_state->'completedMatches') is distinct from 'array'
    or jsonb_typeof(p_state->'players') is distinct from 'array'
    or (capacity < 8 or capacity > 64 or capacity % 2 <> 0)
    or jsonb_array_length(p_state->'players') > capacity
    or pg_column_size(p_state) > 2097152 then
    raise exception 'Estado de torneo inválido' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('tournament_lab:' || p_key, 0));
  select * into repeated from public.tournament_lab_history
    where tournament_key = p_key and operation_id = p_operation;
  if found then
    if repeated.actor = auth.uid() and repeated.state = p_state then
      return repeated.revision;
    end if;
    raise exception 'Operación ya registrada' using errcode = '23505';
  end if;
  select * into prior from public.tournament_lab_history
    where tournament_key = p_key order by revision desc limit 1;
  if coalesce(prior.revision, 0) <> p_revision then
    raise exception 'El torneo cambió en otro dispositivo. Recarga para continuar.' using errcode = '40001';
  end if;
  if jsonb_typeof(prior.state->'pairs') = 'array' and jsonb_array_length(prior.state->'pairs') > 0
    and coalesce((prior.state->>'capacity')::integer, 32) <> capacity then
    raise exception 'El cupo ya quedó fijado por el sorteo' using errcode = '22023';
  end if;
  if organizer_role <> 'admin' and exists (
    (select m->>'id', m->>'scheduledAt', m->>'scheduleApprovedBy'
      from jsonb_array_elements((p_state->'matches') || (p_state->'completedMatches')) m
      where m->>'scheduledAt' is not null or m->>'scheduleApprovedBy' is not null
     except
     select m->>'id', m->>'scheduledAt', m->>'scheduleApprovedBy'
      from jsonb_array_elements(coalesce((prior.state->'matches') || (prior.state->'completedMatches'), '[]'::jsonb)) m)
  ) then
    raise exception 'Solo Presidencia puede autorizar horarios' using errcode = '42501';
  end if;

  insert into public.tournament_lab_history (tournament_key, revision, operation_id, actor, state)
    values (p_key, p_revision + 1, p_operation, auth.uid(), p_state);
  return p_revision + 1;
end;
$$;
