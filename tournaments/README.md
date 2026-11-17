# Titanes Dominó — módulo de torneos (aislado)

## Estado de desarrollo
- `tournament-engine.js`: parejas, sorteos, cuadros, resultados y horarios sujetos a aprobación.
- `scoring.js`: historial de anotaciones por **identificador de encuentro de torneo**, correcciones con motivo y responsable, cierre confirmado al alcanzar 200.
- `mobile/`: prototipo de interfaz móvil con datos en memoria, sin sincronización ni autenticación real.
- `shared/`: contrato de datos de visualización de TV, todavía sin endpoint real.

## Aislamiento obligatorio
Estos archivos no consultan ni modifican tablas de partidas diarias, estadísticas oficiales o permisos de producción. Para la integración definitiva deben crearse tablas separadas, RLS, autorización por roles, transacciones de puntuación, registro auditable y pruebas de concurrencia. Nunca confiar solo en validaciones JavaScript del cliente.

## Pendientes
Corregir cuadro con pases automáticos y número variable de parejas, vincular el historial de anotaciones al módulo móvil, persistencia segura, sincronización, pruebas completas, publicación y aceptación del organizador. Los scripts de prueba no sustituyen pruebas en dispositivos.