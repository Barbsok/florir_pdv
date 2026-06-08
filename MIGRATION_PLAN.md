# Migration Plan: Supabase → Raw PostgreSQL + Docker Compose

## Project Summary

The app is a Brazilian POS (Point of Sale) system — React frontend + Express backend. It uses Supabase purely as a PostgreSQL host with the PostgREST API. No Supabase-specific features (Auth, Realtime, Storage) are in use, so this migration is clean.

---

## What Changes

### 1. `docker-compose.yml` (new file)
- `postgres` service: PostgreSQL 16-alpine, volume-mounted, with env vars for DB credentials
- `app` service: Node.js container running the Express + Vite app, depending on postgres
- `Dockerfile` (new): multi-stage build — Vite frontend + esbuild server bundle, then runtime image
- Init script: mount the SQL schema so Postgres auto-initializes on first run

### 2. `src/utils/supabase_schema.sql` → `db/init.sql` (rename + fix)
- Move schema to `db/init.sql` (standard Docker Postgres convention)
- **Add the missing `clientes` table** (used in code but absent from schema):
  ```sql
  CREATE TABLE clientes (
    idcliente SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cpf VARCHAR(14) UNIQUE,
    email VARCHAR(100),
    telefone VARCHAR(20),
    ativo BOOLEAN DEFAULT TRUE,
    datacriacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  ```
- Add `idcliente INTEGER REFERENCES clientes` column to `pedidos`
- Remove all `GRANT ... TO anon, authenticated` statements (Supabase roles)
- Remove all `ALTER TABLE ... DISABLE ROW LEVEL SECURITY` statements (not needed without RLS)

### 3. `server/supabase.ts` → `server/db.ts` (replace)
- Drop `@supabase/supabase-js` entirely
- Use the `postgres` package (already in `package.json`) to create a pool connected via `DATABASE_URL`
- Export a `sql` tagged-template function for queries
- Keep the `isDatabaseConfigured()` guard for graceful fallback

### 4. `server.ts` (rewrite all DB calls)

Replace every Supabase method-chain with raw SQL. Example pattern:

```typescript
// Before (Supabase)
const { data } = await supabase.from('produtos').select('*, categorias(*)').eq('ativo', true)

// After (raw SQL)
const produtos = await sql`
  SELECT p.*, c.nome AS categoria_nome
  FROM produtos p LEFT JOIN categorias c ON p.idcategoria = c.idcategoria
  WHERE p.ativo = true
`
```

Endpoints to rewrite (10 total):

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/login` | POST | Employee authentication |
| `/api/bootstrap` | GET | Load all initial data |
| `/api/sales` | POST | Create sale + call stored procedure |
| `/api/stock-entries` | POST | Register stock replenishment |
| `/api/products` | POST | Create product with dynamic category |
| `/api/products/:id/toggle-active` | PUT | Enable/disable product |
| `/api/config/users` | GET, POST | List and create employees |
| `/api/config/users/:id/toggle-active` | PUT | Enable/disable employee |
| `/api/config/customers` | GET, POST | List and create customers |
| `/api/config/customers/:id/toggle-active` | PUT | Enable/disable customer |

### 5. `src/utils/supabase.ts` (delete)

The frontend Supabase client is imported nowhere and does nothing. Remove it.

### 6. `.env.example` (update)

```diff
- VITE_SUPABASE_URL=...
- VITE_SUPABASE_PUBLISHABLE_KEY=...
+ POSTGRES_USER=postgres
+ POSTGRES_PASSWORD=postgres
+ POSTGRES_DB=flora_pdv
  DATABASE_URL=postgresql://postgres:postgres@localhost:5432/flora_pdv
  GEMINI_API_KEY=...
```

### 7. `package.json` (cleanup)
- Remove `@supabase/supabase-js` dependency
- Add a `docker:up` script: `docker compose up --build`

### 8. `test-rpc.ts` and `fix_admin_supabase.sql` (delete)
- `test-rpc.ts` tests the Supabase RPC endpoint directly — no longer needed
- `fix_admin_supabase.sql` is a Supabase-specific admin patch — replaced by `db/init.sql`

---

## File Change Summary

| File | Action |
|------|--------|
| `docker-compose.yml` | Create |
| `Dockerfile` | Create |
| `db/init.sql` | Create (from schema + clientes fix) |
| `server/db.ts` | Create (postgres client) |
| `server/supabase.ts` | Delete |
| `server.ts` | Rewrite DB calls (~300 lines) |
| `src/utils/supabase.ts` | Delete |
| `src/utils/supabase_schema.sql` | Delete (replaced by `db/init.sql`) |
| `fix_admin_supabase.sql` | Delete (obsolete) |
| `test-rpc.ts` | Delete |
| `.env.example` | Update |
| `package.json` | Remove supabase dep, add script |

---

## Schema Issues Found

The current `supabase_schema.sql` is **missing the `clientes` table**, but the backend code references it extensively:

- `GET /api/config/customers` — queries `clientes`
- `POST /api/config/customers` — inserts into `clientes`
- `PUT /api/config/customers/:id/toggle-active` — updates `clientes`
- `GET /api/bootstrap` — joins `pedidos` with `clientes`

The `pedidos` table is also missing a `idcliente` foreign key column. Both will be added in `db/init.sql`.

---

## Local Development Workflow After Migration

```bash
# Start everything (Postgres + App)
docker compose up

# App available at:   http://localhost:3000
# Postgres available: localhost:5432

# Reset the database (wipes volumes)
docker compose down -v && docker compose up

# Run only the database (useful for local dev without Docker app)
docker compose up postgres
```

---

## What Does NOT Change

- All in-memory fallback logic (`src/data.ts`) — stays as-is
- The stored procedure `sp_finalizar_pedido` — standard PostgreSQL, no changes needed
- The trigger `trg_verificar_estoque` — standard PostgreSQL, no changes needed
- Frontend components — no Supabase usage in the UI layer
- All business logic in `server.ts` — only the DB query syntax changes
- The `postgres` npm package — already a dependency, just not used yet
