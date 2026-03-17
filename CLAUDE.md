# OctanoRD — Especificacion Tecnica

App mobile (Android + iOS) para calificar la calidad del combustible en gasolineras de Republica Dominicana, con reviews verificadas mediante foto de factura y verificacion OTP ligera, sin registro de cuenta obligatorio.

---

## Metodologia de Desarrollo: Ralph Loop

El Ralph Loop es el ciclo de desarrollo iterativo que se usa en este proyecto. Cada feature o modulo pasa por las 5 fases en orden antes de considerarse completo.

```
  ┌─────────────────────────────────────────────────┐
  │                                                 │
  │   R ──► A ──► L ──► P ──► H ──► (siguiente)    │
  │   │     │     │     │     │                     │
  │   │     │     │     │     └─ Harmonize          │
  │   │     │     │     └─────── Probe              │
  │   │     │     └───────────── Lint               │
  │   │     └─────────────────── Architect          │
  │   └───────────────────────── Research           │
  │                                                 │
  └─────────────────────────────────────────────────┘
```

### R — Research (Context7)
Antes de escribir una sola linea, consultar la documentacion actualizada de cada libreria involucrada en la feature via Context7.

**Como usar Context7 en este proyecto:**
```
use context7

// Ejemplos de consultas antes de implementar:
- "NestJS guards con JWT"                    → antes de implementar auth
- "Drizzle ORM PostGIS spatial queries"      → antes de queries de proximidad
- "Expo Router v4 dynamic routes"            → antes de crear pantallas
- "BullMQ worker concurrency"                → antes del OCR processor
- "react-native-maps marker clustering"      → antes del mapa de gasolineras
- "MinIO presigned URLs Node.js SDK"         → antes del storage de facturas
```

**Regla:** Si una libreria tiene version mayor nueva (ej: Drizzle 0.x → 1.x), Context7 lo detecta. No asumir que lo que se sabe de memoria es correcto — siempre consultar primero.

---

### A — Architect (Planificar antes de escribir)
Con la documentacion fresca, disenar la solucion antes de tocar el teclado.

**Checklist de arquitectura por feature:**
- [ ] Definir el contrato de la API (DTO de entrada y salida)
- [ ] Identificar que tablas/columnas de Drizzle se necesitan o modifican
- [ ] Identificar keys de Redis que se usan (naming convention: `recurso:id:accion`)
- [ ] Definir si el job es sincrono o requiere BullMQ
- [ ] Identificar los Guards y Interceptors que aplican
- [ ] Mapear los estados posibles y transiciones (ej: review: pending→approved→rejected)

---

### L — Lint (Semgrep)
Despues de implementar, escanear el codigo con Semgrep para detectar vulnerabilidades de seguridad antes de hacer commit.

**Reglas de Semgrep prioritarias para este proyecto:**
```bash
# Escaneo completo con reglas de seguridad para TypeScript/Node
semgrep scan --config=p/typescript --config=p/nodejs --config=p/owasp-top-ten apps/

# Reglas especificas criticas para OctanoRD:
# - Injection en queries SQL (aunque Drizzle protege, verificar raw queries)
# - Secrets hardcodeados (JWT_SECRET, API keys en el codigo)
# - Path traversal en uploads de MinIO
# - Missing auth en endpoints (controller sin @UseGuards)
# - Datos sensibles en logs (numeros de telefono, hashes)
```

**Reglas custom de Semgrep para este proyecto** (`.semgrep/octanord.yml`):
```yaml
rules:
  - id: no-phone-in-logs
    patterns:
      - pattern: console.log(..., $PHONE, ...)
      - pattern: this.logger.log(..., $PHONE, ...)
    message: "Posible numero de telefono en log. Usar phoneHash en su lugar."
    languages: [typescript]
    severity: ERROR

  - id: raw-sql-query
    pattern: db.execute(`...${...}...`)
    message: "Query SQL con interpolacion directa. Usar parametros de Drizzle."
    languages: [typescript]
    severity: ERROR

  - id: missing-auth-guard
    patterns:
      - pattern: |
          @Post(...)
          async $METHOD(...) { ... }
      - pattern-not: |
          @UseGuards(...)
          @Post(...)
          async $METHOD(...) { ... }
    message: "Endpoint POST sin @UseGuards. Verificar si requiere autenticacion."
    languages: [typescript]
    severity: WARNING
```

**El codigo no se commitea si Semgrep reporta findings de severidad ERROR.**

---

### P — Probe (Playwright)
Playwright se usa para pruebas E2E de la API REST y de los flujos criticos del backend. No hay UI web, pero si hay un servidor HTTP con endpoints testeables.

**Estructura de tests (`apps/api/test/e2e/`):**
```typescript
// Playwright como cliente HTTP para tests E2E de la API
import { test, expect, request } from '@playwright/test'

// playwright.config.ts apunta a localhost:3000 (API local con Docker Compose)
```

**Tests E2E criticos por modulo:**

```
test/e2e/
├── auth/
│   ├── otp-request.spec.ts          // POST /auth/otp/request — rate limit, formato
│   └── otp-verify.spec.ts           // POST /auth/otp/verify — token valido/invalido
├── stations/
│   ├── nearby.spec.ts               // GET /stations/nearby — PostGIS, filtros
│   └── search.spec.ts               // GET /stations/search — busqueda por texto
├── reviews/
│   ├── submit-review.spec.ts        // POST /reviews — flujo completo con JWT
│   ├── fraud-prevention.spec.ts     // Rate limiting, duplicados, receipt hash
│   └── vote.spec.ts                 // POST /reviews/:id/vote
└── storage/
    └── receipt-upload.spec.ts       // POST /storage/receipt/upload — validacion
```

