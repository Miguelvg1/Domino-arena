# Titanes Dominó — servidor experimental para TV

Este servicio es **independiente** de la aplicación oficial. Las pantallas de Android TV, Google TV y Samsung TV solo leen marcadores.

## Configuración del servidor

Ejecutar en un servidor Node.js 22 con acceso de red a PostgreSQL (no ejecutar este código en el televisor):

```sh
cd tournaments/lab
npm install --ignore-scripts
DATABASE_URL='postgresql://...' LAB_EDITOR_TOKEN='...' LAB_VIEWER_TOKEN='...' npm start
```

**No subir secretos a GitHub.** Configurar `DATABASE_URL`, `LAB_EDITOR_TOKEN` y `LAB_VIEWER_TOKEN` como variables secretas del proveedor de alojamiento. Usar dos tokens largos, aleatorios y diferentes. El token de escritura solo debe entregarse a un backend confiable; nunca incrustarlo en el código público de la app móvil. Para acceso desde celulares, reemplazar el token compartido de laboratorio por autenticación individual y autorización de torneos antes de producción.

La conexión PostgreSQL debe utilizar un usuario con permisos limitados exclusivamente a `titanes_tv_lab.snapshots` y `titanes_tv_lab.operations`. **No usar** credenciales de la base de datos oficial ni exponer el usuario administrador `postgres` a clientes.

`server.cjs` escucha en `127.0.0.1` por seguridad; publicar el servicio únicamente detrás de un proxy HTTPS que valide el origen y limite solicitudes. No se despliega automáticamente desde este repositorio.

## API

- `GET /api/tournaments/:id/snapshot`: token de lectura o edición autorizado
- `PUT /api/tournaments/:id/snapshot`: únicamente credenciales de edición del backend autorizado
- Cualquier intento de escritura con credenciales de TV devuelve **403 Forbidden**
- Cada actualización usa `operationId` y `expectedRevision` para evitar duplicados y sobrescrituras

## Pruebas

```sh
npm install --ignore-scripts
npm test
node postgres-store.test.cjs
node http-adapter.test.cjs
```

Las pruebas automatizadas usan dobles de prueba; **no demuestran** una conexión de red real entre el servidor y Supabase. Para una prueba extremo a extremo se requieren credenciales de laboratorio en el alojamiento, un proxy HTTPS y un televisor de pruebas.
