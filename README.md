# NexaPay Backend

API de **NexaPay**, una billetera digital multimoneda (USD, EUR, COP, ARS) de simulación, con fondos ficticios. Este repositorio contiene el **backend**; la interfaz web está en [`nexapay-frontend`](https://github.com/andy202ochoa/nexapay-frontend).

🔗 **Demo:** https://nexapay-frontend-ten.vercel.app
🩺 **API en producción:** https://nexapay-backend.vercel.app/api/health · Documentación: https://nexapay-backend.vercel.app/api-docs

> **Proyecto en equipo.** NexaPay se desarrolló entre 4 personas en la organización [lNexapay](https://github.com/lNexapay). Este repositorio es mi copia personal, desplegada en mis propias cuentas (Vercel + Neon) para que siga disponible en mi portafolio. Ver [Créditos](#créditos) y [Mi rol](#mi-rol-en-el-proyecto).

## Qué incluye hoy

| Módulo | Estado | Detalle |
|--------|--------|---------|
| **Autenticación** | Funcional | Registro (crea también la billetera y sus saldos en cero), login con JWT, **inicio de sesión con Google**, refresh tokens, cierre de sesión, control de actividad y ruta protegida `/me` |
| **Monedas y tasas** | Funcional | Catálogo de monedas y tasas de cambio de ejemplo |
| **Wallet** (saldos, ingresos, conversiones, transferencias, historial) | Funcional | Persistida en **PostgreSQL**; cada usuario opera solo sobre su propia billetera |
| **Comisiones** | Funcional | Comisión por par de monedas en las conversiones (`src/config/fees.ts`), consultable en `GET /api/fees` |
| **Transferencias** | Funcional | Entre usuarios, en la misma moneda, identificando al destinatario por correo o por número de cuenta de 8 dígitos |
| **Espacios de ahorro** (“Mis espacios”) | Funcional | Aportes y retiros por espacio, con meta opcional; el dinero aportado deja de estar disponible para convertir o transferir |
| **Asistente NEXAPAY AI** | Funcional | Chat de solo consulta sobre la cuenta del usuario, con Google Gemini; requiere `GEMINI_API_KEY` |
| **Correo de bienvenida** | Funcional | Se envía al registrarse, vía Amazon SES; si falla o no está configurado, no interrumpe el registro |
| **Documentación de la API** | Funcional | Swagger UI en `/api-docs` |

## Stack

- Node.js + TypeScript
- Express 5
- PostgreSQL (`pg`) con migraciones SQL (`node-pg-migrate`)
- JWT (`jsonwebtoken`) y `bcrypt` para contraseñas
- Google Identity (`google-auth-library`) para el login con Google
- Google Gemini (`@google/genai`) para el asistente
- Amazon SES (`@aws-sdk/client-ses`) para el correo de bienvenida
- Swagger (`swagger-jsdoc` + `swagger-ui-express`)
- Pruebas con Vitest y Supertest

## Requisitos

- Node.js 22 (es la versión que usa el CI)
- PostgreSQL 13 o superior (las migraciones usan `gen_random_uuid()`)
- Git

## Inicio rápido

```bash
# 1. Clonar e instalar
git clone https://github.com/andy202ochoa/nexapay-backend.git
cd nexapay-backend
npm install

# 2. Variables de entorno
cp .env.example .env
# Edita .env (ver tabla más abajo)

# 3. Crear las tablas
npm run migrate:up

# 4. Iniciar en modo desarrollo
npm run dev
```

El servidor queda en `http://localhost:3000`. Comprueba que responde en `http://localhost:3000/api/health`.

### PostgreSQL con Docker (opcional)

```bash
docker run --name nexapay-db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=nexapay -p 5432:5432 -d postgres:16
```

Con eso, `DATABASE_URL=postgres://postgres:postgres@localhost:5432/nexapay`.

## Variables de entorno

| Variable | Obligatoria | Descripción | Ejemplo |
|----------|:-----------:|-------------|---------|
| `PORT` | No | Puerto del servidor | `3000` |
| `DATABASE_URL` | Sí | Conexión a PostgreSQL | `postgres://postgres:postgres@localhost:5432/nexapay` |
| `JWT_SECRET` | Sí | Clave para firmar los tokens. Usa un valor largo y aleatorio | `cambia-esto-por-un-secreto-largo` |
| `FRONTEND_URL` | Sí en producción | Origen del frontend permitido por CORS además de `http://localhost:5173` (por ejemplo, el dominio de Vercel) | `https://nexapay.vercel.app` |
| `GOOGLE_CLIENT_ID` | Para login con Google | ID de cliente de Google Cloud Console; el frontend debe usar el mismo. Sin él, `POST /api/auth/google` responde 500 | `1234-abc.apps.googleusercontent.com` |
| `GEMINI_API_KEY` | Para el asistente | Clave de Google AI Studio. Sin ella, `POST /api/ai/chat` responde 503 | |
| `AI_MODEL` | No | Modelo de Gemini. Si defines esta variable, tiene prioridad sobre el valor por defecto del código (`gemini-3.5-flash-lite`); si Google retira el modelo, cámbiala o bórrala | `gemini-3.5-flash-lite` |
| `SES_ACCESS_KEY_ID` | Para el correo de bienvenida | Access key de un usuario IAM con permisos de SES | |
| `SES_SECRET_ACCESS_KEY` | Para el correo de bienvenida | Secret key de ese usuario IAM | |
| `SES_REGION` | No | Región de SES (por defecto `us-east-1`) | `us-east-2` |
| `SES_FROM_EMAIL` | Para el correo de bienvenida | Remitente verificado en Amazon SES | `no-reply@tu-dominio.com` |

Las credenciales de SES usan el prefijo `SES_` porque **Vercel reserva los nombres `AWS_*`**. En local también funcionan las variables `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` habituales. El backend envía el correo directamente con SES (la antigua función `api/send-welcome.ts` ya no se despliega).

El archivo `.env` **nunca se sube a Git**.

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor con recarga automática (`tsx watch`) |
| `npm run build` | Compila TypeScript a `dist/` |
| `npm start` | Ejecuta la versión compilada (`dist/server.js`) |
| `npm test` | Ejecuta las pruebas una vez |
| `npm run test:watch` | Pruebas en modo observación |
| `npm run migrate:up` | Aplica las migraciones pendientes |

## Endpoints

Documentación interactiva: **`http://localhost:3000/api-docs`**.

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/health` | No | Estado de la API |
| `POST` | `/api/auth/register` | No | Crea usuario y su billetera |
| `POST` | `/api/auth/login` | No | Inicia sesión |
| `POST` | `/api/auth/google` | No | Inicia sesión (o registra) con un ID token de Google |
| `POST` | `/api/auth/refresh` | Cookie | Renueva la sesión |
| `POST` | `/api/auth/logout` | Cookie | Cierra la sesión |
| `POST` | `/api/auth/activity` | Sí | Registra actividad de la sesión |
| `GET` | `/api/auth/me` | Sí | Datos del usuario autenticado |
| `GET` | `/api/currencies` | No | Monedas disponibles |
| `GET` | `/api/rates` | No | Tasas de cambio |
| `GET` | `/api/fees` | No | Comisiones vigentes por par de monedas |
| `GET` | `/api/balances` | Sí | Saldos del usuario (uno por moneda) |
| `GET` | `/api/balances/:currency` | Sí | Saldo de una moneda |
| `GET` | `/api/balances/total` | Sí | Patrimonio total convertido a una moneda base (`?base=USD`) |
| `POST` | `/api/deposit` | Sí | Ingreso simulado |
| `POST` | `/api/convert` | Sí | Conversión entre monedas (cobra comisión) |
| `POST` | `/api/transfers` | Sí | Transferencia a otro usuario |
| `GET` | `/api/transactions` | Sí | Historial de operaciones |
| `POST` | `/api/spaces` | Sí | Crea un espacio de ahorro |
| `GET` | `/api/spaces` | Sí | Lista los espacios del usuario |
| `GET` | `/api/spaces/:id` | Sí | Detalle de un espacio |
| `POST` | `/api/spaces/:id/deposit` | Sí | Aporta dinero a un espacio |
| `POST` | `/api/spaces/:id/withdraw` | Sí | Retira dinero de un espacio |
| `GET` | `/api/spaces/:id/movements` | Sí | Movimientos de un espacio |
| `POST` | `/api/ai/chat` | Sí | Pregunta al asistente NEXAPAY AI (límite de 5 consultas por minuto por usuario) |

Las rutas protegidas esperan la cabecera `Authorization: Bearer <token>` **y** la cookie de sesión. El refresh token viaja en una cookie `HttpOnly` (`refreshToken`, ruta `/api`), por eso el frontend debe hacer las peticiones con `credentials: "include"`.

Más detalle: [docs/AUTH_API.md](docs/AUTH_API.md) (sesión y Google), [docs/savings_spaces_api.md](docs/savings_spaces_api.md) (espacios de ahorro) y [docs/api.md](docs/api.md) (convenciones del contrato).

> Los errores de wallet, ahorros y asistente los gestiona el middleware `errorHandler` (`AppError`); los de auth responden hoy con su propio formato. Unificarlos queda pendiente.

> CORS permite con credenciales el origen `http://localhost:5173` (desarrollo) y el definido en `FRONTEND_URL` (frontend desplegado, por ejemplo en Vercel).

## Despliegue (Vercel + Neon)

```
[Navegador] → nexapay-frontend (Vercel)
                 │  /api/*  (rewrite en vercel.json del frontend)
                 ▼
             nexapay-backend (Vercel Functions, Express) → PostgreSQL (Neon)
```

- **Backend en Vercel:** Vercel detecta Express automáticamente porque `src/app.ts` exporta la app (`export default app`); no hace falta comando de build. `vercel.json` queda vacío a propósito y `.vercelignore` excluye la carpeta `api/` (función antigua de correo).
- **Base de datos en Neon:** plan gratuito sin vencimiento. En Vercel, `DATABASE_URL` usa la cadena **pooled** (host con `-pooler`); el pool de `pg` se limita a 3 conexiones por instancia (`src/config/database.ts`). Las migraciones se corren desde una PC con la cadena **directa**: `npm run migrate:up`.
- **Frontend:** llama a rutas relativas `/api/...` y su `vercel.json` las redirige a este backend, así el navegador habla con un solo origen y la cookie de sesión funciona sin problemas de CORS.
- **Variables en Vercel:** `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `GOOGLE_CLIENT_ID`, `GEMINI_API_KEY` y, opcionalmente, las de SES.

> Limitación conocida: el límite de consultas del asistente es en memoria, así que en Vercel se aplica por instancia de la función (no es global).

## Base de datos

Las migraciones están en `migrations/` y se aplican en orden:

| # | Tabla / cambio |
|---|----------------|
| 001 | `users` |
| 002 | `wallets` (una por usuario) |
| 003 | `balances` |
| 004 | `contexts` |
| 005 | `transactions` |
| 006 | `context_budgets` |
| 007 | `exchange_rates_cache` |
| 008 | `refresh_tokens` |
| 009 | `last_activity` en `refresh_tokens` |
| 010 | `description` en `transactions` |
| 011 | `account_number` en `users` |
| 012 | comisión (`fee`) en `transactions` |
| 013 | `savings_spaces` y sus movimientos |
| 014 | `user_oauth_accounts` (login con Google) y contraseña opcional en `users` |

Reglas: no edites una migración que ya está en `main` (crea una nueva) e incluye la migración en el mismo PR que el código que la necesita.

## Estructura

```
.
├── api/               # Función antigua de correo (no se despliega: ver .vercelignore)
├── docs/              # Documentación técnica y de equipo (índice en docs/README.md)
├── migrations/        # Migraciones SQL
├── scripts/           # Utilidades de mantenimiento (init-balances)
├── src/
│   ├── server.ts      # Arranque del servidor
│   ├── app.ts         # Express, CORS, rutas y manejo de errores
│   ├── auth/          # Registro, login, Google, JWT, refresh tokens
│   ├── config/        # Base de datos, monedas, comisiones y asistente
│   ├── controllers/   # Traducen HTTP a servicios
│   ├── services/      # Lógica de negocio (saldos, transacciones, ahorros, asistente)
│   ├── routes/        # Definición de endpoints (con anotaciones Swagger)
│   ├── data/          # Repositorio PostgreSQL de la wallet y repositorio en memoria (solo pruebas)
│   ├── middlewares/   # errorHandler y limitador de consultas
│   ├── docs/          # Configuración de Swagger
│   ├── types/         # Tipos de la wallet
│   └── utils/         # AppError y validadores
└── test/              # Pruebas de rutas, servicios y middlewares
```

En las pruebas (`NODE_ENV=test`) los servicios usan el repositorio en memoria, así que `npm test` no necesita base de datos; en cualquier otro entorno se usa PostgreSQL.

## Cómo trabajamos (flujo del equipo)

1. Crea una rama desde `main`: `feat/...`, `fix/...`, `docs/...`.
2. Commits y título del PR con formato [Conventional Commits](https://www.conventionalcommits.org/): `feat: ...`, `fix: ...`, `docs: ...`. El CI rechaza los títulos que no lo cumplan.
3. Abre un Pull Request hacia `main` y pide revisión.
4. Antes de abrirlo, verifica en local:

```bash
npx tsc --noEmit
npm test
```

No subas `.env`, llaves ni datos reales. Más detalle en [CONTRIBUTING.md](CONTRIBUTING.md).

## Pendientes conocidos

- Vincular una cuenta tradicional con Google por coincidencia de correo (hoy responde 409).
- Pruebas de concurrencia e idempotencia en aportes y retiros de los espacios de ahorro.
- Unificar el formato de errores de auth con el del resto de la API.
- `docs/EMAIL_SERVICE.md` todavía describe la función de Vercel `api/send-welcome.ts`, que ya no se usa: el backend envía directo con SES.
- Revisar `docs/api.md`, que todavía describe parte de la wallet como "en memoria".
- Definir la licencia (el `package.json` declara `ISC` por defecto).

## Créditos

NexaPay fue un proyecto en equipo de 4 personas, organizado en [lNexapay](https://github.com/lNexapay) con ramas, Pull Requests revisados y CI.

| Integrante | Área |
|------------|------|
| [@andy202ochoa](https://github.com/andy202ochoa) | Backend |
| [@octaviolanne-hue](https://github.com/octaviolanne-hue) | Backend |
| [@lHakoo](https://github.com/lHakoo) | Backend y frontend |
| [@yahiralmendras22](https://github.com/yahiralmendras22) | Frontend |

Repositorios originales: [lNexapay/nexapay-backend](https://github.com/lNexapay/nexapay-backend) · [lNexapay/nexapay-frontend](https://github.com/lNexapay/nexapay-frontend)

## Mi rol en el proyecto

Soy **Andy Ochoa** ([@andy202ochoa](https://github.com/andy202ochoa)) y trabajé en el **backend** (Node.js, Express, TypeScript):

- **Configuración inicial:** variables de entorno, scripts `dev`/`build`/`start`, `/api/health` y documentación con Swagger.
- **Saldos y monedas:** catálogo de monedas (ARS, USD, EUR, COP), tasas de cambio y endpoints `/api/currencies`, `/api/rates`, `/api/balances`, `/api/balances/total` y `/api/balances/:currency`, con pruebas en Vitest.
- **Operaciones de la billetera:** ingresos, conversiones y su historial.
- **Transferencias entre usuarios:** `POST /api/transfers`, identificando al destinatario por correo o número de cuenta.
- **Comisiones:** comisión por par de monedas en las conversiones (migración 012) y `GET /api/fees` para que el frontend muestre el costo antes de confirmar.
- **Asistente NEXAPAY AI:** `POST /api/ai/chat` con Google Gemini detrás de una interfaz de proveedor, solo lectura, con límite de consultas por usuario y pruebas con un proveedor simulado.
- **Despliegue de mi copia:** migración del backend de Railway a **Vercel + Neon** para mantener la demo disponible sin costo.
