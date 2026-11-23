-- Tournament TV snapshots are public event data, including small player photos.
-- Keep a bounded limit while allowing a normal multi-table tournament.
create or replace function public.publish_tv_tournament_snapshot(
  p_tournament_id text,
  p_expected_revision bigint,
  p_operation_id text,
  p_snapshot jsonb
)
returns table(revision bigint, snapshot jsonb, updated_at timestamptz)
language plpgsql
security invoker
set search_path = pg_catalog, public
as $function$
declare
  current_revision bigint;
  saved_revision bigint;
begin
  if p_tournament_id is null or p_tournament_id !~ '^[A-Za-z0-9_-]{20,64}$' then raise exception 'Invalid tournament ID'; end if;
  if p_expected_revision is null or p_expected_revision < 0 then raise exception 'Invalid expected revision'; end if;
  if p_operation_id is null or p_operation_id !~ '^[A-Za-z0-9_-]{8,128}$' then raise exception 'Invalid operation ID'; end if;
  if p_snapshot is null or jsonb_typeof(p_snapshot) <> 'object'
     or p_snapshot ->> 'schemaVersion' <> '1'
     or jsonb_typeof(p_snapshot -> 'matches') <> 'array'
     or pg_column_size(p_snapshot) > 1048576 then
    raise exception 'Invalid public snapshot';
  end if;

  if exists (select 1 from public.tv_tournament_operations o where o.tournament_id = p_tournament_id and o.operation_id = p_operation_id) then
    return query select s.revision, s.snapshot, s.updated_at from public.tv_tournament_snapshots s where s.tournament_id = p_tournament_id;
    return;
  end if;

  select s.revision into current_revision from public.tv_tournament_snapshots s where s.tournament_id = p_tournament_id for update;
  if not found then
    if p_expected_revision <> 0 then raise exception 'Revision conflict'; end if;
    insert into public.tv_tournament_snapshots(tournament_id, revision, snapshot) values (p_tournament_id, 1, p_snapshot);
    saved_revision := 1;
  else
    if exists (select 1 from public.tv_tournament_operations o where o.tournament_id = p_tournament_id and o.operation_id = p_operation_id) then
      return query select s.revision, s.snapshot, s.updated_at from public.tv_tournament_snapshots s where s.tournament_id = p_tournament_id;
      return;
    end if;
    if p_expected_revision <> current_revision then raise exception 'Revision conflict'; end if;
    update public.tv_tournament_snapshots s
       set revision = s.revision + 1, snapshot = p_snapshot, updated_at = now()
     where s.tournament_id = p_tournament_id
     returning s.revision into saved_revision;
  end if;
  insert into public.tv_tournament_operations(tournament_id, operation_id, revision) values (p_tournament_id, p_operation_id, saved_revision);
  return query select s.revision, s.snapshot, s.updated_at from public.tv_tournament_snapshots s where s.tournament_id = p_tournament_id;
end;
$function$;
