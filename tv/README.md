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

El endpoint `public-live-games` está desplegado en el proyecto de laboratorio y lee `live_games_feed` más `game_players`/`members`. El archivo `tv/config.js` apunta solo a ese proyecto; no se ha desplegado en producción. La consulta GET probada devolvió un snapshot válido con cero mesas activas en el laboratorio. Debe publicar únicamente mesa, nombres visibles, marcador, meta y estado. No devolver IDs internos, perfiles, teléfonos, PIN, chat, credenciales ni historial. El cliente descarta campos no utilizados y nunca envía escrituras. El servidor debe ser de solo lectura y responder solo con la lista pública aprobada.

## Pendiente antes de mostrar partidas reales
- Probar el endpoint con una partida activa de laboratorio para validar los nombres de las parejas y los puntajes; actualmente el proyecto de prueba no tiene partidas activas.
- Revisar la exposición pública del endpoint antes de cualquier uso generalizado; el cliente solo hace GET y el servidor filtra campos.
- El smoke test de endpoint confirmó GET 200, OPTIONS 204 y POST 405. Aún falta probar el cambio de revisión al anotar puntos y el refresco ante desconexión/reconexión.
- Probar con un Android TV físico. La verificación de emulador prueba el paquete de demostración, no la conexión con partidas reales.

## Samsung Tizen
Se reutiliza la vista web, pero Tizen requiere proyecto empaquetado y firmado como `.wgt`, pruebas con emulador y televisor Samsung real, y perfil/certificados de desarrollador. No está publicado en Samsung Apps.
