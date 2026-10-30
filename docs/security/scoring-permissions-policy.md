# Titanes Dominó — política de puntuación y auditoría (propuesta, sin aplicar)

## Requisito funcional confirmado
Todo miembro autenticado, activo, no suspendido y no eliminado del club puede registrar, corregir y anular puntuaciones de partidas autorizadas, incluso sin administradores presentes. La aplicación no debe restringir estas acciones a administradores.

## Controles obligatorios
- Autorizar en la base de datos, no solamente en la interfaz: verificar auth.uid(), membresía activa y estado de la partida para cada operación.
- Registrar actor, partida, evento original, valores anteriores y nuevos, motivo y fecha en auditoría inmutable para usuarios ordinarios.
- Aplicar validaciones de dominio (tipo de evento, rangos, pertenencia a partida, estado, coherencia de marcador) y evitar duplicados mediante transacciones/idempotencia.
- Permitir que cualquier miembro activo consulte el historial pertinente; reservar la modificación de roles, suspensiones, miembros y configuración a administradores.
- Verificar privilegios EXECUTE de RPC SECURITY DEFINER para anon y authenticated, especialmente correct_score_event_v2, void_score_event, add_score_event; revisar validaciones internas antes de revocar permisos.
- Revisar permisos UPDATE por columna en members; la política RLS de propiedad de fila por sí sola no impide cambios a role/access_status si hay privilegio de columna.
- No ejecutar cambios en producción, datos, puntuaciones, permisos ni publicar sin autorización específica y pruebas en laboratorio.

## Pruebas de aceptación pendientes
1. Miembro activo anota, corrige y anula una puntuación: permitido, con auditoría.
2. Miembro activo desde otro teléfono ve actualización sin reiniciar.
3. Usuario anónimo, suspendido o eliminado intenta modificar puntos: denegado.
4. Miembro activo intenta alterar roles o estados de acceso: denegado.
5. Dos ediciones simultáneas no pierden datos ni duplican puntos.
6. Partida cerrada respeta reglas de edición y trazabilidad definidas por el club.

Estado: especificación preparada; sin implementación ni pruebas ejecutadas.
