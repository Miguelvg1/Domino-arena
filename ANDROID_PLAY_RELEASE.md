# Titanes Dominó — Android / Google Play

Rama de preparación: `android/play-release-v1`

## Identidad
- Nombre: Titanes Dominó
- Application ID: `com.titanesdomino.app`
- Versión inicial: 1.0.0
- versionCode: 1
- Formato de publicación: Android App Bundle (.aab)

## Firma
Usar Play App Signing. La clave de subida debe mantenerse fuera del repositorio. No almacenar `.jks`, contraseñas ni secretos en Git.

Variables previstas para CI/local:
- TITANES_KEYSTORE_FILE
- TITANES_KEYSTORE_PASSWORD
- TITANES_KEY_ALIAS
- TITANES_KEY_PASSWORD

## Checklist de release
- [ ] Confirmar interfaz Neon V5 como versión aprobada
- [ ] Confirmar URL estable de producción
- [ ] Generar clave de subida RSA >= 2048 bits
- [ ] Compilar bundle Release firmado
- [ ] Validar package/versionCode/target SDK
- [ ] Subir AAB a prueba cerrada de Google Play
- [ ] Completar cualquier advertencia obligatoria de Play Console
- [ ] Añadir verificadores requeridos
- [ ] Iniciar prueba cerrada

## Seguridad
Los archivos `.jks`, `.keystore`, `key.properties` y contraseñas de firma no deben versionarse.
