# Titanes Dominó — Android TV (trabajo aislado)
Fecha de revisión: 2026-11-17

## Objetivo
Preparar una aplicación independiente para Android TV/Google TV que permita al público seguir partidas en curso. El televisor es un visor de solo lectura: muestra mesa, parejas, puntos y pareja líder. El módulo de torneos queda para una segunda etapa.

## Estado verificado
- La aplicación móvil de Google Play usa `com.titanesdomino.app`; su código incluye funciones de anotación y administración.
- El visor de TV vive en `tv/` y se empaqueta aparte como `com.titanesdomino.tvtest`. No reemplaza ni modifica la instalación oficial.
- La pantalla muestra partidas activas, parejas, marcador, líder, meta y estado de conexión. No incluye controles para anotar, corregir, cerrar partidas ni chatear.
- El televisor consulta una URL HTTPS cada 10 segundos, sin cookies ni credenciales. Solo lee una lista de campos públicos aprobados.
- El endpoint `public-live-games-v3` y los datos de prueba están solo en el proyecto Supabase de laboratorio. No hay cambios ni despliegue en producción.
- Partida ficticia de laboratorio: `TV LAB DEMO`, parejas `TV Azul 1 / TV Azul 2` y `TV Rojo 1 / TV Rojo 2`, marcador `120–80`, meta 200.
- Pruebas reales del endpoint: GET 200 con parejas y puntos correctos; OPTIONS 204; POST 405; respuesta con solo campos públicos.
- GitHub Actions run [44168770565](https://github.com/Miguelvg1/Domino-arena/actions/runs/44168770565) terminó correctamente: validación del snapshot, compilación APK, instalación e inicio en emulador Android TV y navegación D-pad. Artefacto `titanes-android-tv-debug-for-testing`, ID `14367775311`, vence el 24/11/2026.
- Esto valida el prototipo en emulador; todavía no valida una TV física ni el funcionamiento del feed con anotaciones en tiempo real.
- Aún no se ha generado un AAB firmado ni confirmado la disponibilidad de la ficha de TV en Play Console.

## Seguridad de datos
- Publicar únicamente mesa, nombres visibles de las parejas, puntos, meta y estado.
- No exponer PIN, teléfonos, chat, perfiles privados, historial ni identificadores internos.
- No abrir permisos de escritura para el televisor.
- Probar primero en laboratorio. No relajar RLS ni desplegar en producción para habilitar la prueba.

## Próximos pasos
1. Probar aumento de puntos y actualización de revisión; probar desconexión y reconexión.
2. Instalar el APK de prueba en un Android TV físico y revisar tamaño de texto, foco y D-pad.
3. Revisar límites de consultas y autorización de uso público del feed antes de conectarlo a partidas reales.
4. Preparar branding final, AAB firmado con la cuenta propietaria y ficha/factor de forma Android TV en Play Console.
5. Reutilizar la vista web para preparar el paquete Samsung Tizen `.wgt`; hacen falta entorno y certificado de desarrollador, emulador y TV Samsung físicos para validar y publicar.

## Límite de la entrega
No se ha publicado en Google Play ni Samsung Apps, no se ha conectado a partidas oficiales y no se ha probado en televisores físicos. La aplicación oficial permanece separada. La etapa de torneos se hará después del visor.
