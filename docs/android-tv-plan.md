# Titanes Dominó — Android TV (trabajo aislado)
Fecha de revisión: 2026-11-17

## Objetivo
Hacer que Titanes Dominó pueda instalarse en Android TV/Google TV y ofrecer una pantalla pública para seguir partidas en curso. El televisor es un visor de solo lectura: muestra parejas, mesa, puntos y líder de cada partida.

## Estado verificado
- Aplicación Google Play: `com.titanesdomino.app`.
- Proyecto Capacitor: `appId=com.titanesdomino.app`, `webDir=www`.
- El código web real está en la raíz del repositorio: `index.html` y sus scripts. Usa Supabase con una clave publicable y contiene operaciones de anotación, corrección y cierre.
- La interfaz móvil no cuenta con una experiencia de TV ni navegación D-pad completa.
- Se preparó un visor TV independiente, sin credenciales ni escrituras. Ahora muestra una pantalla de partidas activas, parejas, marcadores, líder, meta y estado de demostración.
- Se conserva una ruta de datos ficticios marcada como demostración. No existe todavía un endpoint conectado a partidas reales.
- El visor espera un snapshot HTTPS sanitizado, con revisión creciente del servidor, y consulta cada 10 segundos. Debe empaquetarse la URL del endpoint; no se envían credenciales desde el televisor.
- El workflow Android TV genera una prueba separada `com.titanesdomino.tvtest`; no sobrescribe la instalación oficial. El smoke test de emulador API 34 validó instalación, inicio y navegación D-pad del prototipo.
- No se ha generado un AAB de TV con partidas reales ni está confirmada la disponibilidad del listing en Play Console para televisores.

## Seguridad de datos
- El feed público debe exponer solo mesa, nombres visibles de pareja, puntajes, meta y estado actual.
- Nunca mostrar ni devolver PIN, teléfonos, chat, perfil, historial o identificadores internos.
- El visor no debe incluir acciones de anotación/corrección/cierre ni conectarse con permiso de escritura.
- Crear y probar el endpoint en el proyecto de laboratorio. No relajar RLS ni hacer cambios a producción para habilitar lectura pública.

## Próximas tareas
1. Revisar las políticas y la estructura del proyecto de laboratorio para `live_games_feed`, `games` y `game_players`.
2. Implementar una función/endpoint de snapshot de solo lectura y de campos permitidos; validar que la revisión cambia con cada anotación.
3. Configurar ese endpoint en el paquete de prueba y validar datos, refresco, desconexión/reconexión y D-pad en emulador.
4. Probar en un televisor Android físico; la instalación de la APK deberá ser de prueba y el feed solo mostrará datos públicos.
5. Proveer branding final: icono y banner Android TV 320×180 px.
6. Generar AAB con firma de la cuenta propietaria, comprobar dispositivos compatibles y habilitar el factor de forma TV en Play Console tras las pruebas.
7. Preparar y firmar paquete Tizen `.wgt`, probarlo en TV Samsung real y publicarlo por Samsung Apps tras completar los requisitos de desarrollador.

## Entrega inmediata
El visor read-only está implementado con datos de demostración y cliente preparado para el contrato HTTPS. La conexión real al feed, validación de políticas de laboratorio, prueba en televisor físico y publicación siguen pendientes. El módulo de torneos va en segunda etapa.
