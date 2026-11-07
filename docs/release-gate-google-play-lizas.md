# Puerta de publicación — Titanes Dominó (Google Play)

## Estado
- Rama candidata: `feature/lizas-y-conceptos-30-60`. NO fusionar ni desplegar contra producción antes de la migración y pruebas.
- `index.html` tiene `LIZA_LAB_ENABLED=false` y apunta a producción. **La clasificación de lizas está desactivada por seguridad; no habilitar ni desplegar el cambio sin migración y pruebas.**
- Migración candidata: `sql/lizas_production_migration_candidate.sql`; prueba SQL transaccional en laboratorio con ROLLBACK pasó.
- Auditoría de producción de solo lectura: 864/864 partidas finalizadas conciliadas, 864/864 con 4 jugadores (2+2); 864/864 con anotaciones normales históricas sin concepto. No inventar lizas antiguas.

## Secuencia obligatoria (sin saltar pasos)
1. Confirmar respaldo recuperable de producción (base de datos, autenticación y configuración), fecha y procedimiento de restauración. Verificar permisos, extensiones y firmas RPC. Programar ventana sin partidas activas.
2. Probar con datos representativos y con usuario autenticado real en entorno aislado: añadir 140 dominada, 30 multa, 60 salida a dos caritas, corregir/anular y cerrar a 200; confirmar 1 liza propinada y 1 recibida por jugador correspondiente, sin alterar partidas previas. Probar un caso con dominada del perdedor (NO liza) y un histórico sin concepto (indeterminado).
3. Aplicar migración SQL atómica a producción solamente tras autorización explícita; verificar permisos anon/authenticated y que la clasificación se escribe en la misma transacción de puntuación.
4. Validar interfaz oficial con sesión real y datos de prueba autorizados; comprobar carga en Android, iPhone/PWA, segundo plano, anotación, corrección, rankings y estadísticas. Verificar que no se rompe la puntuación anterior.
5. Generar AAB firmado con `versionCode` superior al publicado y el mismo `applicationId`/firma. Validar instalación/actualización sobre versión existente y Play Console; publicar primero al canal adecuado y monitorizar errores.
6. No prometer publicación hasta que exista AAB verificado y confirmación de Play Console.

## Condiciones de bloqueo
- No existe respaldo restaurable o falla prueba de restauración.
- No se verificó una sesión real, la RPC de clasificación falla, o se alteran marcadores.
- `score_events.concept` no existe en el entorno de destino cuando la interfaz clasificada está activa.
- No hay AAB firmado ni validación de Play Console.

## Plan de contingencia
- Detener despliegue ante errores; conservar app oficial actual. Una vez aplicada la migración, **no revertir a ciegas la columna ni borrar anotaciones**: desactivar la funcionalidad cliente por despliegue controlado, conservar los datos y diagnosticar.
