-- Titanes Dominó — PROPUESTA NO APLICADA
-- Objetivo: reducir superficie pública sin impedir anotaciones de miembros activos.
-- Revisar dependencias y probar en laboratorio antes de ejecutar en producción.
BEGIN;
REVOKE EXECUTE ON FUNCTION public.correct_score_event_v2(uuid, public.team_side, public.score_event_type, integer, uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.correct_score_event_v2(uuid, public.team_side, public.score_event_type, integer, uuid, uuid, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_add_club_table(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_add_club_table(text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_set_club_table_active(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_club_table_active(uuid, boolean) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_set_game_start_override(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_game_start_override(text) TO authenticated;
COMMIT;

-- PENDIENTE: auditar llamadas legítimas anónimas antes de ampliar revocaciones.
-- NO revocar a authenticated permisos de anotación, edición, anulación y recálculo
-- sin diseñar primero un mecanismo de recálculo interno seguro.
-- Pruebas: anónimo denegado; jugador activo anota/corrige; admin gestiona mesas;
-- suspendido denegado; suspensión vencida conforme a política vigente.
