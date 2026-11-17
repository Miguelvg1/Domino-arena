# Titanes Dominó — Android TV (trabajo aislado)
Fecha de revisión: 2026-11-17

## Objetivo
Hacer que Titanes Dominó aparezca como instalable en Google Play para televisores Android TV/Google TV compatibles, sin cambiar la experiencia móvil ni tocar la aplicación oficial.

## Estado verificado
- Aplicación Google Play: `com.titanesdomino.app`.
- Proyecto Capacitor: `appId=com.titanesdomino.app`, `webDir=www`.
- El código web real sí está en la raíz del repositorio: `index.html` y los scripts cargados desde la raíz. La app usa Supabase con una clave publicable y contiene operaciones de escritura para partidas.
- La interfaz web actual no presenta un modo TV y sus scripts no implementan navegación específica para mando D-pad.
- La rama contiene un prototipo TV aislado con datos ficticios y contratos de snapshot. El endpoint real y el backend de lectura autorizada no están configurados.
- El workflow Android TV genera un paquete de prueba separado, `com.titanesdomino.tvtest`, con la interfaz de demostración. No sobrescribe la instalación oficial.
- El APK de demostración superó un smoke test en emulador Android TV API 34: instalación, inicio y navegación D-pad sin cierre fatal. El artefacto de prueba se publicó en GitHub Actions; expiración indicada por GitHub: 24 de noviembre de 2026.
- No se ha generado un APK de TV con la app web real ni un AAB listo para Play. Tampoco está verificada la disponibilidad del listing en Play Console para televisores.

## Riesgos técnicos identificados
- Empaquetar la app móvil completa sin cambios expondría en TV acciones de escritura de partidas y una interfaz no optimizada para D-pad.
- El cliente usa servicios de producción; no se debe probar una APK completa navegando funciones que escriban en partidas reales.
- El visor TV de torneo puede conectarse solo después de disponer de un endpoint de lectura autorizado y datos aislados. No incluir claves de servicio ni permisos de escritura en el cliente de TV.

## Próximas tareas
1. Diseñar una entrada/modo TV de solo lectura, sin botones de anotación o cierre de partidas ordinarias, con foco visible y navegación completa por D-pad.
2. Definir una API de snapshot TV autorizada y aislada. No habilitar lectura anónima ni cambiar RLS de producción para facilitar la prueba.
3. Mantener el paquete de laboratorio con ID distinto al oficial; ejecutar pruebas de foco, arranque, red y resolución en emulador y TV física.
4. Proveer branding final: icono y banner Android TV 320×180 px.
5. Generar AAB de lanzamiento firmado con la cuenta del propietario, revisar catálogo de dispositivos y habilitar factor de forma TV en Play Console tras pruebas.
6. Mantener la app Android móvil disponible; el manifiesto TV debe añadir `LEANBACK_LAUNCHER` y declarar touchscreen opcional sin eliminar `LAUNCHER`.
7. No publicar ni modificar permisos/RLS/producción sin autorización expresa tras pruebas.

## Pendiente Samsung Tizen
Tizen requiere su propio paquete web firmado `.wgt`, pruebas con control remoto y certificado/perfil Samsung. No existe un paquete publicado en Samsung Apps.

## Organización del torneo
El módulo de torneos permanece en segunda etapa. Sus marcadores deben seguir separados de las partidas ordinarias.