**Ejemplo de test del flujo anti-fraude:**
```typescript
test('bloquea segunda review en la misma estacion en menos de 7 dias', async ({ request }) => {
  const token = await getValidJWT(request)  // helper: completa OTP flow

  const firstReview = await request.post('/reviews', {
    headers: { Authorization: `Bearer ${token}` },
    data: { stationId: STATION_ID, stars: 4, fuelType: 'regular', ... }
  })
  expect(firstReview.status()).toBe(201)

  const secondReview = await request.post('/reviews', {
    headers: { Authorization: `Bearer ${token}` },
    data: { stationId: STATION_ID, stars: 5, fuelType: 'premium', ... }
  })
  expect(secondReview.status()).toBe(429)
  expect(await secondReview.json()).toMatchObject({
    message: expect.stringContaining('una review por semana')
  })
})
```

**Comando para correr los tests E2E:**
```bash
# Requiere Docker Compose corriendo
npx playwright test --project=api-e2e
npx playwright test --grep "fraud"          # Solo tests de anti-fraude
npx playwright show-report                  # Ver reporte HTML
```

---

### H — Harmonize (Cerrar el loop)
La ultima fase antes de dar la feature por terminada.

**Checklist de harmonize:**
- [ ] Semgrep sin findings ERROR (fase L ya paso, verificar de nuevo tras fixes)
- [ ] Todos los tests E2E de Playwright en verde
- [ ] El schema de Drizzle tiene migracion generada (`npx drizzle-kit generate`)
- [ ] Las variables de entorno nuevas estan documentadas en la seccion de env vars del CLAUDE.md
- [ ] Los Redis keys nuevos siguen la convencion de naming
- [ ] No hay `console.log` de datos sensibles (Semgrep lo detecta)
- [ ] El endpoint nuevo esta documentado en la seccion "Endpoints de la API"
- [ ] Si se agrego un job de BullMQ, el worker tiene manejo de reintentos

---

### Aplicacion del Ralph Loop por Feature

| Feature | R (Context7) | A | L (Semgrep) | P (Playwright) | H |
|---|---|---|---|---|---|
| Auth OTP | NestJS JWT, Twilio Verify SDK | DTOs, Redis TTL design | Secrets, missing guards | otp-request.spec, otp-verify.spec | ✓ |
| Mapa de estaciones | react-native-maps clustering, PostGIS ST_DWithin | Query design, marker colors | SQL injection in raw queries | nearby.spec, search.spec | ✓ |
| Submit review | BullMQ docs, Drizzle insert | Estado pending→approved, job flow | Missing auth guard | submit-review.spec, fraud.spec | ✓ |
| OCR de factura | Google Vision API Node SDK | Confidence thresholds, fuzzy match | Path traversal en upload | receipt-upload.spec | ✓ |
| Anti-fraude | Redis sliding window docs | Rate limit keys design | No hay — es logica de negocio | fraud-prevention.spec | ✓ |
| Storage MinIO | MinIO JS SDK, presigned URLs | Bucket policies, TTL | Path traversal | receipt-upload.spec | ✓ |
| Realtime ratings | Socket.io NestJS gateway docs | Room design, evento schema | N/A | (manual con Playwright WS) | ✓ |

---

## Stack Tecnologico

### Mobile (Frontend)
- **Framework**: React Native con Expo SDK 52 (managed workflow)
- **Navegacion**: Expo Router v4 (file-based routing)
- **Mapas**: `react-native-maps` + Google Maps SDK
- **Estado global**: Zustand
- **Datos / cache**: TanStack Query v5
- **Formularios**: React Hook Form + Zod
- **UI**: NativeWind v4 (TailwindCSS para React Native)
- **Camara / imagenes**: `expo-camera`, `expo-image-picker`
- **Almacenamiento local**: `expo-secure-store` (tokens), `expo-file-system`
- **Notificaciones**: `expo-notifications`
- **Localizacion**: `expo-location`
- **Realtime**: Socket.io client (`socket.io-client`)
- **Idioma**: TypeScript estricto en todo el proyecto

### Backend (API)
- **Framework**: NestJS 10 (Node.js, TypeScript)
- **ORM**: Drizzle ORM (TypeScript-first, queries type-safe)
- **Base de datos**: PostgreSQL 15 + extension PostGIS
- **Cache / OTP / Rate limit**: Redis 7 (via `ioredis`)
- **Object storage**: MinIO (S3-compatible, self-hosted)
- **Realtime**: Socket.io (integrado en NestJS via `@nestjs/platform-socket.io`)
- **Validacion**: `class-validator` + `class-transformer`
- **Auth**: JWT custom (access token 15min + refresh token 30 dias, via `@nestjs/jwt`)
- **Queues**: BullMQ (jobs de OCR y moderacion asincronos, usa Redis)
- **Idioma**: TypeScript estricto

### Servicios Externos
| Servicio | Uso | Alternativa |
|---|---|---|
| Google Maps Platform | Maps SDK + Places API en la app | Mapbox |
| Google Cloud Vision API | OCR de facturas (job asincronico) | AWS Textract |
| Twilio Verify / WhatsApp | OTP sin cuenta | Firebase Auth (phone only) |
| Cloudflare Turnstile | CAPTCHA invisible | hCaptcha |
| Sentry | Error tracking (app + API) | Bugsnag |

### Hosting (EasyPanel)
- **Produccion**: EasyPanel sobre servidor propio (Docker)
- **Desarrollo local**: Docker Compose en la PC

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│                  React Native App (Expo)                 │
│     Expo Router / NativeWind / Zustand / TanStack Query  │
│                  Socket.io client                        │
└────────────┬──────────────────────────┬─────────────────┘
             │ REST (HTTPS)             │ WebSocket
             ▼                          ▼
