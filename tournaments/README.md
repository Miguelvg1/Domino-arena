# Torneos Titanes Dominó · laboratorio

La rama experimental reutiliza el gestor, el motor de eliminatorias, el catálogo de anotaciones y el visor Android TV del prototipo. Se accede desde **Más → Torneos** con una cuenta de Presidencia o directiva de Titanes Laboratorio. La fecha inicial del torneo comunitario es el 13 de diciembre de 2026, en la zona horaria de Santo Domingo.

## Flujo

1. Configurar nombre, fecha, mesas disponibles y reglamento.
2. Elegir un cupo par de 8 a 64 jugadores e inscribir y validar ese total. Se admite el directorio del laboratorio y el registro de invitados.
3. Sortear las parejas y luego los encuentros. El cuadro asigna pases automáticos según el cupo.
4. Disputar cada serie al mejor de tres partidas a 200 puntos. La confirmación de la segunda victoria avanza el cuadro automáticamente. Las semifinales determinan la final y el tercer lugar.
5. Revisar podio, estadísticas individuales, clasificación por parejas y MVP. El average conserva las penalizaciones y el bono acordados en el prototipo. El cálculo de liza distingue la dominada de los puntos especiales.
6. Desde el gestor, conectar el marcador público. En el APK de TV se introduce el código de 16 caracteres. La pantalla pública recibe datos destinados al marcador y eventos audiovisuales.

## Separación y auditoría

- El APK móvil usa `com.titanesdomino.torneoslab` y el de TV usa `com.titanesdomino.tvtest`.
- Los clientes experimentales apuntan a Supabase Titanes Laboratorio. El servicio público de TV es `tournament-tv-sync-lab` y usa únicamente credenciales de ese entorno.
- El historial del torneo registra versiones inmutables, identidad del actor, fecha e identificador de operación. Una versión desactualizada produce un conflicto y requiere recargar antes de seguir. La administración de horarios requiere autorización de Presidencia.
- El estado deportivo se guarda aparte de las partidas habituales. Las anotaciones se validan en el motor del gestor. El servicio de historial valida identidad, revisión y permisos de horario.
- El selector guarda los torneos visitados en el dispositivo. El estado confirmado se recupera del laboratorio al abrir la misma dirección del torneo.
- La rama activa sus propias compilaciones de APK de depuración y pruebas. Las claves de firma de la app oficial quedan fuera de este flujo.

## Validación

```sh
node --test tournaments/*.test.cjs tournaments/shared/*.test.cjs src/*.test.mjs
```

La simulación automatizada usa 32 jugadores y fuerza 16 series de tres partidas. Incluye anulaciones, cómputo de lizas, asignación de finalistas y tercer lugar. La prueba de la base experimental comprueba idempotencia, conflicto entre revisiones y permisos de lectura y escritura. La prueba con cuentas reales y TV física forma parte del ensayo operativo del club.
