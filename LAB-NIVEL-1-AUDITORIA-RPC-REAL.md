# Nivel 1 — auditoría del backend real (20 octubre 2026)

Inspección **solo lectura** de las definiciones vigentes en Supabase producción, sin consultar partidas individuales ni modificar registros.

## Funciones verificadas

- `add_score_event`: exige miembro activo y partida activa; verifica jugador acreditado y su equipo; valida responsable contrario para multa, chivo y pase con ficha; crea evento y auditoría; llama `recalculate_game_score`.
- `recalculate_game_score`: **no suma al marcador previo**. Calcula `sum(points)` de **todos** los eventos no anulados por equipo; actualiza `games.largos_score`, `games.cortos_score`, `status`, `winner`, `finished_at`. Victoria a partir de 200.
- `expected_event_points`: multa 30, capicúa 30, paso corrido 30, paso salida doble 30, dos carotas 60, chivo 100, pase con ficha 100.
- `is_active_club_member`: valida miembro no eliminado, activo, o suspensión temporal/momentánea ya vencida.

## Implicación crítica para el laboratorio

Los fixtures existentes crean partidas con marcador inicial 185–130 **sin eventos históricos correspondientes**. Es válido para el test de función simulada, pero **no para probar la función real de recálculo**: al registrar +25 para Cortos, la función real produciría 0–25 si no hay eventos anteriores. La nueva réplica debe sembrar eventos que sumen 185 y 130, y luego comprobar 185–155. Para victoria, sembrar 190–150 en eventos y añadir 15.

## Próximo criterio de aceptación

Crear prueba aislada que replique `score_events`, `score_event_audit`, la validación de jugador/equipo y el recálculo por sumatoria de eventos. Comprobar rechazo de usuario inactivo, de jugador contrario, cancelación, ausencia de duplicados y finalización. No publicar PR19 hasta pasar esa prueba y verificar el flujo UI.