┌────────────────────────────────────────────────────────┐
│                  NestJS API                            │
│  ┌─────────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │  Controllers│  │  Guards  │  │  Socket Gateway  │  │
│  │  /stations  │  │  JWT     │  │  ratings realtime│  │
│  │  /reviews   │  │  Throttle│  │                  │  │
│  │  /auth      │  │  Turnst. │  └──────────────────┘  │
│  └──────┬──────┘  └──────────┘                        │
│         │                                              │
│  ┌──────▼──────────────────────────────────────┐      │
│  │                  Services                    │      │
│  │  StationsService  ReviewsService  AuthService│      │
│  │  OcrService       FraudService   OtpService  │      │
│  └──────┬──────────────────┬────────────────────┘      │
│         │                  │                            │
│  ┌──────▼──────┐   ┌───────▼────────┐                  │
│  │ Drizzle ORM │   │  BullMQ Queue  │                  │
│  └──────┬──────┘   └───────┬────────┘                  │
└─────────┼──────────────────┼────────────────────────────┘
          │                  │
   ┌──────▼──────┐    ┌──────▼──────┐    ┌─────────────┐
   │ PostgreSQL  │    │    Redis     │    │    MinIO    │
   │  + PostGIS  │    │ OTP/Sessions │    │  (facturas) │
   └─────────────┘    │ Rate limits  │    └─────────────┘
                      │ BullMQ jobs  │
                      └─────────────┘
                             │
                    ┌────────▼───────────┐
                    │  Google Vision API │
                    │  (OCR facturas)    │
                    └────────────────────┘
```

---

## Modelo de Identidad (Sin Registro Obligatorio)

```
Nivel 0 — Solo lectura
  Identificador: ninguno
  Capacidades: ver mapa, ver reviews, buscar estaciones

Nivel 1 — Votar utilidad de reviews
  Identificador: device_fingerprint_hash (SHA-256, generado en el cliente)
  Capacidades: marcar review como "util" o "spam"
  Sin llamada al backend para identificarse

Nivel 2 — Escribir review con factura
  Identificador: SHA-256(phone + server_salt) + device_fingerprint_hash
  Verificacion: OTP de 6 digitos via WhatsApp (preferido) o SMS
  Flujo:
    1. POST /auth/otp/request  { phone }     → OTP guardado en Redis, TTL 10min
    2. POST /auth/otp/verify   { phone, otp } → JWT access + refresh tokens
    3. POST /reviews           { ...datos }   → requiere JWT valido
  El numero de telefono NUNCA se persiste en PostgreSQL, solo su hash SHA-256
```

---

## Estructura de la Base de Datos (Drizzle ORM)

### Schema principal (`src/db/schema.ts`)

```typescript
import { pgTable, uuid, text, decimal, integer, boolean,
         timestamp, jsonb, smallint, index } from 'drizzle-orm/pg-core'
import { geometry } from 'drizzle-orm/pg-core' // PostGIS via drizzle-orm/postgis

export const gasStations = pgTable('gas_stations', {
  id:           uuid('id').primaryKey().defaultRandom(),
  name:         text('name').notNull(),
  brand:        text('brand'),                        // 'Shell', 'Texaco', 'Puma', etc.
  lat:          decimal('lat', { precision: 10, scale: 8 }).notNull(),
  lng:          decimal('lng', { precision: 11, scale: 8 }).notNull(),
  // geom generado por trigger PostgreSQL desde lat/lng
  address:      text('address'),
  municipality: text('municipality'),
  province:     text('province'),
  phone:        text('phone'),
  hours:        jsonb('hours'),                       // { mon: '06:00-22:00', ... }
  services:     text('services').array(),             // ['car_wash', 'atm', ...]
  fuelTypes:    text('fuel_types').array(),
  avgRating:    decimal('avg_rating', { precision: 2, scale: 1 }).default('0'),
  reviewCount:  integer('review_count').default(0),
  verified:     boolean('verified').default(false),
  claimed:      boolean('claimed').default(false),
  osmId:        text('osm_id').unique(),
  createdAt:    timestamp('created_at').defaultNow(),
  updatedAt:    timestamp('updated_at').defaultNow(),
}, (t) => ({
  provinceIdx: index('idx_stations_province').on(t.province),
  brandIdx:    index('idx_stations_brand').on(t.brand),
  // idx_stations_geom se crea manualmente en migracion SQL (GIST index PostGIS)
}))

export const reviews = pgTable('reviews', {
  id:                 uuid('id').primaryKey().defaultRandom(),
  stationId:          uuid('station_id').notNull().references(() => gasStations.id, { onDelete: 'cascade' }),
  deviceHash:         text('device_fingerprint_hash').notNull(),
  phoneHash:          text('phone_hash').notNull(),        // SHA-256, nunca el numero real
  stars:              smallint('stars').notNull(),          // 1-5
  comment:            text('comment'),                      // max 500 chars
  fuelType:           text('fuel_type').notNull(),
  receiptPath:        text('receipt_storage_path'),         // path en MinIO
  receiptVerified:    boolean('receipt_verified').default(false),
  ocrExtracted:       jsonb('ocr_extracted'),               // { date, amount_rdp, liters, station_name_raw }
  ocrConfidence:      decimal('ocr_confidence', { precision: 3, scale: 2 }),
  status:             text('status').default('pending'),    // pending|approved|rejected|flagged|deleted
  helpfulCount:       integer('helpful_count').default(0),
  spamCount:          integer('spam_count').default(0),
  moderationNote:     text('moderation_note'),
  createdAt:          timestamp('created_at').defaultNow(),
}, (t) => ({
  stationIdx:   index('idx_reviews_station').on(t.stationId),
  statusIdx:    index('idx_reviews_status').on(t.status),
  phoneHashIdx: index('idx_reviews_phone_hash').on(t.phoneHash),
  deviceIdx:    index('idx_reviews_device_hash').on(t.deviceHash),
}))

export const reviewVotes = pgTable('review_votes', {
  reviewId:   uuid('review_id').notNull().references(() => reviews.id, { onDelete: 'cascade' }),
  deviceHash: text('device_hash').notNull(),
  vote:       text('vote').notNull(),       // 'helpful' | 'spam'
  createdAt:  timestamp('created_at').defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.reviewId, t.deviceHash] }),
}))

