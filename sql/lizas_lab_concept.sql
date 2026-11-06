-- Applied only to LAB project ybtdxjqodcjoccyuauzv.
-- Do not run in production until RPC changes and authorization checks are reviewed.
alter table public.score_events add column if not exists concept text;
alter table public.score_events drop constraint if exists score_events_concept_valid;
alter table public.score_events add constraint score_events_concept_valid
check (concept is null or concept in
 ('dominada','multa','paso_corrido','salida','salida_a_dos_caritas',
  'chivo','pase_con_ficha','capicua','paso_salida_doble'));
-- Existing rows remain NULL intentionally. No retroactive inference.
-- NEXT: extend existing add_score_event/correct_score_event_v2 functions atomically
-- to validate and write concept in the same transaction as the event.
-- Avoid client-side UPDATE after score insertion: RLS/partial failure risks.
