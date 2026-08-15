# QuiniGana

Aplicacion de quiniela con:
- `quinigana-backend`: API Node.js + TypeScript + MySQL.
- `quinigana-frontend`: cliente Angular.

**Produccion:** https://quinigana.com

---

## Como funciona la aplicacion

Cada grupo juega **un boleto consensuado**, no uno por persona. El circuito es:

| # | Etapa | Quien | Donde |
|---|-------|-------|-------|
| 1 | Crear la jornada (15 partidos) | Administrador | Panel Admin -> Jornadas |
| 2 | Proponer jugarla en un grupo | Cualquier miembro | Grupo -> Quinielas -> Nueva Quiniela |
| 3 | Votar la propuesta | Todos los miembros | Detalle de la propuesta |
| 4 | La jornada pasa a activa | Automatico | Dashboard |
| 5 | Cargar resultados y puntuar | Administrador | Panel Admin -> Enviar Resultados |

Reglas:
- Una propuesta se aprueba con **mayoria simple**: la mitad de los miembros mas uno.
- Solo puede haber **una propuesta activa** por grupo y jornada.
- Cada miembro puede crear **una unica propuesta** por grupo y jornada.

### Puntuacion

| Acierto | Puntos |
|---------|--------|
| 1X2 con un solo signo | 1 |
| 1X2 con doble | 0,5 |
| 1X2 con triple | 0 |
| Pleno al 15 (resultado exacto) | 3 |

La puntuacion es **del grupo**, no individual. Los grupos compiten entre si.

---

## Requisitos

- Node.js 20+ (produccion usa 22.14.0)
- npm 11+
- MySQL 8+
- Redis (opcional; sin el la app degrada a cache en memoria)

## Desarrollo local

### Backend

```bash
cd quinigana-backend
npm ci
cp .env.example .env     # rellenar credenciales
npm run migrate
npm run seed
npm run dev              # http://localhost:3000
```

Comandos:
- `npm run dev`: servidor en desarrollo con recarga.
- `npm run build`: compila TypeScript a `dist`.
- `npm start`: ejecuta el backend compilado.
- `npm test`: tests unitarios.
- `npm run migrate`: aplica migraciones SQL pendientes.

### Frontend

```bash
cd quinigana-frontend
npm ci
npm start                # http://localhost:4200
```

Comandos:
- `npm start`: servidor Angular en desarrollo.
- `npm run build:prod`: build de produccion.
- `npm test`: tests unitarios con Jest.

> `src/environments/environment.development.ts` apunta a `quinigana.com`. Para
> desarrollo contra un backend local, cambialo a `http://localhost:3000/api`.

---

## Produccion

### Infraestructura

| Elemento | Valor |
|----------|-------|
| Proveedor | STRATO VPS Windows |
| IP | 82.165.24.70 |
| Dominios | quinigana.com, www.quinigana.com, neotime.es |
| Servidor web | Apache 2.4.58 (EasyPHP-Devserver) |
| Base de datos | MySQL 8.0.20 (EasyPHP), solo `127.0.0.1:3306` |
| Node | 22.14.0 en `C:\Program Files\nodejs` |

Rutas en el servidor:

```
C:\EasyPHP-Devserve\eds-www\quinigana\          frontend compilado
C:\EasyPHP-Devserve\eds-dashboard\apache-vhosts.conf   vhosts
C:\EasyPHP-Devserve\eds-dashboard\certificates\        certificados TLS
C:\wamp64\www\node\quinigana-backend\           backend (dist + .env)
C:\quinigana-api.log                            log del backend
```

### Acceso por SSH

OpenSSH portable (`C:\Program Files\OpenSSH-Win64`), autenticacion por clave.
La clave publica vive en `C:\ProgramData\ssh\administrators_authorized_keys`.

```bash
ssh -i ~/.ssh/quinigana_vps administrator@82.165.24.70
```

> El servicio `sshd` instalado via `Add-WindowsCapability` no arranca en este
> VPS (muere bajo la cuenta SYSTEM, error 1067). Se usa la version portable de
> Win32-OpenSSH, que registra el servicio correctamente con `install-sshd.ps1`.

### Servicios y arranque automatico

Apache, MySQL y el backend **no corren como servicios de Windows**: son procesos
lanzados por tareas programadas, con retardo escalonado para respetar el orden
de dependencias.

| Tarea | Retardo | Proceso |
|-------|---------|---------|
| `EDS-MySQL-Start` | 0 s | `eds-dbserver.exe` |
| `EDS-Apache-Start` | 20 s | `eds-httpserver.exe` |
| `Quinigana-API` | 45 s | `node dist/server.js` |

```powershell
Get-ScheduledTask -TaskName "EDS-MySQL-Start","EDS-Apache-Start","Quinigana-API"
Stop-ScheduledTask  -TaskName "Quinigana-API"
Start-ScheduledTask -TaskName "Quinigana-API"
```

> pm2 no funciona aqui: su daemon muere al cerrarse la sesion SSH en Windows.

### HTTPS

Certificado **Let's Encrypt** emitido con win-acme (`C:\win-acme`), cubriendo
`quinigana.com` y `www.quinigana.com`. Renovacion automatica por tarea programada.

La validacion ACME usa http-01 sobre `C:\EasyPHP-Devserve\eds-www\quinigana`,
asi que el vhost `*:80` debe seguir sirviendo `/.well-known/acme-challenge/`
sin redirigir a HTTPS.

```powershell
cd C:\win-acme
.\wacs.exe --renew          # renovacion manual
```

### Apache

Modulos necesarios en `httpd.conf` (ademas de `ssl` y `rewrite`):