export const fraudSignals = pgTable('fraud_signals', {
  id:           uuid('id').primaryKey().defaultRandom(),
  signalType:   text('signal_type').notNull(),
  payloadHash:  text('payload_hash'),
  stationId:    uuid('station_id').references(() => gasStations.id),
  actionTaken:  text('action_taken'),
  metadata:     jsonb('metadata'),
  createdAt:    timestamp('created_at').defaultNow(),
})

export const stationClaims = pgTable('station_claims', {
  id:           uuid('id').primaryKey().defaultRandom(),
  stationId:    uuid('station_id').notNull().references(() => gasStations.id),
  contactName:  text('contact_name').notNull(),
  contactEmail: text('contact_email').notNull(),
  contactPhone: text('contact_phone').notNull(),
  rnc:          text('rnc'),
  status:       text('status').default('pending'),
  submittedAt:  timestamp('submitted_at').defaultNow(),
})
```

### Migracion SQL adicional (PostGIS + triggers)
```sql
-- Habilitar PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Columna geom
ALTER TABLE gas_stations ADD COLUMN geom GEOMETRY(Point, 4326);

-- Indice geoespacial
CREATE INDEX idx_gas_stations_geom ON gas_stations USING GIST(geom);

-- Trigger: generar geom desde lat/lng al insertar/actualizar
CREATE OR REPLACE FUNCTION sync_station_geom()
RETURNS TRIGGER AS $$
BEGIN
  NEW.geom = ST_SetSRID(ST_MakePoint(NEW.lng::float, NEW.lat::float), 4326);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_geom
  BEFORE INSERT OR UPDATE OF lat, lng ON gas_stations
  FOR EACH ROW EXECUTE FUNCTION sync_station_geom();

-- Trigger: recalcular avg_rating al aprobar/rechazar review
CREATE OR REPLACE FUNCTION recalculate_station_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE gas_stations SET
    avg_rating = (
      SELECT ROUND(AVG(stars)::NUMERIC, 1)
      FROM reviews WHERE station_id = NEW.station_id AND status = 'approved'
    ),
    review_count = (
      SELECT COUNT(*) FROM reviews
      WHERE station_id = NEW.station_id AND status = 'approved'
    ),
    updated_at = NOW()
  WHERE id = NEW.station_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_recalculate_rating
  AFTER INSERT OR UPDATE OF status ON reviews
  FOR EACH ROW EXECUTE FUNCTION recalculate_station_rating();
```

---

## Estructura del Proyecto

```
OctanoRD/
├── apps/
│   ├── mobile/                        # React Native + Expo
│   │   ├── app/                       # Expo Router (screens)
│   │   │   ├── (tabs)/
│   │   │   │   ├── index.tsx          # Mapa principal
│   │   │   │   ├── list.tsx           # Lista de gasolineras
│   │   │   │   ├── search.tsx         # Buscar por provincia/nombre
│   │   │   │   └── my-reviews.tsx     # Mis reviews (guardadas localmente)
│   │   │   ├── station/
│   │   │   │   ├── [id].tsx           # Detalle de gasolinera
│   │   │   │   └── [id]/reviews.tsx   # Todas las reviews
│   │   │   ├── review/
│   │   │   │   ├── new.tsx            # Formulario nueva review
│   │   │   │   ├── verify-otp.tsx     # Pantalla OTP
│   │   │   │   └── upload-receipt.tsx # Camara + preview
│   │   │   └── _layout.tsx
│   │   ├── components/
│   │   │   ├── map/
│   │   │   │   ├── StationMarker.tsx
│   │   │   │   ├── StationCard.tsx    # Bottom sheet al tocar marker
│   │   │   │   └── MapFilters.tsx
│   │   │   ├── review/
│   │   │   │   ├── ReviewCard.tsx
│   │   │   │   ├── RatingStars.tsx
│   │   │   │   ├── VerifiedBadge.tsx
│   │   │   │   └── ReceiptUploader.tsx
│   │   │   └── ui/
│   │   ├── lib/
│   │   │   ├── api.ts                 # Cliente axios con interceptors JWT
│   │   │   ├── socket.ts              # Socket.io client singleton
│   │   │   ├── queries/               # TanStack Query hooks
│   │   │   │   ├── useNearbyStations.ts
│   │   │   │   ├── useStationReviews.ts
│   │   │   │   └── useSubmitReview.ts
│   │   │   ├── stores/
│   │   │   │   ├── authStore.ts       # JWT tokens, estado de sesion OTP
│   │   │   │   └── mapStore.ts        # Filtros, viewport del mapa
│   │   │   └── utils/
│   │   │       ├── fingerprint.ts     # Device fingerprinting
│   │   │       └── hash.ts            # SHA-256 helpers
│   │   ├── app.config.ts
│   │   └── tailwind.config.js
│   │
│   └── api/                           # NestJS Backend
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.module.ts
│       │   ├── db/
│       │   │   ├── schema.ts          # Drizzle schema (ver arriba)
│       │   │   ├── db.module.ts       # Modulo de conexion
│       │   │   └── migrations/        # SQL migrations versionadas
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   │   ├── auth.module.ts
│       │   │   │   ├── auth.controller.ts  # POST /auth/otp/request, /verify, /refresh
│       │   │   │   ├── auth.service.ts
│       │   │   │   ├── jwt.strategy.ts
│       │   │   │   └── otp.service.ts      # Genera y verifica OTP via Redis
│       │   │   ├── stations/
│       │   │   │   ├── stations.module.ts
│       │   │   │   ├── stations.controller.ts
│       │   │   │   ├── stations.service.ts
│       │   │   │   └── stations.gateway.ts  # Socket.io gateway ratings realtime
│       │   │   ├── reviews/
│       │   │   │   ├── reviews.module.ts
│       │   │   │   ├── reviews.controller.ts
│       │   │   │   ├── reviews.service.ts
│       │   │   │   └── ocr.processor.ts     # BullMQ worker para OCR asincronico
│       │   │   └── storage/
│       │   │       ├── storage.module.ts
│       │   │       └── storage.service.ts   # MinIO client
│       │   ├── common/
│       │   │   ├── guards/
│       │   │   │   ├── jwt-auth.guard.ts
│       │   │   │   └── turnstile.guard.ts   # Cloudflare Turnstile
│       │   │   ├── interceptors/
│       │   │   │   └── fraud.interceptor.ts # Rate limiting + fraud signals
│       │   │   └── decorators/
│       │   └── config/
│       │       └── configuration.ts         # Variables de entorno tipadas
│       ├── Dockerfile
│       └── drizzle.config.ts
│
├── docker-compose.yml                 # Desarrollo local
├── docker-compose.prod.yml            # Referencia para EasyPanel
└── CLAUDE.md
```

---

## Endpoints de la API

```
Auth
  POST /auth/otp/request        { phone }                → { message: 'OTP enviado' }
  POST /auth/otp/verify         { phone, code }          → { accessToken, refreshToken }
  POST /auth/token/refresh      { refreshToken }         → { accessToken }

