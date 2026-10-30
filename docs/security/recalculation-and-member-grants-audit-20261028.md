# Hallazgos de seguridad — recálculo y perfil (2026-10-28)

## Evidencia de producción, solo lectura
- `public.recalculate_game_score(uuid)` es `SECURITY DEFINER` y ejecutable por `authenticated`, no por `anon`.
- Su implementación no valida `auth.uid()` ni `is_active_club_member()`; suma eventos no anulados y actualiza `games.largos_score`, `cortos_score`, `status`, `winner`, `finished_at`.
- En `members`, `has_column_privilege('authenticated', ..., 'UPDATE')` dio **false** para `role`, `active`, `access_status`, `auth_user_id` y `deleted_at`.
- No se han ejecutado llamadas que modifiquen partidas o miembros.

## Riesgo y plan
1. Riesgo: recálculo directo de partidas ajenas o en estados no previstos, con alteración del estado derivado; no permite introducir puntos arbitrarios.
2. **No revocar inmediatamente** `EXECUTE` a `authenticated`: las RPC de puntuación lo invocan y podrían depender del permiso actual.
3. Preparar una refactorización probada: función interna de recálculo en esquema no expuesto, privilegios mínimos, llamadas desde RPC autorizadas, validación de estados, pruebas de transición `activa/finalizada`.
4. Conservar anotación, edición y anulación por miembros activos; partidas finalizadas mantienen regla administrativa vigente salvo decisión explícita.
5. Ejecutar pruebas con datos sintéticos y cuentas con roles diferentes en laboratorio antes de aplicar cambios en producción.

## Estado
**Hallazgo confirmado; corrección aún no implementada ni probada.**
