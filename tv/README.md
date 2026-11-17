# Titanes TV — marcador público de partidas

La vista del televisor es **solo de lectura**: muestra las partidas activas, nombres públicos de las parejas, puntos y cuál pareja va delante. No permite anotar, corregir o cerrar partidas; tampoco muestra chat, teléfonos, PIN, estadísticas privadas ni datos de administración.

## Vista de prueba
Abrir `tv/index.html` en un navegador compatible. Sin configurar un endpoint se muestran **datos ficticios**, rotulados como demostración. Esos datos no vienen de Titanes Dominó.

## Contrato para el feed público
El visor consulta una URL HTTPS configurada durante el empaquetado con `window.TITANES_TV_CONFIG.snapshotUrl`. Hace una petición GET sin cookies ni credenciales cada 10 segundos. Solo acepta partidas activas y los campos aprobados: mesa, nombres visibles de parejas, marcador, meta y estado. No procesa ni envía escrituras.

El endpoint `public-live-games-v3` está desplegado **solo en el proyecto de laboratorio**. La función filtra los datos y el APK usa ese enlace de laboratorio. No se ha desplegado el feed en producción. La ruta devuelve una revisión del snapshot y un máximo de 24 partidas activas.

## Prueba del laboratorio
El laboratorio tiene una partida ficticia para probar el mapeo:
- Mesa: `TV LAB DEMO`
- Parejas: `TV Azul 1 / TV Azul 2` y `TV Rojo 1 / TV Rojo 2`
- Marcador: `120–80`, meta de 200

Verificación real del endpoint: GET `200`, OPTIONS `204`, POST `405`. La respuesta incluyó solo los campos públicos esperados. La compilación Android TV y el smoke test de instalación, apertura y botones D-pad terminaron correctamente en GitHub Actions, run [44168770565](https://github.com/Miguelvg1/Domino-arena/actions/runs/44168770565). El APK es `com.titanesdomino.tvtest`, separado de la app oficial; el artefacto vence el 24 de noviembre de 2026.

## Pendiente antes de uso público
- Probar que el marcador cambia tras anotar puntos y que el televisor se recupera al perder y recuperar conexión.
- Revisar límites de uso y exposición del feed antes de conectarlo a partidas reales.
- Probar la APK en un Android TV físico. El emulador no sustituye esa prueba ni valida un televisor real.
- Preparar AAB firmado y configurar la ficha/factor de forma de TV en Google Play con la cuenta propietaria.

## Samsung Tizen
La pantalla web puede reutilizarse, pero falta empaquetarla y firmarla como `.wgt`, probarla en el emulador y en un televisor Samsung, y completar el perfil/certificados de desarrollador. No está publicada en Samsung Apps.