Stations
  GET  /stations/nearby         ?lat&lng&radius&brand&minRating → [Station]
  GET  /stations/:id            → Station con avg_rating
  GET  /stations/:id/reviews    ?page&limit             → PaginatedReviews
  POST /stations                (admin) body: StationDto → Station
  GET  /stations/search         ?q&province             → [Station]

Reviews
  POST /reviews                 JWT + body: ReviewDto   → Review
  POST /reviews/:id/vote        { deviceHash, vote }    → ok
  POST /reviews/:id/report      { deviceHash, reason }  → ok

Storage
  POST /storage/receipt/upload  JWT + multipart/form-data → { uploadId, previewUrl }

Admin (JWT con role=admin)
  GET  /admin/reviews/pending   → [Review]
  PATCH /admin/reviews/:id      { status, note }        → Review
  GET  /admin/fraud-signals     → [FraudSignal]
```

---

## Flujo de Review con Factura

```
1. App sube la imagen directamente al endpoint de storage
   POST /storage/receipt/upload
   → MinIO guarda la imagen en bucket 'receipts' (privado)
   → Devuelve { uploadId } (UUID opaco)
   → BullMQ encola job 'ocr' con el uploadId

2. App hace POST /reviews con { uploadId, stars, comment, fuelType, stationId }
   → Guard verifica JWT (OTP completado)
   → Guard verifica Cloudflare Turnstile token
   → FraudInterceptor chequea rate limits en Redis
   → Review se inserta con status='pending'

3. BullMQ worker (ocr.processor.ts) procesa el job:
   → Descarga imagen de MinIO
   → Llama Google Cloud Vision API
   → Extrae: fecha, monto RD$, litros, nombre estacion
   → Valida contra reglas CNE (precio/litro coherente)
   → Valida que el nombre de estacion fuzzy-matchee con la seleccionada
   → Valida que el hash de la imagen no haya sido usado antes
   → Actualiza review: receipt_verified=true, status='approved' (o 'rejected' con nota)
   → Trigger PostgreSQL recalcula avg_rating de la estacion
   → Socket.io emite evento 'rating:updated' { stationId, avgRating, reviewCount }

4. App recibe el evento Socket.io y actualiza el marker en el mapa en tiempo real
```

---

## Anti-Fraude

| Regla | Donde se implementa | Accion |
|---|---|---|
| Max 1 review por estacion por semana por telefono | Redis key `rl:phone:{hash}:station:{id}` TTL 7d | 429 |
| Max 3 reviews por dia por dispositivo | Redis key `rl:device:{hash}:daily` TTL 24h | 429 |
| Max 5 reviews por dia por telefono | Redis key `rl:phone:{hash}:daily` TTL 24h | 429 |
| Factura con fecha >7 dias | OCR processor | Rechazar review |
| Factura ya usada (hash duplicado) | Redis SET `used_receipts` | Rechazar review |
| Precio incoherente con precios CNE | OCR processor (precio/litro) | Rechazar con nota |
| 5 reportes de spam en una review | Trigger en reviewVotes insert | Ocultar review |
| Texto repetido / bot pattern | `pg_trgm similarity()` en OCR processor | Flagear |
| Burst de reviews en <1 hora para una estacion | Redis sliding window | Ralentizar + exigir captcha |
| Turnstile fallido | Guard en todos los endpoints de escritura | 403 |

---

## Docker Compose (Desarrollo Local)

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgis/postgis:15-3.4
    environment:
      POSTGRES_DB: octanord
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"   # API S3
      - "9001:9001"   # Console web
    volumes:
      - minio_data:/data

  api:
    build: ./apps/api
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/octanord
      REDIS_URL: redis://redis:6379
      MINIO_ENDPOINT: minio
      MINIO_PORT: 9000
      MINIO_ACCESS_KEY: minioadmin
      MINIO_SECRET_KEY: minioadmin
      JWT_SECRET: dev-secret-change-in-prod
      JWT_EXPIRY: 15m
      JWT_REFRESH_EXPIRY: 30d
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
      - minio
    volumes:
      - ./apps/api:/app
      - /app/node_modules

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

---

## Infraestructura en EasyPanel (Produccion)

Cada servicio se despliega como una app separada en EasyPanel:

| App en EasyPanel | Imagen / Source | Puerto expuesto |
|---|---|---|
| `octanord-api` | Dockerfile en `apps/api/` | 3000 → dominio api.octanord.app |
| `octanord-postgres` | `postgis/postgis:15-3.4` | interno |
| `octanord-redis` | `redis:7-alpine` | interno |
| `octanord-minio` | `minio/minio:latest` | 9000 interno, 9001 admin interno |

- Todos los servicios en la misma **network interna** de EasyPanel (se comunican por nombre de servicio)
- SSL automatico con Let's Encrypt para `api.octanord.app`
- MinIO console (`9001`) NO expuesto publicamente, acceder via SSH tunnel
- Volumenes persistentes configurados en EasyPanel para postgres, redis y minio

---

## Variables de Entorno

```bash
# apps/mobile/.env.local
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_API_WS_URL=ws://localhost:3000
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...
EXPO_PUBLIC_CF_TURNSTILE_SITE_KEY=0x...

