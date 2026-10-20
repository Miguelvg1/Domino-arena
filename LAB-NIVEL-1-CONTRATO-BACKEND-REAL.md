# Contrato del backend real — nivel 1

Verificado mediante consultas de solo lectura a Supabase de producción el 20-10-2026.

## Función pública que llama el frontend
`public.add_score_event(p_game_id uuid, p_team team_side, p_event_type score_event_type, p_points integer DEFAULT NULL, p_responsible_member_id uuid DEFAULT NULL, p_credited_member_id uuid DEFAULT NULL) RETURNS uuid`

## Tipos reales
- team_side: L, C.
- game_status: preparando, activa, finalizada, anulada.
- score_event_type: normal, multa, capicua, paso_corrido, chivo, pase_con_ficha, paso_salida_doble, dos_carotas.

## Tablas que requiere una réplica funcional
- games: id, table_id, status, largos_score, cortos_score, winner, created_by, started_at, finished_at.
- game_players: id, game_id, member_id, team, seat.
- score_events: id, game_id, team, event_type, points, credited_member_id, responsible_member_id, voided, original_points, edited, created_by, created_at, updated_at.
- members, club_tables, auth.users y políticas RLS relacionadas.

## Brecha pendiente antes de fusionar PR #19
El laboratorio actual implementa `lab.register_score` y no `public.add_score_event`. Sus tablas y controles de autorización no son una réplica fiel de producción. Las pruebas unitarias y PostgreSQL aislado están aprobadas, pero **no equivalen a una prueba integral del backend real**. Para cerrar la validación se necesita migrar la definición real de las funciones y sus dependencias a un proyecto aislado, crear cuentas y partidas ficticias y probar desde el frontend usando credenciales de laboratorio. No copiar registros reales.
