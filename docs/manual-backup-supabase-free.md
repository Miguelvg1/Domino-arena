# Respaldo manual obligatorio antes de actualizar Titanes Dominó (Supabase FREE)

**NO ejecutar la migración oficial hasta comprobar un respaldo restaurable.**

Proyecto oficial: `hvpyngkqtqzvmweavego`. El plan gratuito no ofrece respaldos programados. La CLI de Supabase utiliza Docker.

## En Windows (PowerShell)
1. Instalar Docker Desktop y Node.js, y abrir Docker Desktop.
2. En el panel Supabase del proyecto oficial, pulsar **Connect** y obtener la cadena de conexión de la base de datos. No pegar la contraseña ni la cadena en GitHub, ChatGPT, capturas ni mensajes.
3. Crear una carpeta privada fuera del repositorio y ejecutar en PowerShell:

```powershell
New-Item -ItemType Directory -Force -Path "$HOME\\Titanes-Backup-Privado" | Out-Null
Set-Location "$HOME\\Titanes-Backup-Privado"
$env:TITANES_DB_URL = Read-Host 'Pega la cadena de conexión de Supabase (NO compartir)'
npx --yes supabase db dump --db-url "$env:TITANES_DB_URL" --file roles.sql --role-only
npx --yes supabase db dump --db-url "$env:TITANES_DB_URL" --file schema.sql
npx --yes supabase db dump --db-url "$env:TITANES_DB_URL" --file data.sql --use-copy --data-only
Get-Item roles.sql,schema.sql,data.sql | Select-Object Name,Length,LastWriteTime
Remove-Item Env:TITANES_DB_URL
```

**ATENCIÓN:** el comando `Read-Host` anterior muestra la cadena mientras se escribe; ejecutarlo solo en un equipo privado. Evitar historiales, capturas y copias a repositorios. Si la URL contiene caracteres especiales en la contraseña, usar la cadena correctamente codificada.

4. Verificar que los tres archivos no estén vacíos. Conservar una copia cifrada fuera del equipo. Estos archivos contienen datos privados de socios y autenticación; no enviarlos por chat.
5. **Prueba obligatoria:** restaurar los archivos en un proyecto temporal aislado y comprobar las tablas, usuarios y totales de partidas y anotaciones. Los volcados de CLI pueden excluir esquemas internos y los objetos binarios de Storage: revisar también los datos de autenticación y los archivos almacenados antes de considerar el respaldo completo.
6. Registrar fecha, tamaño, resultado de restauración y totales. Solo después autorizar la migración.

## Valores de referencia anteriores al respaldo
- Partidas: 935
- Anotaciones: 6744
- Partidas finalizadas: 864
- Partidas activas en la última comprobación: 0 (valor dinámico)

Documentación oficial: Supabase > Restore a Platform Project to Self-Hosted; Database Backups.