# apps/mobile/.env.production
EXPO_PUBLIC_API_URL=https://api.octanord.app
EXPO_PUBLIC_API_WS_URL=wss://api.octanord.app
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...
EXPO_PUBLIC_CF_TURNSTILE_SITE_KEY=0x...

# apps/api — configurar en EasyPanel environment (produccion)
# y en docker-compose.yml (local)
DATABASE_URL=postgresql://user:pass@octanord-postgres:5432/octanord
REDIS_URL=redis://octanord-redis:6379
MINIO_ENDPOINT=octanord-minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=...
MINIO_SECRET_KEY=...
MINIO_BUCKET_RECEIPTS=receipts
JWT_SECRET=...                    # openssl rand -base64 64
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=30d
PHONE_HASH_SALT=...               # openssl rand -base64 32
GOOGLE_VISION_API_KEY=AIza...
CF_TURNSTILE_SECRET_KEY=0x...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_VERIFY_SERVICE_ID=VA...
SENTRY_DSN=https://...
NODE_ENV=production
PORT=3000
```

---

## Comandos de Desarrollo

```bash
# Setup inicial (desde la raiz del monorepo)
npm install                        # instala workspaces

# Levantar infraestructura local
docker compose up -d               # PostgreSQL + Redis + MinIO

# Migraciones (Drizzle)
cd apps/api
npx drizzle-kit generate           # genera SQL desde schema.ts
npx drizzle-kit migrate            # aplica migraciones pendientes
npx drizzle-kit studio             # UI visual del schema (localhost:4983)

# Seed de gasolineras (desde OSM)
npm run seed:stations              # importa gasolineras RD desde Overpass API

# Levantar API en desarrollo
npm run start:dev                  # NestJS con hot reload (localhost:3000)

# Levantar app movil
cd apps/mobile
npx expo start --tunnel            # tunnel para dispositivo fisico

# Tests
cd apps/api
npm run test                       # unit tests
npm run test:e2e                   # integration tests (requiere Docker)

# Build produccion
cd apps/api
docker build -t octanord-api .

# Deployment a EasyPanel
# 1. Push del codigo al repo
git push origin main
# 2. En EasyPanel: trigger rebuild de octanord-api (o configurar auto-deploy via webhook)

# Migraciones en produccion
DATABASE_URL=postgresql://user:pass@host:5432/octanord npx drizzle-kit migrate

# Backup manual de PostgreSQL
docker exec octanord-postgres pg_dump -U postgres octanord > backup_$(date +%Y%m%d).sql
```

---

## Constantes del Dominio

```typescript
// apps/mobile/lib/constants.ts  y  apps/api/src/config/constants.ts

export const FUEL_BRANDS = [
  'Shell', 'Texaco', 'Puma', 'Isla', 'Sunix',
  'Esso', 'Total', 'Uno', 'Miogaz', 'Sin Marca',
] as const

export const FUEL_TYPES = {
  regular:        'Gasolina Regular',
  premium:        'Gasolina Premium',
  gasoil_optimo:  'Gasoil Optimo',
  gasoil_regular: 'Gasoil Regular',
} as const

export const DR_PROVINCES = [
  'Azua', 'Bahoruco', 'Barahona', 'Dajabon', 'Distrito Nacional',
  'Duarte', 'El Seibo', 'Elias Pina', 'Espaillat', 'Hato Mayor',
  'Hermanas Mirabal', 'Independencia', 'La Altagracia', 'La Romana',
  'La Vega', 'Maria Trinidad Sanchez', 'Monsenor Nouel', 'Monte Cristi',
  'Monte Plata', 'Pedernales', 'Peravia', 'Puerto Plata', 'Samana',
  'San Cristobal', 'San Jose de Ocoa', 'San Juan', 'San Pedro de Macoris',
  'Sanchez Ramirez', 'Santiago', 'Santiago Rodriguez', 'Santo Domingo',
  'Valverde',
] as const

// Limites anti-fraude (sincronizados entre API y documentacion)
export const FRAUD_LIMITS = {
  reviewsPerStationPerWeek: 1,
  reviewsPerDevicePerDay: 3,
  reviewsPerPhonePerDay: 5,
  receiptMaxAgeDays: 7,
  minPurchaseAmountRDP: 500,
  spamReportsToHide: 5,
  otpExpiryMinutes: 10,
  otpMaxAttempts: 3,
} as const
```

---

## Datos Iniciales de Gasolineras

```bash
# Exportar gasolineras RD desde OpenStreetMap via Overpass API
curl -s "https://overpass-api.de/api/interpreter" \
  --data '[out:json];area["ISO3166-1"="DO"]->.dr;node["amenity"="fuel"](area.dr);out body;' \
  | node apps/api/scripts/import-osm-stations.js

