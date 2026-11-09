# Validación funcional previa a producción — Titanes Dominó

Fecha: 2026-10-28. Estado: **pendiente de ejecución integral**.

## Evidencia obtenida
- Laboratorio Supabase `ybtdxjqodcjoccyuauzv`: esquema aislado `security_lab`, cuatro funciones **simuladas**, sin datos reales.
- ACL verificadas mediante `has_schema_privilege` y `has_function_privilege`: `anon` denegado y `authenticated` permitido para las cuatro.
- Código productivo inspeccionado en modo lectura: `admin_add_club_table`, `admin_set_club_table_active`, `admin_set_game_start_override` comprueban administrador; `correct_score_event_v2` comprueba miembro activo, y administrador cuando la partida está finalizada.
- **No se han reproducido las dependencias reales de puntuación ni se ha ejecutado una partida de prueba.**

## Casos funcionales por ejecutar con funciones reales y datos sintéticos
1. Anónimo: denegado para las cuatro RPC restringidas.
2. Miembro activo: registra, edita, corrige y anula anotaciones en partida activa; se recalcula el marcador y se registra auditoría.
3. Miembro activo no administrador: denegado para crear/activar/desactivar mesas y cambiar modo de inicio.
4. Administrador activo: operaciones administrativas autorizadas; no se puede desactivar mesa con partida activa.
5. Miembro suspendido: operaciones de puntuación denegadas; miembro con suspensión temporal vencida según la política vigente.
6. Partida finalizada: solo administrador corrige o anula, según implementación vigente; verificar que recálculo no reabre partidas accidentalmente.
7. Revisar permisos directos sobre columnas sensibles de `members` y función `recalculate_game_score` antes de aprobar producción.

## Criterio de liberación
No desplegar la propuesta `proposed-rpc-permissions-hardening.sql` hasta reproducir las RPC reales y sus dependencias, completar casos 1–7 y confirmar reversión y compatibilidad. No usar cuentas ni puntuaciones de producción para pruebas.
