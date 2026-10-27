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
