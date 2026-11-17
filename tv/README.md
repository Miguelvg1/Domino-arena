# Titanes TV — marcador público de partidas

La vista del televisor es **solo de lectura**: muestra las partidas activas, nombres públicos de las parejas, puntos y cuál pareja va delante. No permite anotar, corregir o cerrar partidas; tampoco muestra chat, teléfonos, PIN, estadísticas privadas ni datos de administración.

## Vista de prueba
Abrir `tv/index.html` en un navegador compatible. Sin configurar un endpoint se muestran **datos ficticios**, rotulados como demostración. Esos datos no vienen de Titanes Dominó.

## Contrato para el feed público
El visor consulta una URL HTTPS configurada durante el empaquetado con `window.TITANES_TV_CONFIG.snapshotUrl`. Hace una petición GET sin cookies ni credenciales cada 10 segundos. La respuesta esperada es:
```json
{
  "revision": 1,
  "snapshot": {
    "schemaVersion": 1,
    "updatedAt": "2026-11-17T16:00:00-04:00",
    "matches": [
      {
        "table": 1,
        "tableName": "Mesa 1",
        "teamA": "Pareja A",
        "teamB": "Pareja B",
        "scoreA": 165,
        "scoreB": 130,
        "target": 200,
        "status": "activa"
      }
    ]
  }
}
```

El backend debe construir la respuesta usando las partidas activas, con el feed `live_games_feed` y los datos de jugadores/equipos necesarios. Debe publicar únicamente mesa, nombres visibles, marcador, meta y estado. No devolver IDs internos, perfiles, teléfonos, PIN, chat, credenciales ni historial. El cliente descarta campos no utilizados y nunca envía escrituras. El servidor debe ser de solo lectura y responder solo con la lista pública aprobada.

## Pendiente antes de mostrar partidas reales
- Crear y revisar el endpoint público de snapshot en el proyecto de laboratorio.
- Comprobar qué políticas permiten leer `live_games_feed` y `game_players`; no relajar políticas de producción.
- Configurar la URL del endpoint en el paquete de prueba.
- Verificar que la revisión del servidor aumenta cuando cambian los puntos, y validar el refresco, desconexión y reconexión.
- Probar con un Android TV físico. La verificación de emulador prueba el paquete de demostración, no la conexión con partidas reales.

## Samsung Tizen
Se reutiliza la vista web, pero Tizen requiere proyecto empaquetado y firmado como `.wgt`, pruebas con emulador y televisor Samsung real, y perfil/certificados de desarrollador. No está publicado en Samsung Apps.