```apache
LoadModule proxy_module modules/mod_proxy.so
LoadModule proxy_http_module modules/mod_proxy_http.so
LoadModule proxy_wstunnel_module modules/mod_proxy_wstunnel.so
Listen 80
```

El vhost `*:443` de quinigana hace de proxy inverso al backend:

```apache
ProxyPass        /socket.io http://127.0.0.1:3000/socket.io
ProxyPass        /api       http://127.0.0.1:3000/api
RewriteCond %{HTTP:Upgrade} =websocket [NC]
RewriteRule ^/socket\.io/(.*) ws://127.0.0.1:3000/socket.io/$1 [P,L]
```

> El vhost de `neotime.es` necesita `Options Indexes`; sin el devuelve 403.
> Los vhosts se editan en `eds-dashboard\apache-vhosts.conf`, pero el panel de
> EasyPHP puede sobrescribirlo: haz copia antes de tocarlo.

---

## Despliegue

### Frontend

```bash
cd quinigana-frontend
npm run build:prod
scp -i ~/.ssh/quinigana_vps -r dist/quinigana-frontend/browser/* \
    administrator@82.165.24.70:"C:/EasyPHP-Devserve/eds-www/quinigana/"
```

Antes de copiar, vacia el destino **conservando `.well-known`** (lo necesita la
renovacion del certificado):

```powershell
$w = "C:\EasyPHP-Devserve\eds-www\quinigana"
Get-ChildItem $w -Exclude ".well-known" | Remove-Item -Recurse -Force
```

> No debe existir un `.htaccess` en esa carpeta: el vhost ya resuelve el routing
> de la SPA, y un `.htaccess` con `RewriteBase` propio provoca bucles de
> redireccion (HTTP 500 en las rutas internas de Angular).

### Backend

```bash
cd quinigana-backend
npx tsc -p tsconfig.json --outDir ./dist
scp -i ~/.ssh/quinigana_vps -r dist/* package.json package-lock.json \
    administrator@82.165.24.70:"C:/wamp64/www/node/quinigana-backend/"
```

En el servidor:

```powershell
cd C:\wamp64\www\node\quinigana-backend
npm install --omit=dev
Stop-ScheduledTask -TaskName "Quinigana-API"
Start-ScheduledTask -TaskName "Quinigana-API"
Get-Content C:\quinigana-api.log -Tail 20
```

Haz copia del `dist` anterior antes de sustituirlo: es la unica vuelta atras.

---

## Variables de entorno del backend

Las sensibles solo existen en el `.env` del servidor, nunca en el repositorio.

| Variable | Notas |
|----------|-------|
| `PORT` | 3000 |
| `NODE_ENV` | `production` |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | MySQL local |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | distintos entre si y de desarrollo |
| `FRONTEND_URL` | `https://quinigana.com` — controla el CORS |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | consola de Google Cloud |
| `GOOGLE_CALLBACK_URL` | `https://quinigana.com/api/auth/google/callback` |
| `FOOTBALL_DATA_API_KEY` | clave de football-data.org |
| `RATE_LIMIT_MAX` | 1000 por ventana de 15 min |
| `REDIS_ENABLED` | `false` si no hay Redis instalado |
| `SMTP_*` | pendiente de configurar: el envio de correo no funciona |

### Google OAuth

En la consola de Google Cloud, el cliente web debe declarar:

- Origen JavaScript: `https://quinigana.com`
- URI de redireccion: `https://quinigana.com/api/auth/google/callback`

Un desajuste produce `Error 400: redirect_uri_mismatch`. Los cambios tardan
entre minutos y horas en propagarse.

---

## Origenes de datos deportivos

| Fuente | Uso | Limitacion |
|--------|-----|------------|
| football-data.org | Clasificaciones y partidos de Primera | El plan gratuito **no incluye Segunda** (403) |
| eduardolosilla.es | Los 15 partidos oficiales de la quiniela | Scraping: puede romperse si cambia el HTML |

La quiniela mezcla Primera y Segunda, asi que football-data no basta por si solo.
El boton **Cargar La Quiniela (15 partidos)** usa el scraper.

> El scraper apuntaba a `resultados-futbol.com`, que ahora redirige a
> `besoccer.es` y sirve el feed general del sitio en lugar del boleto. Si vuelve
> a romperse, revisa `quiniela-scraper.service.ts`: la extraccion depende del
> atributo `title` de cada fila del cupon.

---

## Problemas conocidos

- **Redis**: si no esta instalado, pon `REDIS_ENABLED=false`. En caso contrario
  ioredis reintenta en bucle y llena el log.
- **Cache del navegador**: la API responde `Cache-Control: no-store` y el ETag
  esta desactivado. Sin eso, datos recien creados no aparecian hasta recargar a
  la fuerza.
- **Service Worker**: tras desplegar frontend conviene `Ctrl+Shift+R`; el SW de
  Angular puede seguir sirviendo el bundle anterior.
- **Migraciones**: la tabla `schema_migrations` no existe en produccion (el
  esquema se monto a mano), asi que `npm run migrate` intentaria aplicarlas todas
  desde cero. Aplica los cambios de esquema uno a uno.
- **SMTP sin configurar**: recuperacion de contraseña y notificaciones por correo
  no funcionan.

## Pendiente

- Cerrar el puerto 3389 (RDP) en el firewall de STRATO y eliminar la regla
  comodin `0.0.0.0/ANY`, que deja todos los puertos abiertos a internet.
- Cambiar la contraseña de Administrator del VPS.
- Configurar SMTP.
- Instalar Redis o silenciar su health check.

---

## Docker (stack completo, entorno local)

```bash
docker compose up --build
```

- Frontend: `http://localhost`
- Backend: `http://localhost:3000`
- MySQL: `localhost:3306`
