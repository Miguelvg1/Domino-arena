# Auditoría de seguridad — miembros y vistas (2026-10-27)

Proyecto productivo: `hvpyngkqtqzvmweavego`. **No ejecutar cambios sobre producción sin validar el flujo de administración.**

## Hallazgo confirmado

- `public.members`: RLS habilitado; `anon` y `authenticated` tienen UPDATE de tabla, incluyendo `role`, `auth_user_id`, `active`, `access_status`.
- La política `members_update_own_profile` permite actualizar la fila propia sin limitar las columnas.
- El trigger inspeccionado es únicamente BEFORE INSERT, no protege cambios de UPDATE.
- Seis vistas marcadas por el asesor de Supabase como SECURITY DEFINER.
- 26 funciones SECURITY DEFINER ejecutables por `anon` y 57 por `authenticated`; requieren revisión individual de permisos y comprobaciones internas.
- El laboratorio `ybtdxjqodcjoccyuauzv` no tiene una tabla `public.members` equivalente.

## Plan seguro de implementación

1. Construir en el laboratorio un esquema compatible **sin copiar información personal de jugadores**; incluir roles, políticas, funciones y vistas de prueba.
2. Inventariar todos los RPC administrativos y operaciones de actualización de perfiles; definir columnas que el usuario puede cambiar.
3. Preferir un RPC `SECURITY DEFINER` **con autorización explícita** para cambios administrativos, y revocar UPDATE general a `anon`/`authenticated`; otorgar UPDATE únicamente a columnas de perfil (según inventario). Verificar si existen consultas `update(...).select('*')` que requieran ajustes.
4. Probar con identidades separadas: usuario normal no puede cambiar `role`, `auth_user_id`, `active` ni `access_status`; admin sí puede mediante ruta autorizada; cambios de nombre/foto siguen funcionando.
5. Revisar cada vista y cambiar a `security_invoker=true` **solo** si las políticas RLS de tablas base permiten el acceso esperado; verificar estadísticas y turnos.
6. Revisar cada función privilegiada; revocar EXECUTE público únicamente cuando no forme parte de flujos anónimos legítimos.
7. Respaldar estructura y plan de reversión; desplegar por etapas, verificar permisos con `has_table_privilege`/`has_column_privilege` y repetir asesores.

## Criterio de salida

No declarar corregida la vulnerabilidad hasta tener pruebas negativas de escalada de privilegios, pruebas positivas de administración, y regresión de partidas, rankings, turnos y perfiles.

Referencias: https://supabase.com/docs/guides/database/postgres/column-level-security

## Revisión de aprobación de membresías (2026-10-27)

Se inspeccionaron ambas sobrecargas `service_finalize_membership_request`:

- Firmas: `(uuid,uuid,text,text,uuid)` y `(uuid,uuid,uuid)`.
- Ambas son `SECURITY DEFINER` y aceptan `p_admin_auth_user_id`; su cuerpo comprueba la membresía admin asociada, pero no compara ese parámetro con `auth.uid()`.
- **Dato decisivo**: `information_schema.routine_privileges` muestra EXECUTE solamente para `postgres` y `service_role`, no para `anon` ni `authenticated`. Por tanto, **no hay evidencia de que un jugador pueda invocar directamente estas funciones mediante la API con su sesión**. No catalogar como explotación confirmada.
- Antes de endurecer la firma, verificar el servicio backend que las invoca. Si la ejecución está restringida a `service_role`, la identidad del administrador debe verificarse en ese servicio, o usar una ruta con JWT autenticado y comprobación explícita de `auth.uid()`.
- `update_my_profile` actualiza `full_name`, `nickname`, `phone`, `photo_url`. El laboratorio se ajustó para conceder UPDATE solo en estas cuatro columnas.
- El laboratorio ahora concede INSERT solo en `auth_user_id`, `full_name`, `nickname`, `phone`, `photo_url`; esto **no replica** el flujo de aprobación real de producción y requiere pruebas de integración antes del despliegue.

