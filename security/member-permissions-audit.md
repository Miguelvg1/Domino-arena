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
