# Titanes Dominó — Lizas y clasificación de 30/60 puntos

Estado: especificación para implementación y pruebas; NO desplegar a producción ni modificar el esquema de Supabase sin revisión.

## Regla deportiva confirmada
Una pareja ganadora propina una **liza** cuando la pareja perdedora no ha anotado **ningún punto por dominación** durante la partida, aunque sí haya recibido puntos por multa, paso corrido o salida. Sumar una **liza propinada** a cada uno de los dos jugadores ganadores y una **liza recibida** a cada uno de los dos jugadores perdedores. Ambos contadores se derivan del mismo resultado de partida, sin duplicados. Una partida 200–90 puede ser liza si los 90 puntos perdedores no incluyen dominadas.

## Registro de eventos
Al anotar **30 o 60 puntos**, solicitar un concepto antes de confirmar: dominada, multa, paso corrido o salida; ofrecer salida a dos caritas para 60 puntos. Las opciones visibles deben validarse contra las reglas vigentes y el monto. El concepto es un atributo del evento de puntuación, no del total de equipo. No alterar los valores numéricos ni el flujo de confirmación de victoria a 200.

## Integridad y compatibilidad
- Mantener inmutables los eventos históricos. Si un evento anterior carece de concepto, marcar el cálculo histórico como **indeterminado**; no inferir que fue dominada ni que no lo fue.
- Contar solo eventos efectivos: excluir anulados, usar el concepto actualizado tras corrección y recalcular al cerrar/reabrir partidas.
- No atribuir puntos por dominación a eventos no clasificados ni asumir que cualquier puntuación manual de 1–250 corresponde a dominación.
- Evitar doble conteo por reintentos de cierre, sincronización o reconexión; resultado determinista por ID de partida.
- Mostrar dos cuadros separados, «Lizas propinadas hoy» y «Lizas recibidas hoy», en Datos del jugador del día, con zona horaria de República Dominicana; distinguir datos completos e históricos indeterminados.
- Asegurar que los jugadores de ambos equipos y los eventos pertenecen a la misma partida; preservar reglas de permisos/RLS y validaciones del servidor.

## Pruebas obligatorias
1. 200–0 con eventos completos: liza propinada para ambos ganadores y liza recibida para ambos perdedores.
2. 200–90 con 3 multas/pasos/salidas de 30: liza.
3. 200–30 con dominada perdedora: no liza.
4. 200–60 con dominada perdedora: no liza.
5. 200–60 con salida a dos caritas perdedora: liza.
6. Corrección de multa a dominada: revocar liza.
7. Anulación de dominada: recuperar liza si no hay otras dominadas.
8. Evento legado sin concepto: no adjudicar ni propinada ni recibida automáticamente.
9. Doble cierre, reconexión y concurrencia: no duplicar estadísticas.
10. Partida en curso, empate/incompleta o anulada: no contar liza.

## Despliegue
Implementar y validar primero en laboratorio. No fusionar esta rama ni desplegar cambios de base de datos hasta comprobar paridad de contratos entre cliente, funciones RPC y Supabase y contar con autorización explícita.
