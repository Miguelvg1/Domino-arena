create table public.tournament_lab_history (
  tournament_key text not null check (tournament_key ~ '^[a-z0-9-]{8,64}$'),
  revision integer not null check (revision > 0),
  operation_id uuid not null,
  actor uuid not null,
  recorded_at timestamptz not null default clock_timestamp(),
  state jsonb not null check (jsonb_typeof(state) = 'object' and pg_column_size(state) <= 2097152),
  primary key (tournament_key, revision),
  unique (tournament_key, operation_id)
);

alter table public.tournament_lab_history enable row level security;
revoke all on public.tournament_lab_history from public, anon, authenticated;
grant select on public.tournament_lab_history to authenticated;

create policy tournament_lab_organizer_read on public.tournament_lab_history
for select to authenticated using (
  exists (
    select 1 from public.members m
    where m.auth_user_id = (select auth.uid()) and m.active
      and m.access_status = 'activo' and m.deleted_at is null and m.is_guest is not true
      and m.role in ('admin', 'directiva')
  )
);

create function public.save_tournament_lab_revision(
  p_key text, p_revision integer, p_operation uuid, p_state jsonb
) returns integer language plpgsql security definer set search_path = '' as $$
declare
  organizer_role text;
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

  if p_key is null or p_key !~ '^[a-z0-9-]{8,64}$'
    or p_revision is null or p_revision < 0 or p_operation is null
    or jsonb_typeof(p_state) is distinct from 'object'
    or jsonb_typeof(p_state->'matches') is distinct from 'array'
    or jsonb_typeof(p_state->'completedMatches') is distinct from 'array'
    or jsonb_typeof(p_state->'players') is distinct from 'array'
    or jsonb_array_length(p_state->'players') > 32
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

revoke all on function public.save_tournament_lab_revision(text, integer, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.save_tournament_lab_revision(text, integer, uuid, jsonb) to authenticated;
