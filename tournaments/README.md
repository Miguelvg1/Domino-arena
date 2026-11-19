# Titanes Dominó — módulo de torneos (rama de pruebas)

## Funciones preparadas
- Inscripción de jugadores con foto, sorteo de parejas y enfrentamientos, rondas, final y tercer lugar.
- Puntuación adaptada a Titanes, correcciones con motivo e historial, y cierre confirmado a 200.
- MVP y líder individual de puntos con average basado en Titanes v2.
- Chivo y pase con ficha: 100 puntos para la pareja contraria y factor 0.90 al average del responsable. La multa aplica factor 0.97.
- Pantalla pública con todas las mesas activas, nombres, fotos, puntajes, parejas líderes, cuadro de eliminatorias y avisos visuales/con voz.

## Sincronización y TV
- El gestor toma la sesión de la app oficial y la función valida que sea un miembro activo de Presidencia o directiva.
- Los datos de torneo se guardan en tablas separadas del proyecto Supabase de laboratorio; no se leen ni se escriben partidas oficiales.
- RLS está activo y los clientes no tienen acceso directo a las tablas. La TV consulta solamente el snapshot público y no puede anotar.
- El APK candidato Android TV incluye una pantalla para escribir un código de torneo de 16 caracteres con el control remoto y abrir el visor local de solo lectura.
- El código y el enlace se generan desde el gestor móvil. La TV actualiza el marcador cada cinco segundos.

## Estado real
El endpoint de laboratorio está desplegado. GET desconocido devuelve 404, PUT sin sesión devuelve 401, POST devuelve 405 y OPTIONS 204. Las tablas están vacías. El PR permanece en borrador; la app de Google Play no cambió.

La compilación del APK de torneo y el emulador D-pad están en GitHub Actions. Falta validar una publicación con la cuenta de Presidencia/directiva desde otro dispositivo y probar el APK en la TV física.

## Pendientes de producto
Probar el torneo completo con datos ficticios, validar la reproducción de voz en el televisor, revisar la fórmula con el club, añadir las novedades de IA en una etapa posterior y completar revisión antes de integrar/publicar.
