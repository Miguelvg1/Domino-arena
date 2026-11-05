# Diseño de endurecimiento del recálculo — NO DESPLEGAR SIN PRUEBAS

## Dependencias confirmadas en producción
Cuatro RPC llaman directamente a `public.recalculate_game_score(uuid)`:
- `add_score_event`
- `correct_score_event_v2`
- `edit_score_event`
- `void_score_event`

## Propuesta de implementación
1. Crear una función interna `private.recalculate_game_score_internal(uuid)` con la misma lógica de sumatoria, `SECURITY DEFINER`, `SET search_path = ''`, referencias calificadas y validación explícita del estado de partida antes de actualizar.
2. Cambiar las cuatro RPC autorizadas para invocar la función interna, preservando sus comprobaciones de miembro activo, rol administrativo en partidas finalizadas, bloqueo de filas y auditoría.
3. Restringir el acceso a la función interna y retirar la capacidad de invocar directamente `public.recalculate_game_score` desde clientes, tras verificar todas las dependencias (incluidos triggers, funciones fuera de `public`, trabajos y clientes).
4. Mantener temporalmente una envoltura compatible únicamente si las llamadas existentes lo requieren; esta debe validar autorización y estados.
5. Verificar semántica de `finalizada`: la lógica actual puede pasar a `activa` cuando una corrección baja el marcador de 200 puntos. Acordar regla de negocio antes de modificarla.

## Casos de aceptación
- Jugador activo registra/corrige/edita/anula, el marcador se recalcula, se registra auditoría.
- Jugador no activo o anónimo no puede ejecutar RPC ni recálculo directo.
- Jugador activo no administrador no puede alterar partidas finalizadas; administrador sí, según política vigente.
- No se pueden manipular marcadores de otra partida por invocación directa.
- Transiciones de estado y ganador coherentes con reglas de dominó.
- Sin pérdida de compatibilidad con interfaz web, Android o tareas automáticas.

## Estado
Diseño documentado, **sin cambios de funciones reales** y **sin pruebas funcionales integrales**. No ejecutar en producción.
