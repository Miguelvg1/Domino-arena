# Nivel 1 — aceptación final antes de publicar PR #19

Fecha: 2026-10-20.

## Evidencia automatizada aprobada
- Función real `add_score_event` y sus dependencias inspeccionadas en producción mediante consultas de solo lectura.
- Frontend: selección obligatoria del jugador después de pulsar «Corregir», sin anotación automática.
- PostgreSQL aislado: anotación correcta 185–155; historial sin duplicados; victoria 205–150; bloqueo posterior.
- PostgreSQL aislado: cálculo de marcadores a partir de eventos históricos y auditoría.
- PostgreSQL aislado: políticas RLS simuladas para miembros activos, pendientes y eliminados.
- Ejecución de CI: https://github.com/Miguelvg1/Domino-arena/actions/runs/39450880545

## Alcance NO cubierto
- No existe todavía un usuario ficticio autenticado con **Supabase Auth** en el proyecto de laboratorio.
- Las tablas aisladas existentes están en esquema `lab`, no son el esquema `public` de la aplicación; no se ha probado la RPC real mediante PostgREST con JWT.
- No se ha probado la UI completa en un navegador autenticado contra un backend réplica.
- Las políticas de RLS del laboratorio son simulaciones; no equivalen a las de producción.

## Plan de cierre
1. Provisionar esquema compatible en el Supabase de laboratorio, con migraciones controladas y **sin datos reales**.
2. Crear identidad de prueba mediante **Supabase Auth** (no manipular `auth.users` por SQL), configurar permisos de prueba.
3. Ejecutar en navegador: 185–130 → +25 Largos → «Corregir» → seleccionar jugador Cortos → registrar → 185–155; cancelar sin efectos; +15 Largos desde 190 → victoria; intento post-victoria rechazado.
4. Verificar `score_events`, `score_event_audit`, marcador y permisos de la identidad.
5. Confirmar integridad y ausencia de cambios en producción; solo después integrar PR #19 y comprobar despliegue Vercel con autorización expresa.

## Decisión de liberación
**NO APTO PARA PUBLICACIÓN AUTOMÁTICA** hasta completar la prueba Auth + PostgREST + UI; los resultados aislados son positivos, pero no sustituyen la validación extremo a extremo.
