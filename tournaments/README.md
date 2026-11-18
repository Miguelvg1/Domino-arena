# Titanes Dominó — módulo de torneos (aislado)

## Novedades adaptadas desde la app
- Identificación por pareja y encuentro, anotación manual de 1 a 250 puntos y puntos fijos con causa: dominada, multa, capicúa, paso corrido, salida doble, dos caritas, chivo y pase con ficha.
- Los tipos fijos tienen sus valores de la app: +30, +60 o +100. Se registra la causa y el anotador de laboratorio.
- Al llegar a 200, se avisa y el organizador debe confirmar el cierre.
- Cada anotación conserva historial. Para corregir una, se exige motivo; no se borra el registro anterior.
- La pantalla móvil conserva controles de torneo. La vista de TV solo muestra las partidas del torneo, puntajes, cuadro y avisos de anotación; no tiene botones para anotar o corregir.
- Cada anotación genera un aviso de “Liza actualizada” en la TV con pareja, causa y nuevo marcador. Al activar **Voz** con el control remoto, el navegador lee exactamente el texto del aviso en español. La voz depende de que el televisor ofrezca síntesis de voz.

## Estado de desarrollo
- `tournament-engine.js`: parejas, sorteos, cuadros, resultados y horarios sujetos a aprobación.
- `scoring.js`: historial por identificador de encuentro, reglas fijas de puntos, correcciones auditadas y cierre a 200.
- `mobile/`: prototipo local, sin sincronización ni autenticación real.
- `shared/`: vista local y transporte remoto con idempotencia y control de revisión. La vista de TV consulta un endpoint público de solo lectura.
- `tv-preview/`: pantalla de torneo en solo lectura, con cuadrícula dinámica para todos los encuentros del snapshot.

## Aislamiento obligatorio
El prototipo no consulta ni modifica tablas de partidas diarias, estadísticas oficiales o permisos de producción. La puntuación de torneo está separada. Para la integración real hacen falta tablas de torneo, RLS, roles, transacciones, auditoría, idempotencia y concurrencia. El marcador de TV nunca recibe permisos de escritura.

## Pendientes
Persistencia segura, sincronización remota autorizada, aprobación del organizador para pases/horarios, pruebas en dispositivos y publicación. Los scripts de laboratorio no sustituyen pruebas en dispositivos.
