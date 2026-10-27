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

## Avance comprobado de esta sesión
- Laboratorio Supabase `ybtdxjqodcjoccyuauzv`: se confirmó mediante inventario de esquema que `titanes_security_lab.members` existe, tiene RLS habilitada y 0 filas. No es una réplica exacta de `public.members` en producción.
- Se inspeccionaron los cuerpos reales de cinco funciones en producción: `admin_add_club_table`, `admin_set_club_table_active`, `admin_pending_membership_requests`, `add_turn_pair_safe`/`add_turn_pair` y `correct_score_event_v2`. Todas presentan comprobaciones internas de rol, identidad o membresía; esto no sustituye las pruebas de autorización con sesiones reales.
- Se inspeccionaron las Edge Functions `membership-request` y `pin-login` de producción: ambas usan un cliente de servicio. La app invoca `update_my_profile` para el perfil y lee `members` para cargar el usuario.
- **Pendiente P0:** probar los flujos con identidades de prueba, resolver la lectura `SELECT *` de `members`, aplicar la migración tras validar y generar AAB. No se ha tocado producción.

## Corrección preparada — 27 oct 2026
- Rama de seguridad: `index.html` ahora solicita columnas explícitas de `members` y excluye `pin_hash` al cargar el perfil (`b43382d`).
- Migración SQL candidata: reemplazado `GRANT SELECT` de toda la tabla por `GRANT SELECT` de columnas permitidas, excluyendo `pin_hash` (`d2cef2`).
- **No desplegar esta migración aisladamente**: la consulta de perfil y el cambio de GRANT deben entrar juntos; además se deben revisar todas las dependencias de SELECT sobre `members`, incluidas vistas y RPC, y probar con sesiones reales. El laboratorio simplificado no replica toda la producción.
- No se ha aplicado DDL en producción. Pendiente la validación integrada y autorización de publicación.

## Comprobación directa adicional de laboratorio
Consulta de privilegios SQL en `titanes_security_lab.members` (proyecto de laboratorio): `authenticated` UPDATE `role` = false; UPDATE `active` = false; UPDATE `access_status` = false; UPDATE `full_name` = true; `anon` UPDATE `full_name` = false. **PASS para el esquema aislado.** No prueba los permisos de producción ni sustituye el E2E con identidades reales.

## Hallazgo confirmado en PRODUCCIÓN — bloqueo P0
Consulta SQL de permisos efectiva sobre `public.members` en proyecto `hvpyngkqtqzvmweavego`: `has_column_privilege('authenticated','public.members','role','UPDATE') = true` y `has_column_privilege('authenticated','public.members','pin_hash','SELECT') = true`. Por tanto **la vulnerabilidad de permisos y la exposición de hash por API no están corregidas en producción**. Contraste con laboratorio aislado: `role UPDATE = false`, `full_name UPDATE = true`, `anon full_name UPDATE = false`.

**Acción necesaria:** validar la compatibilidad de RPC/vistas y desplegar conjuntamente cambio frontend y migración de permisos; comprobar privilegios efectivos y ejecutar smoke tests. No publicar mientras el riesgo P0 permanezca abierto.

## Mitigación P0 APLICADA en producción (27 oct 2026)
Se ejecutó exitosamente la migración `restrict_members_direct_mutation_p0_20261027` sobre `hvpyngkqtqzvmweavego`: REVOKE INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER para anon y authenticated; GRANT UPDATE exclusivamente de full_name,nickname,phone,photo_url para authenticated. Verificación posterior: `role UPDATE=false`, `full_name UPDATE=true`, `service_role UPDATE=true`. **Pendiente P0**: `pin_hash SELECT=true` en producción. NO se aplicó la migración candidata completa de este PR y NO se desplegó frontend; coordinar protección de SELECT con frontend y otras dependencias antes de cerrar.
