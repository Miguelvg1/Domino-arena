# Contrato de marcador para TV — versión 1

Este módulo valida una **instantánea pública de solo lectura**, sin datos privados ni credenciales. Aún no existe endpoint productivo ni conexión a Supabase.

El servidor futuro deberá exponer un endpoint **autorizado** de lectura con JSON:
```json
{"schemaVersion":1,"tournament":"Torneo Los Titanes","updatedAt":"2026-12-13T16:00:00-04:00","matches":[{"table":1,"round":"Semifinal","teamA":"Pareja A","teamB":"Pareja B","scoreA":100,"scoreB":70}],"events":[{"label":"Pareja A · dominada","points":30}],"bracket":["Semifinal","Final"]}
```

Seguridad: el backend debe comprobar autorización de pantalla y limitar acceso por torneo. No enviar datos personales, claves ni tokens al cliente. `validate` descarta campos desconocidos como defensa adicional de presentación, pero **no sustituye** controles del servidor.

Pendiente: persistencia de torneos aislada, RLS, autenticación para TV, publicación del endpoint y sincronización de anotaciones móviles. No afirmar que hay tiempo real hasta completar estas tareas.