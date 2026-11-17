# Titanes TV — prototipo multiplataforma (sin producción)
## Vista web
Abrir `tv/index.html` en navegador compatible. La vista muestra **solo datos ficticios**. No hay conexión con Supabase ni anotaciones reales, y no permite editar puntos.

## Samsung Tizen
El paquete Tizen requiere que `config.xml` esté en la raíz del proyecto de Tizen junto con `index.html`, `tv.css`, `tv.js`. La configuración inicial está en `tv/tizen/config.xml`. Abrir como proyecto web de Tizen Studio, revisar identificador de paquete y perfil de certificados de desarrollador, añadir iconos y recursos exigidos, probar en emulador y TV Samsung real, luego generar .wgt firmado. No está publicado en Samsung Apps.

## Android TV / Google TV
El prototipo web se puede reutilizar dentro de una actividad Android TV. El script `scripts/enable_android_tv.cjs` prepara manifiesto y banner provisional después de generar Android con Capacitor; **no se ha integrado aún al workflow ni se ha compilado un AAB TV**.

## Requisitos de lanzamiento
Conectar a API segura de solo lectura y datos de torneo separados; verificar autorización de visualización, reconexión, actualización en vivo, navegación con control, branding, certificados y requisitos de ambas tiendas. No publicar ni fusionar sin pruebas.