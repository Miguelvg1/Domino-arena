# Plantilla maestra Android + Google Play

Esta plantilla evita repetir la configuración técnica de compilación y firma en cada aplicación nueva basada en Capacitor.

## Qué ya queda resuelto

- Compilación Android AAB desde GitHub Actions.
- Android API configurable (por defecto API 36).
- Java y Node configurados.
- Firma del AAB con una clave de subida guardada como GitHub Secrets.
- Verificación opcional del SHA1 de la clave de subida antes de compilar.
- VersionCode y VersionName configurables por cada app.
- AAB final disponible como artefacto descargable.
- No se guarda ninguna contraseña ni archivo JKS en el repositorio.

## Archivos que necesita cada nueva app

1. `package.json` con Capacitor instalado.
2. `capacitor.config.json` usando como base `capacitor.config.json.example`.
3. Un workflow de compilación en `.github/workflows/build-android-aab.yml`, copiando `caller-workflow.yml.example`.
4. Los archivos web de la aplicación.

## Secretos que se agregan una sola vez por repositorio

En GitHub: Settings > Secrets and variables > Actions.

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_PASSWORD`

La clave JKS nunca debe subirse al repositorio.

## Datos que cambian para cada app

En el workflow de cada aplicación:

- `app_name`
- `version_code`
- `version_name`
- `key_alias`
- `expected_sha1`
- `artifact_name`
- `aab_filename`
- `android_api` cuando Google cambie el requisito mínimo.

En `capacitor.config.json`:

- `appId`, por ejemplo `com.miguelvg1.miapp`
- `appName`

## Publicar una app nueva

1. Crear el nuevo repositorio y colocar el código de la app.
2. Copiar el ejemplo de `capacitor.config.json` y cambiar nombre e ID del paquete.
3. Copiar el workflow de ejemplo y cambiar nombre, versión y alias.
4. Agregar los tres secretos de firma en GitHub.
5. Ejecutar el workflow manualmente desde Actions.
6. Descargar el AAB generado.
7. Crear la app en Google Play Console y subir el AAB.
8. Completar los requisitos administrativos de Play Console (ficha, declaraciones, pruebas, etc.).

## Actualizar una app existente

Para una actualización normal no se vuelve a configurar todo. Solo se cambia:

- `version_code`: siempre debe aumentar.
- `version_name`: la versión visible, por ejemplo 1.0.1 a 1.0.2.
- `aab_filename`: para que el archivo quede claramente identificado.

Después se vuelve a ejecutar el workflow y se descarga el nuevo AAB.

## Recomendación sobre claves

Para cada aplicación se recomienda conservar de forma segura:

- el archivo JKS original;
- la contraseña del keystore;
- la contraseña de la clave;
- el alias;
- el certificado PEM público;
- el SHA1 de la clave de subida.

Google Play App Signing protege la clave de firma de distribución, pero la clave de subida sigue siendo responsabilidad del desarrollador.