# El script transforma el JSON de OSM al formato de la tabla gas_stations
# y hace bulk insert via Drizzle
```

Fuentes adicionales para completar datos:
- **CNE** (Comision Nacional de Energia) — listado oficial de distribuidores de combustible en RD
- **Google Places API** — para completar horarios y fotos

---

## Seguridad

- Numeros de telefono: nunca almacenados, solo `SHA-256(phone + PHONE_HASH_SALT)`
- Facturas: almacenadas en MinIO bucket privado, acceso solo via URL prefirmada que expira en 15 minutos (para admin) — nunca expuestas publicamente
- Device fingerprint: el valor real nunca sale del dispositivo, solo su hash
- JWT: access token 15 min, refresh token 30 dias en `expo-secure-store` (keychain nativo)
- Todos los endpoints de escritura requieren Cloudflare Turnstile
- Rate limiting en Redis por IP, por telefono (hash) y por dispositivo (hash)
- Migraciones de BD con rollback: usar `drizzle-kit` con archivos SQL versionados en git
- Variables de entorno sensibles: solo en EasyPanel UI (nunca en el repo)
- Cumplimiento Ley 172-13 (RD): politica de privacidad en espanol, endpoint `DELETE /me` para borrado de datos

---

## Metricas Clave

- `avg_ocr_confidence` semanal — salud del sistema de verificacion
- `fraud_block_rate` — muy alto = friccion excesiva, muy bajo = posible fraude
- `otp_completion_rate` — objetivo >80% (si es menor, revisar UX de OTP)
- `receipt_verification_success_rate` — OCR funcionando bien
- Tiempo de respuesta `POST /reviews` — objetivo <300ms (OCR es asincronico)
- Tiempo de procesamiento OCR job — objetivo <5 segundos

---

## Decisiones de Disenio

1. **NestJS sobre Express puro**: estructura modular, Guards y Interceptors nativos facilitan auth y rate limiting sin middleware spaghetti
2. **Drizzle sobre Prisma**: mas ligero, queries SQL type-safe sin proxy de runtime, mejor para PostgreSQL avanzado con PostGIS
3. **OCR asincronico con BullMQ**: la review se publica inmediatamente en estado `pending`, el badge de verificacion aparece segundos despues — mejor UX que bloquear el submit
4. **MinIO en lugar de S3**: self-hosted, compatible con SDK `aws-sdk`/`@aws-sdk/client-s3`, cero costo, datos no salen del servidor
5. **Redis para OTP y rate limits**: TTL nativo hace que el OTP y los contadores expiren solos sin cron jobs
6. **Socket.io para ratings en tiempo real**: cuando alguien califica una estacion, el mapa de todos los usuarios activos se actualiza al instante
7. **Sin login social (Google/Apple)**: reduce friccion y evita datos de terceros
8. **WhatsApp OTP preferido**: en RD WhatsApp tiene mayor penetracion que SMS tradicional
9. **Review sin factura posible pero sin badge**: no bloqueamos participacion, incentivamos verificacion
10. **PostGIS `ST_DWithin` con GIST index**: la busqueda de estaciones cercanas es O(log n) en lugar de O(n), critico para escalar a miles de estaciones

---

## Skills Necesarios por Area

### TypeScript / Node.js
| Skill | Nivel | Donde se aplica |
|---|---|---|
| TypeScript avanzado (generics, decorators, utility types) | Alto | Todo el proyecto |
| NestJS (modules, guards, interceptors, pipes, gateways) | Alto | `apps/api` — estructura base de la API |
| Drizzle ORM (schema, migrations, queries tipadas, joins) | Medio-Alto | `apps/api/src/db` — acceso a datos |
| BullMQ (queues, workers, jobs con retry) | Medio | `apps/api` — procesamiento asincronico de OCR |
| Socket.io server (namespaces, rooms, eventos) | Medio | `apps/api` — ratings en tiempo real |
| JWT (firma, verificacion, refresh token rotation) | Medio | `apps/api/src/modules/auth` |

### React Native / Mobile
| Skill | Nivel | Donde se aplica |
|---|---|---|
| React Native core (FlatList, StyleSheet, Platform) | Alto | `apps/mobile/components` |
| Expo SDK y EAS (managed workflow, plugins, builds, submit) | Alto | Todo el frontend |
| Expo Router v4 (layouts, tabs, grupos de rutas, params) | Alto | `apps/mobile/app/` |
| NativeWind v4 (clases Tailwind en RN, temas) | Medio | Todos los componentes |
| react-native-maps (markers, clustering, camera, overlays) | Medio-Alto | `components/map/` |
| TanStack Query v5 (queries, mutations, invalidation, optimistic updates) | Alto | `lib/queries/` |
| Zustand (stores, slices, persistencia con expo-secure-store) | Medio | `lib/stores/` |
| expo-camera + expo-image-picker (permisos, compresion) | Medio | `components/review/ReceiptUploader` |
| Socket.io client en React Native | Medio | `lib/socket.ts` |

### Base de Datos
| Skill | Nivel | Donde se aplica |
|---|---|---|
| PostgreSQL 15 (indices, triggers, funciones PL/pgSQL, JSONB) | Alto | Schema y migraciones |
| PostGIS (ST_DWithin, ST_MakePoint, GIST index, geografia vs geometria) | Medio-Alto | Queries de proximidad de gasolineras |
| Redis (TTL, hash, sets, sorted sets, Lua scripts para atomicidad) | Medio | Rate limiting, OTP, BullMQ |
| Estrategia de migraciones con rollback (Drizzle Kit) | Medio | `apps/api/src/db/migrations/` |

### DevOps / Infraestructura
| Skill | Nivel | Donde se aplica |
|---|---|---|
| Docker y Docker Compose (volumes, networks, healthchecks) | Medio-Alto | Dev local y produccion |
| EasyPanel (apps, services, env vars, domains, SSL, volumes) | Basico-Medio | Hosting produccion |
| MinIO (buckets, politicas, presigned URLs, SDK S3-compatible) | Medio | Almacenamiento de facturas |
| Variables de entorno por entorno (local / produccion) | Basico | Configuracion |
| Backup de PostgreSQL (`pg_dump`, restauracion) | Basico | Mantenimiento produccion |

### Servicios Externos / Integraciones
| Skill | Nivel | Donde se aplica |
|---|---|---|
| Google Maps SDK mobile (markers, clustering, camera bounds) | Medio | App movil |
| Google Cloud Vision API (document text detection, JSON response parsing) | Medio | OCR de facturas en `ocr.processor.ts` |
| Twilio Verify API (OTP request/check, canales SMS y WhatsApp) | Basico-Medio | `apps/api/src/modules/auth/otp.service.ts` |
| Cloudflare Turnstile (token del cliente, verificacion server-side) | Basico | Guard en endpoints de escritura |

### Seguridad
| Skill | Nivel | Donde se aplica |
|---|---|---|
| Hashing criptografico (SHA-256 con salt, timing-safe compare) | Medio | Anonimizacion de telefono y device ID |
| Rate limiting distribuido (Redis sliding window) | Medio | `fraud.interceptor.ts` |
| Sanitizacion de inputs (class-validator, Zod en el cliente) | Medio | Todos los DTOs y formularios |
| Manejo seguro de JWT (httpOnly no aplica en mobile, secure storage) | Medio | `lib/stores/authStore.ts` |
| Presigned URLs con TTL corto (MinIO/S3) | Basico-Medio | Acceso a facturas |

### Producto / UX
| Skill | Nivel | Donde se aplica |
|---|---|---|
| Diseno de flujos de onboarding sin friccion | Medio | Flujo OTP |
| Animaciones en React Native (Reanimated 3, Animated API) | Basico-Medio | Feedback visual de reviews, markers |
| Internacionalizacion en espanol dominicano | Basico | Textos, mensajes de error |
| Manejo de permisos mobile (ubicacion, camara) | Basico | `expo-location`, `expo-camera` |

---

## MCP Servers Recomendados

Los MCP servers permiten que Claude interactue directamente con los servicios del proyecto durante el desarrollo, sin necesidad de cambiar de contexto.

### Esenciales

#### 1. `@modelcontextprotocol/server-postgres`
**Para que sirve:** Conectarse directamente a PostgreSQL para ejecutar queries, inspeccionar el schema, debuggear datos y probar funciones PostGIS durante desarrollo.

**Casos de uso en OctanoRD:**
- Verificar que los triggers de recalculo de rating funcionan correctamente
- Probar queries `ST_DWithin` con datos reales
- Inspeccionar reviews en estado `pending` o `flagged`
- Debuggear datos de OCR en la columna `ocr_extracted` (JSONB)

```json
// .claude/settings.json — agregar en mcpServers
{
  "postgres": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-postgres",
             "postgresql://postgres:postgres@localhost:5432/octanord"]
  }
}
```

#### 2. `@modelcontextprotocol/server-filesystem`
**Para que sirve:** Lectura y escritura de archivos del proyecto con contexto completo. Util para generar archivos de migracion, componentes y configuracion.

```json
{
  "filesystem": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem",
             "C:/Users/Alejo/Documents/Repositories/OctanoRD"]
  }
}
```

#### 3. `@modelcontextprotocol/server-github`
**Para que sirve:** Gestionar el repositorio, crear issues, PRs, revisar el historial y automatizar el workflow de git directamente desde el chat.

**Casos de uso en OctanoRD:**
- Crear issues para bugs encontrados durante desarrollo
- Revisar PRs con cambios en migraciones SQL (criticos)
- Gestionar releases y tags para builds de EAS

```json
{
  "github": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-github"],
    "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_..." }
  }
}
```

### Muy Utiles

#### 4. `redis-mcp` (community: `@gildas-lormeau/mcp-server-redis`)
**Para que sirve:** Inspeccionar y manipular Redis durante desarrollo. Critico para debuggear el sistema anti-fraude y los OTP.

**Casos de uso en OctanoRD:**
- Ver keys de rate limiting activos (`rl:phone:*`, `rl:device:*`)
- Verificar que los OTP se almacenan con el TTL correcto
- Inspeccionar colas de BullMQ (jobs pendientes, fallidos)
- Limpiar datos de prueba sin necesidad de `redis-cli`

```json
{
  "redis": {
    "command": "npx",
    "args": ["-y", "mcp-server-redis", "--url", "redis://localhost:6379"]
  }
}
```

#### 5. `@modelcontextprotocol/server-fetch`
**Para que sirve:** Hacer HTTP requests desde el chat. Esencial para importar datos de gasolineras y probar APIs externas.

**Casos de uso en OctanoRD:**
- Ejecutar queries a Overpass API para obtener gasolineras de RD desde OSM
- Probar los endpoints de la API durante desarrollo
- Consultar documentacion de Google Vision API, Twilio, etc.

```json
{
  "fetch": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-fetch"]
  }
}
```

#### 6. `@modelcontextprotocol/server-puppeteer`
**Para que sirve:** Automatizar un browser. Util para probar el panel de MinIO y el dashboard de BullMQ.

**Casos de uso en OctanoRD:**
- Navegar la consola web de MinIO (localhost:9001) para verificar uploads
- Tomar screenshots del mapa de gasolineras en la version web (si se hace)
- Automatizar pruebas de flujos en Expo web

```json
{
  "puppeteer": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
  }
}
```

### Opcionales pero Convenientes

#### 7. `@cloudflare/mcp-server-cloudflare`
**Para que sirve:** Gestionar recursos de Cloudflare (Turnstile, R2, Workers) directamente.

**Casos de uso en OctanoRD:**
- Ver analytics de Cloudflare Turnstile (cuantos challenges se sirven)
- Gestionar reglas de WAF si se expone la API publicamente

#### 8. `mcp-server-docker` (community)
**Para que sirve:** Gestionar contenedores Docker sin salir del chat.

**Casos de uso en OctanoRD:**
- Ver logs de contenedores (`postgres`, `redis`, `api`)
- Reiniciar servicios sin abrir otra terminal
- Inspeccionar el estado de healthchecks

```json
{
  "docker": {
    "command": "npx",
    "args": ["-y", "mcp-server-docker"]
  }
}
```

### Configuracion Completa `.claude/settings.json`

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres",
               "postgresql://postgres:postgres@localhost:5432/octanord"]
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem",
               "C:/Users/Alejo/Documents/Repositories/OctanoRD"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_..." }
    },
    "redis": {
      "command": "npx",
      "args": ["-y", "mcp-server-redis", "--url", "redis://localhost:6379"]
    },
    "fetch": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"]
    },
    "puppeteer": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
    },
    "docker": {
      "command": "npx",
      "args": ["-y", "mcp-server-docker"]
    }
  }
}
```

> **Nota**: Los MCP locales (postgres, redis, docker) solo son utiles cuando Docker Compose esta corriendo. Los MCP de fetch y filesystem son utiles en cualquier momento.
