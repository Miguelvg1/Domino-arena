# Sincronización remota de torneos — contrato seguro (pendiente de backend)

## Estado
Cliente de lectura remota creado, sin conexión a base de datos ni despliegue. La base de datos del laboratorio rechazó autenticación durante la inspección (28P01); no se modificó producción.

## Lectura TV
El backend deberá ofrecer una lectura autorizada de un **snapshot público** por identificador de torneo. Respuesta:
```json
{"revision":42,"snapshot":{"schemaVersion":1,"tournament":"Torneo Titanes","updatedAt":"2026-12-13T17:00:00-04:00","matches":[],"events":[],"bracket":[]}}
```
`revision` es entero creciente generado **en el servidor**, no fecha del dispositivo. La TV solo lee; no recibe credenciales administrativas, cédulas, PIN, historial privado ni tokens de servicio. El servidor valida el permiso de visualización y filtra datos.

## Escritura móvil
Cada anotación, anulación o cierre requiere identidad autenticada, autorización de rol por torneo, identificador único de operación (idempotencia), transacción y control de concurrencia. La operación genera una nueva revisión del snapshot en la misma transacción. No se permiten escrituras directas de la TV. No confiar en `actor` enviado por JavaScript.

## Actualización
Preferir suscripción a cambios del snapshot público con RLS, más lectura inicial y refresco de respaldo. Reconexión vuelve a leer la revisión más reciente. La implementación `remote-tv-client.js` ya gestiona revisiones monotónicas y refresco periódico, pero todavía necesita un adaptador de backend real.

## Aislamiento
Crear tablas específicas de torneos en laboratorio primero, sin alterar tablas de partidas ordinarias ni vistas oficiales. Auditar RLS y permisos antes de activar Realtime. No habilitar lectura anónima por defecto.

## Visor remoto (implementado solo en frontend)
La página `tournaments/tv-preview/index.html` admite `?endpoint=/api/tournaments/ID/snapshot`. Por seguridad acepta exclusivamente HTTPS, el mismo origen web y rutas que empiecen con `/api/tournaments/`, sin parámetros ni credenciales en la URL del endpoint. Solicita el snapshot cada 10 segundos, con límite de espera de 8 segundos, y conserva el último marcador cuando falla la red. Sin parámetro `endpoint` mantiene la demostración local entre pestañas. **La ruta API todavía no existe**: el parámetro no activa la sincronización hasta desplegar el backend protegido.
