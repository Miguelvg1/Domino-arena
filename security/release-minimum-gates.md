# Titanes Dominó — Bloqueadores mínimos de publicación

Estado: **NO APTO TODAVÍA PARA PUBLICACIÓN** hasta cerrar controles críticos.

## P0 — Antes del lanzamiento
1. Resolver la capacidad de actualizar columnas sensibles de `public.members` mediante API directa. La migración candidata `security/sql/member-privileges-hardening.sql` **no está desplegada**.
2. Revisar las funciones `SECURITY DEFINER` accesibles por `anon` que pueden alterar mesas, turnos, puntuaciones o administración. Los avisos de Supabase confirman exposición de EXECUTE, pero **no demuestran explotación**: inspeccionar cada cuerpo y verificar autorización efectiva antes de cambiar permisos.
3. Probar con usuarios de prueba: alta pendiente, aprobación administrativa, login, edición del perfil propio, denegación de elevación de rol.
4. Hacer prueba de humo de mesas, partidas y puntuaciones después del cambio.
5. Construir AAB firmado con versionCode mayor que 3 y completar requisitos de Play Console.

## Evidencia disponible
- Laboratorio: pruebas de GRANT, UPDATE SQL y simulación de RLS satisfactorias; no equivalen a E2E.
- Producción: Supabase Security Advisor reporta 6 vistas SECURITY DEFINER y 26 funciones SECURITY DEFINER ejecutables por anon, incluyendo `admin_add_club_table`, `admin_pending_membership_requests`, `admin_set_club_table_active`, `add_turn_pair_safe` y `correct_score_event_v2`. Priorizarlas según capacidad de escritura.
- Las consultas adicionales de permisos en producción fueron bloqueadas por controles de la herramienta; no asumir resultados.
- Ninguna migración ni modificación de datos fue aplicada a producción en esta etapa.

## Criterio de salida
No marcar P0 como cerrado sin evidencia de autorización efectiva de las funciones expuestas, E2E de registro/aprobación/perfil y pruebas de humo de juego. Posponer solo advertencias no explotables o no críticas.
