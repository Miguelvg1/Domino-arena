# Titanes Dominó — TV multiplataforma

## Plataformas objetivo
- Android TV y Google TV: distribución por Google Play, paquete Android con LEANBACK_LAUNCHER, navegación D-pad y banner TV.
- Samsung Smart TV con Tizen: aplicación web empaquetada para Tizen y distribución mediante Samsung Seller Office; no se instala un APK Android ni se publica por Google Play.
- Navegadores de televisores compatibles: acceso a una vista web de solo lectura como alternativa, sujeto a pruebas de navegador.

## Arquitectura
Un único servicio de datos de torneos y una interfaz de TV responsive sin funciones de edición. Clientes Android TV y Tizen reutilizan la interfaz web y emplean sus empaquetados y procesos de certificación respectivos. Autenticación con sesión de visualización limitada; sin secretos en el cliente ni permisos de escritura.

## Funciones
Marcadores y anotaciones en vivo, múltiples mesas, enfrentamientos, fases eliminatorias, horarios aprobados, clasificaciones y podio. Los datos de torneo permanecen separados de las partidas cotidianas.

## Plan de validación
1. Completar módulo de torneo y API segura.
2. Probar vista TV en navegadores y con control remoto.
3. Generar y probar AAB Android TV, validar catálogo Play Console.
4. Generar paquete Tizen (.wgt) con Tizen Studio, probar en simulador y Samsung TV real; revisar requisitos de Samsung Seller Office.
5. Validar reconexión, sincronización y rendimiento en pantallas grandes.
6. Publicar únicamente tras autorización y pruebas. No modificar producción durante desarrollo.

## Estado
Plan inicial, sin paquete Tizen ni AAB TV compilado, sin publicación ni certificación confirmada.
