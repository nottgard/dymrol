# DYM

Proyecto de Doblajes y Mazmorras. Web + flipadas. Back en Node + Express y front en React con React Router, todo en TypeScript.

## Requisitos

- **Node.js 26** (el proyecto indica la versión en `.nvmrc`)
- **pnpm 10** o superior

[nvm](https://github.com/nvm-sh/nvm)

```bash
nvm install   # instala la versión de .nvmrc
nvm use
corepack enable   # activa pnpm con la versión fijada en package.json
```

## Puesta en marcha

Necesitas un PostgreSQL local con una base de datos vacía (por ejemplo `dym`).

```bash
pnpm install
cp server/.env.example server/.env   # ajusta DATABASE_URL a tu Postgres local
pnpm migrate                         # crea las tablas y los datos iniciales
pnpm dev
```

`pnpm dev` levanta a la vez el front y la api:

| Servicio | URL                   |
| -------- | --------------------- |
| Front    | http://localhost:5173 |
| API      | http://localhost:3001 |

El front reenvía las peticiones `/api/*` al servidor (proxy de Vite), así que desde el código del cliente se llama a `/api/...` sin más.

## Scripts

| Comando                      | Qué hace                                                         |
| ---------------------------- | ---------------------------------------------------------------- |
| `pnpm dev`                   | Servidor y cliente en modo desarrollo (con recarga)              |
| `pnpm build`                 | Compila el cliente (`client/dist`) y el servidor (`server/dist`) |
| `pnpm start`                 | Arranca el servidor compilado                                    |
| `pnpm typecheck`             | Comprueba tipos en cliente y servidor                            |
| `pnpm lint`                  | ESLint                                                           |
| `pnpm lint:fix`              | ESLint corrigiendo lo que pueda                                  |
| `pnpm format`                | Prettier, formatea todo                                          |
| `pnpm format:check`          | Prettier, solo comprueba                                         |
| `pnpm migrate`               | Aplica las migraciones pendientes                                |
| `pnpm migrate:down`          | Deshace la última migración                                      |
| `pnpm migrate:create nombre` | Crea una migración nueva (SQL)                                   |

## Producción

```bash
pnpm build
NODE_ENV=production pnpm start
```

En producción Express sirve el front compilado y la API desde el mismo puerto (3001 por defecto, configurable con la variable `PORT`).

## Estructura

```
.
├── client/                     # React + Vite + React Router
│   ├── public/assets/          # estáticos (logo, etc.)
│   └── src/
│       ├── api/                # cliente para llamar al servidor (api.get / api.post)
│       ├── components/         # cada componente con su .tsx y su .css
│       ├── pages/              # una carpeta por página/sección
│       ├── App.tsx             # definición de rutas
│       └── main.tsx
└── server/                     # Node + Express
    ├── migrations/             # migraciones SQL (esquema y datos)
    └── src/
        ├── index.ts            # arranque (listen)
        ├── app.ts              # configuración de Express
        ├── routes/             # rutas: cada una apunta a un controlador
        └── controllers/        # lógica de cada endpoint
```

## Base de datos y migraciones

El esquema de la base de datos y sus datos iniciales se crean **solo con migraciones** ([node-pg-migrate](https://salsita.github.io/node-pg-migrate/)), en SQL, dentro de `server/migrations/`. Nunca se modifica la base de datos a mano.

```bash
pnpm migrate:create create_users   # genera server/migrations/<timestamp>_create-users.sql
```

Cada fichero tiene dos bloques: lo que hace (`Up`) y cómo se deshace (`Down`).

```sql
-- Up Migration
CREATE TABLE users (
  id serial PRIMARY KEY,
  name text NOT NULL
);

-- Down Migration
DROP TABLE users;
```

- En `server/migrations-example/` hay dos migraciones de ejemplo comentadas (esquema y datos). **No se ejecutan**: están fuera de `migrations/`. Úsalas de guía o cópialas a `migrations/` para probarlas.
- Los **datos** (por ejemplo, filas iniciales) también van en migraciones, en ficheros aparte de los de esquema: `pnpm migrate:create seed_users`.
- Una migración ya aplicada no se edita; si hay que cambiar algo, se crea otra nueva.
- `pnpm migrate` aplica solo las pendientes y anota las ya ejecutadas en la tabla `pgmigrations`. Todas las pendientes se ejecutan en una sola transacción: si una falla, no se aplica ninguna.
- La conexión se lee de `DATABASE_URL` (`server/.env` en local; en el servidor, del entorno).

## Cómo añadir cosas

### Una sección nueva en el front

1. Crea `client/src/pages/Nombre/Nombre.tsx` (y su `Nombre.css`).
2. Añade su ruta en `client/src/App.tsx`:
   ```tsx
   <Route path="nombre" element={<Nombre />} />
   ```
3. Si quieres enlazarla en la cabecera, añade un `<NavLink>` en `client/src/components/Layout.tsx`.

### Un endpoint nuevo en el servidor

1. `server/src/controllers/recurso.controller.ts`: una función exportada por endpoint.
2. `server/src/routes/recurso.routes.ts`: cada ruta apunta a su función del controlador.
3. Móntalo en `server/src/routes/index.ts`:
   ```ts
   router.use('/recurso', recursoRoutes);
   ```

Los imports entre ficheros del servidor llevan extensión `.js` (`'./recurso.controller.js'`), aunque los ficheros sean `.ts`; es un requisito de ESM con `NodeNext`.

### Llamar al servidor desde el front

```ts
import { api } from '../api/client.ts';

const data = await api.get<{ message: string }>('/hello');
```

## Calidad de código

- **TypeScript** en modo estricto (`tsconfig.base.json` compartido).
- **ESLint** (`eslint.config.js`) con `typescript-eslint` y reglas de React Hooks.
- **Prettier** (`.prettierrc`): comillas simples, ancho 100.

TypeScript está fijado en la 6.0 porque `typescript-eslint` aún no es compatible con la 7.
