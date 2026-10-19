# Laboratorio aislado — validación del nivel 1

Proyecto de pruebas Supabase: `ybtdxjqodcjoccyuauzv`. **No usar producción.**

## Estado verificado
- Rama de laboratorio configurada para usar la URL y clave publicable del laboratorio.
- En `index.html` no figura la URL de Supabase de producción.
- RLS habilitada en `lab.players`, `lab.games` y `lab.score_events`.
- Pruebas SQL transaccionales de atribución a equipo, suma de puntos y rechazo de anotaciones en partidas finalizadas: satisfactorias.
- PR #19 de corrección de jugador: aún no integrado en producción.

## Bloqueadores para prueba extremo a extremo
- La app consulta tablas `public.members`, `public.games`, `public.game_players`, `public.score_events`, `public.club_tables` y funciones como `public.add_score_event`; el laboratorio solo tiene un arnés mínimo en el esquema `lab`.
- No hay usuarios de prueba autenticados ni políticas de acceso a un esquema compatible.
- La función `lab.register_score` no reproduce la implementación real de `public.add_score_event`.
- No publicar la rama de laboratorio como si fuera una versión funcional de Titanes.

## Prueba funcional obligatoria
1. Iniciar sesión con usuario ficticio autorizado.
2. Crear partida ficticia Largos 185 / Cortos 130.
3. Seleccionar por error Juan (Largos) y anotar 25.
4. Pulsar «CORREGIR ANOTACIÓN»; comprobar que no se ha enviado ningún RPC, el equipo cambia a Cortos, los 25 puntos se conservan y la selección de jugador queda vacía.
5. Intentar registrar sin elegir jugador: debe rechazarse.
6. Elegir Carlos (Cortos) y registrar; verificar Largos 185 / Cortos 155, partida activa y exactamente un evento atribuido a Carlos.
7. Probar multas/chivo/pase con ficha y validación del responsable.
8. Comprobar estadísticas, rankings, auditoría, autenticación y RLS sin datos reales.
9. Solo entonces considerar la integración de PR #19, con aprobación del usuario.

**Este documento es un plan de validación; no certifica pruebas de interfaz realizadas.**
