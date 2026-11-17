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
- Se conserva una ruta de datos ficticios marcada como demostración. El endpoint `public-live-games-v2` se desplegó solo en el proyecto Supabase de laboratorio y el APK de prueba apunta a esa URL pública.
- La consulta GET al endpoint devolvió HTTP 200 y un snapshot válido con cero partidas activas. OPTIONS devolvió 204 y POST 405. No se añadió ninguna ruta de escritura.
- El visor espera un snapshot HTTPS sanitizado, con revisión del servidor, y consulta cada 10 segundos. No envía cookies ni credenciales desde el televisor.
- El workflow Android TV genera una prueba separada `com.titanesdomino.tvtest`; no sobrescribe la instalación oficial. El smoke test de emulador API 34 validó instalación, inicio y navegación D-pad del prototipo.
- No se ha generado un AAB de TV con partidas reales ni está confirmada la disponibilidad del listing en Play Console para televisores.

## Seguridad de datos
- El feed público debe exponer solo mesa, nombres visibles de pareja, puntajes, meta y estado actual.
- Nunca mostrar ni devolver PIN, teléfonos, chat, perfil, historial o identificadores internos.
- El visor no debe incluir acciones de anotación/corrección/cierre ni conectarse con permiso de escritura.
- Crear y probar el endpoint en el proyecto de laboratorio. No relajar RLS ni hacer cambios a producción para habilitar lectura pública.

## Próximas tareas
1. Registrar una partida de prueba en el proyecto de laboratorio y validar que el endpoint muestra parejas y puntajes correctos y que actualiza la revisión al anotar.
2. Validar desconexión/reconexión, foco y D-pad con el APK actualizado en emulador.
3. Revisar exposición pública y rendimiento del endpoint antes de habilitarlo en producción.
4. Probar en un televisor Android físico; la instalación de la APK deberá ser de prueba y el feed solo mostrará datos públicos.
5. Proveer branding final: icono y banner Android TV 320×180 px.
6. Generar AAB con firma de la cuenta propietaria, comprobar dispositivos compatibles y habilitar el factor de forma TV en Play Console tras las pruebas.
7. Preparar y firmar paquete Tizen `.wgt`, probarlo en TV Samsung real y publicarlo por Samsung Apps tras completar los requisitos de desarrollador.

## Entrega inmediata
El visor read-only está conectado al endpoint del proyecto de laboratorio; la estructura HTTP y rechazo de escrituras se verificaron. El laboratorio aún no tiene partidas activas, por lo que falta comprobar parejas y marcadores con una partida de prueba. No hay despliegue en producción. El módulo de torneos va en segunda etapa.