## Verificación de Edge Functions en producción

Se inspeccionó el código **desplegado** de `approve-membership` (versión 3, ACTIVE) y `admin-create-member`.

- `approve-membership` requiere token Bearer, valida la sesión mediante `admin.auth.getUser(token)`, y transmite **`u.user.id` derivado del token validado**, no un ID de administrador proporcionado por el cliente, a `service_finalize_membership_request`. La función SQL comprueba que ese ID pertenece a un administrador activo. Esta ruta contiene comprobaciones de identidad y rol; no se ha demostrado una escalada en esta ruta.
- `admin-create-member` valida igualmente `getUser(token)` y busca un miembro con `role='admin'`, `active=true`, `access_status='activo'`, `deleted_at IS NULL` antes de crear usuarios. Usa `service_role` para escrituras administrativas legítimas.
- La **amenaza principal persiste** en los privilegios UPDATE/INSERT excesivos de `public.members`: un usuario podría intentar cambiar su propio rol por una ruta directa si las políticas lo permiten; las verificaciones de rol del backend solo son confiables si `members.role` está protegido.
- No revocar permisos `service_role` ni alterar las Edge Functions sin pruebas. El siguiente cambio productivo debe centrarse en restringir permisos de cliente sobre `members` preservando las escrituras administrativas de `service_role`.

## Auditoría de grants ampliada

La consulta `information_schema.role_table_grants` confirmó que **anon y authenticated** tienen actualmente INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES y TRIGGER en `public.members` (los mismos tipos de grants de tabla también aparecen para `service_role`). RLS limita operaciones por filas, pero no reemplaza la restricción de permisos de tabla/columnas. Se añadió `security/sql/member-privileges-hardening.sql` como migración **candidata, no ejecutada**. Revoca grants directos de anon/authenticated, mantiene SELECT para authenticated y UPDATE limitado a los cuatro campos de perfil. Antes de desplegar: comprobar triggers de registro, funciones SECURITY INVOKER y flujos de directorio, perfiles y administración con cuentas de prueba. No modificar grants de service_role.

## Compatibilidad comprobada mediante inspección de producción

- Trigger `auth.users` `on_auth_user_created_titanes` ejecuta `handle_new_auth_user()` como `SECURITY DEFINER`; crea miembro `role='miembro'`, `active=false`, `access_status='pendiente'` y usa `ON CONFLICT` para actualizar datos de perfil. Este flujo no requiere un GRANT INSERT de tabla a `authenticated` cuando el propietario del procedimiento conserva sus privilegios. **No probado mediante alta real.**
- Trigger en `public.members`: `before_member_insert_activate_manual` (BEFORE INSERT), sin trigger de actualización identificado en esa tabla.
- `admin_member_directory`, `admin_pending_membership_requests`, `admin_set_simple_login`, `admin_set_simple_login_service` son `SECURITY DEFINER`; `update_my_profile` es `SECURITY INVOKER`, de ahí los cuatro permisos UPDATE de columna propuestos.
- La migración candidata conserva `service_role` y no modifica políticas RLS ni filas de jugadores. Sigue pendiente la validación de extremo a extremo, especialmente permisos de funciones, alta real y actualización de perfil.

## Pruebas estáticas de permisos de laboratorio

Ejecutadas con `has_column_privilege` y `has_table_privilege` sobre `titanes_security_lab.members`:

| Comprobación | Resultado |
|---|---|
| authenticated UPDATE role | DENEGADO |
| authenticated UPDATE full_name | PERMITIDO |
| authenticated INSERT role | DENEGADO |
| authenticated INSERT full_name | PERMITIDO |
| authenticated UPDATE access_status | DENEGADO |
| authenticated UPDATE phone | PERMITIDO |
| anon INSERT tabla | DENEGADO |
| anon UPDATE tabla | DENEGADO |

