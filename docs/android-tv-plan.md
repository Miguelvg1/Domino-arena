# Titanes Dominó — Android TV (trabajo aislado)
Fecha de preparación: 2026-11-17

## Objetivo
Hacer que Titanes Dominó aparezca como instalable en Google Play para televisores Android TV/Google TV compatibles, sin cambiar la experiencia móvil de anotaciones diarias.

## Estado verificado
- Aplicación Google Play: `com.titanesdomino.app`.
- Proyecto Capacitor: `appId=com.titanesdomino.app`, `webDir=www`.
- En esta rama no se encontró `android/app/src/main/AndroidManifest.xml` ni `android/app/build.gradle`; el proyecto nativo puede generarse durante CI.
- Hay un prototipo TV separado en `prototypes/torneo-tv-demo.html`, solo con datos de demostración.
- No hay APK/AAB Android TV generado ni compatibilidad confirmada por Play Console.

## Requisitos técnicos antes de publicar
1. Inspeccionar el workflow de CI que genera el proyecto Android; determinar versión real del SDK y del manifiesto.
2. Preparar interfaz de TV horizontal, legible a distancia y navegable con mando D-pad (foco visible, sin dependencia táctil).
3. Añadir al manifiesto Android `android.software.leanback` y `android.hardware.touchscreen` con `required=false` cuando corresponda, y actividad launcher TV con categoría `LEANBACK_LAUNCHER` sin eliminar `LAUNCHER` móvil.
4. Proveer banner Android TV 320×180 px y recursos requeridos, y verificar iconos/identidad visual.
5. Implementar vista de solo lectura autenticada y autorizada; jamás incluir claves de servicio ni exponer datos privados. Actualizaciones en vivo con suscripciones seguras.
6. Mantener las tablas y los marcadores de partidas diarias intactos; datos del torneo separados por `tournament_id` y `match_id`.
7. Probar mando a distancia, arranque, reconexión de red, 1080p/4K, ahorro de pantalla, cierre de sesión y comportamiento sin partidas.
8. Compilar y validar AAB firmado, revisar catálogo de dispositivos y requisitos Android TV en Play Console, usar pista de prueba antes de producción.
9. No publicar ni modificar permisos/RLS/producción sin autorización expresa tras pruebas.

## Organización del torneo
- Inscripción de número variable de parejas; sorteo auditable; dos eliminatorias, semifinales (4 parejas), final y partido por tercer lugar.
- Para cantidades no potencia de dos: propuestas de ronda previa o pases automáticos sujetas a aprobación.
- Horarios sugeridos según disponibilidad; solicitudes de cambio y aprobación final por Presidencia.
- Marcadores y anotaciones de torneo independientes de las partidas ordinarias.
- Pantalla TV para seguimiento de encuentros, cuadros, últimas anotaciones, resultados y podio.

## Entrega inmediata
Solo especificación y prototipo en rama aislada. No afirmar que la app ya aparece en Play Store TV.
