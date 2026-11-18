# Sincronización remota de torneos — laboratorio aislado

## Estado
El backend de prueba está desplegado en el proyecto Supabase de laboratorio; no escribe ni lee las tablas de partidas diarias de producción. La app del organizador envía una vista pública del torneo y la TV solo consulta el snapshot por HTTPS.

## Escritura desde el celular
- La función `tournament-tv-sync` valida el token contra la autenticación de la app oficial y consulta el perfil del miembro.
- Solo admite escritura de cuentas activas, no invitadas y con rol `admin` o `directiva`.
- El token se obtiene de la sesión ya iniciada en la app; no se guarda en la URL ni en un archivo del TV.
- Cada publicación valida el snapshot, limita tamaño y campos, registra una operación única y compara la revisión anterior dentro de una transacción.
- Los datos se guardan en `public.tv_tournament_snapshots` y `public.tv_tournament_operations` del proyecto de laboratorio. RLS está activo; los roles `anon` y `authenticated` no tienen permisos de lectura o escritura.

## Lectura de TV
- `GET /functions/v1/tournament-tv-sync/{id}` entrega únicamente mesa, ronda, parejas, puntuación, fotos opcionales, avisos, cuadro, MVP y líder de puntos.
- El identificador aleatorio de 128 bits evita que se encuentren torneos por enumeración. El enlace es público para quien lo reciba, porque está hecho para proyectar datos al público.
- No se envían PIN, teléfonos, historial privado ni funciones de edición a la TV.
- La TV no tiene controles de anotación. Las vistas del torneo actualizan cada cinco segundos y mantienen el último marcador si pierden conexión.

## Pruebas y límite actual
- Las pruebas automáticas del transporte verifican sesión de organizador, GET público sin credenciales y recuperación de conflicto de revisión.
- El paquete queda en rama y en vista previa. Falta comprobar una anotación real entre dos dispositivos con una cuenta de Presidencia/directiva; no se debe declarar validada hasta completar esa prueba.
- La pantalla TV de la vista previa se abre desde el enlace compartible que genera el módulo. El APK de TV que ya probaste todavía muestra el marcador general; no se ha integrado esta ruta de torneo al APK.

## Producción
El módulo no modifica las partidas oficiales. Integrarlo a la aplicación Google Play requiere revisar el PR, probar el flujo completo y publicar una nueva versión. La app de Play Store no cambia por el despliegue de este proyecto de laboratorio.
