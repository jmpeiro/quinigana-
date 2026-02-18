# Quinigana Monorepo

Aplicacion de quiniela con:
- `quinigana-backend`: API Node.js + TypeScript + MySQL.
- `quinigana-frontend`: cliente Angular.

## Requisitos

- Node.js 20+
- npm 11+
- MySQL 8+

## Backend

```bash
cd quinigana-backend
npm ci
npm run migrate
npm run seed
npm run dev
```

Comandos:
- `npm run dev`: servidor en desarrollo.
- `npm run build`: compila TypeScript a `dist`.
- `npm start`: ejecuta backend compilado.
- `npm test`: tests unitarios.
- `npm run migrate`: ejecuta migraciones SQL pendientes.

## Frontend

```bash
cd quinigana-frontend
npm ci
npm start
```

Comandos:
- `npm start`: servidor Angular en desarrollo.
- `npm run build`: build produccion.
- `npm test`: tests unitarios con Jest.

## Docker (stack completo)

```bash
docker compose up --build
```

Servicios por defecto:
- Frontend: `http://localhost`
- Backend: `http://localhost:3000`
- MySQL: `localhost:3306`