Estas son **pruebas de privilegios**, no pruebas funcionales de sesión JWT, RLS, alta real o llamadas a Edge Functions. La migración candidata de producción difiere del laboratorio en INSERT: deliberadamente no concede INSERT a authenticated porque el alta real usa un trigger SECURITY DEFINER. No promover hasta probar ese flujo.

## Pruebas SQL reales con rol authenticated en laboratorio

Se ejecutaron sentencias dentro de `BEGIN; SET LOCAL ROLE authenticated; ...; ROLLBACK;`, con `WHERE false` para no modificar datos. El motor PostgreSQL verificó permisos sobre la sentencia, no solamente metadatos:

- `UPDATE titanes_security_lab.members SET role='admin' WHERE false` -> **ERROR 42501 permission denied** (esperado).
- `UPDATE titanes_security_lab.members SET access_status='activo' WHERE false` -> **ERROR 42501 permission denied** (esperado).
- `UPDATE titanes_security_lab.members SET full_name='Prueba' WHERE false` -> **sentencia aceptada** (esperado; cero filas alteradas).
- `SET LOCAL ROLE authenticated` confirmó `current_user='authenticated'`, sin UPDATE de role y con UPDATE de full_name.

Estas pruebas son negativas/positivas de autorización SQL en el esquema aislado. No son pruebas de RLS con JWT real ni de registro/aprobación mediante Edge Functions. En producción se comprobó adicionalmente con `has_function_privilege` que `anon` y `authenticated` no pueden ejecutar directamente `service_finalize_membership_request(uuid,uuid,uuid)`.

## Pruebas funcionales RLS simuladas en laboratorio (transacciones revertidas)

Usando dos UUID ficticios, `SET LOCAL ROLE authenticated` y `request.jwt.claim.sub` dentro de `BEGIN ... ROLLBACK`:

1. Usuario A consulta filas de A y B: **solo 1 fila visible** (A), esperado.
2. Usuario A intenta modificar `nickname` de B: sentencia aceptada pero **ninguna fila de B visible/actualizable**; la consulta de A conserva nickname nulo. Resultado coherente con RLS (la sentencia no devolvió contador de filas).
3. Usuario A modifica su propio `nickname`: **RETURNING 'edited-own'**, esperado.
4. Usuario A intenta insertar registro con `auth_user_id` de B: **ERROR 42501 por política RLS**, esperado.

No se creó ningún usuario real ni se conservaron filas: todas las transacciones fueron revertidas. Estas pruebas validan un modelo simplificado de RLS, **no** los flujos de registro y aprobación de la aplicación real. El proyecto de laboratorio no tiene Edge Functions desplegadas (`list_edge_functions=[]`), así que no puede ejecutarse aquí una prueba extremo a extremo de esas funciones. No se ha aplicado la migración a producción.

## Triaje de cinco funciones SECURITY DEFINER en producción

Inspección read-only del cuerpo real:
- `admin_add_club_table`: valida `auth.uid()` contra miembro admin activo antes de insertar mesa. **Control presente**.
- `admin_set_club_table_active`: valida admin activo y bloquea desactivación de mesa con partida en curso. **Control presente**.
- `admin_pending_membership_requests`: devuelve solicitudes únicamente si existe miembro admin activo asociado a `auth.uid()`. **Control presente**.
- `add_turn_pair_safe`: valida IDs y delega en `add_turn_pair`; este exige `is_active_club_member()`. **Control presente en función delegada**.
- `correct_score_event_v2`: exige `is_active_club_member()`, y admin para editar partida finalizada; para partidas no finalizadas permite correcciones a cualquier miembro activo, según la regla vigente. **Control presente, revisar regla de negocio**.

Que el Security Advisor marque EXECUTE por `anon` no significa que estas cinco funciones permitan operaciones anónimas: los controles internos revisados requieren identidad o membresía activa. No se ha ejecutado ataque de prueba ni se han inspeccionado las otras funciones señaladas. No retirar EXECUTE indiscriminadamente porque la app invoca algunas RPC directamente.
