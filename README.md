# pestkillwebsite

Website and operations console for **PestKill Pest Solutions**, Jaipur.

- `frontend/` — React + Vite website, customer dashboard, staff console, printable invoices and certificates
- `backend/` — Express API on PostgreSQL, role-based access control and audit logging. In production it also serves the built website.

## Run locally

```bash
# 1. Backend
cd backend
cp .env.example .env          # set JWT_SECRET to a long random value; leave DATABASE_URL empty
npm install
npm run create-owner          # creates your Owner login (asks for name, email, mobile, password)
npm start                     # API on http://localhost:5000

# 2. Frontend (second terminal)
cd frontend
npm install
npm run dev                   # website on http://localhost:3000
```

Without `DATABASE_URL` the backend uses an embedded PostgreSQL stored in `backend/data/pglite`
(never committed). Set `DATABASE_URL` to use a real PostgreSQL server instead — the SQL is identical.

## Deploy on Render (free) with Neon PostgreSQL (free)

1. **Database** — create a free project at [neon.tech](https://neon.tech) and copy the
   **connection string** (`postgresql://…?sslmode=require`).
2. **Website** — on [render.com](https://render.com): **New → Blueprint**, choose this repo.
   `render.yaml` sets everything up; fill in the values it asks for:
   - `DATABASE_URL` — the Neon connection string
   - `CLIENT_ORIGIN` — your Render URL, e.g. `https://pestkill.onrender.com`
   - `OWNER_NAME`, `OWNER_EMAIL`, `OWNER_PHONE`, `OWNER_PASSWORD` — your first Owner login
3. After the first deploy, sign in at `/login`, then delete `OWNER_PASSWORD` from Render's
   environment (the account stays; the value is only used when no Owner exists).

Manual setup instead of a Blueprint (New → Web Service):

| Setting | Value |
|---|---|
| Build Command | `cd frontend && npm ci && npm run build && cd ../backend && npm ci` |
| Start Command | `cd backend && npm start` |
| Health Check Path | `/api/health` |
| Environment | `JWT_SECRET` (32+ random characters), `TRUST_PROXY=1`, `DATABASE_URL`, `CLIENT_ORIGIN`, `OWNER_*` |

Do not set `NODE_ENV=production` at build time (the frontend build needs its dev tools).
Render's free web service sleeps after 15 minutes without visitors; the first visit after that
takes about a minute. Data is safe in Neon either way.

**Moving old data:** `npm run migrate-sqlite` (in `backend/`, with `DATABASE_URL` set) copies an old
`pestkill.db` SQLite file into PostgreSQL. It needs `npm install better-sqlite3 --no-save` first.

## Roles

| Role | Access |
|------|--------|
| Owner | Everything: analytics, bookings, schedule, invoices, customers, team, permissions, audit log, revenue |
| Manager | Only what the owner grants in **Admin → Permissions**. Managers can never create staff, change roles, see revenue or edit permissions. |
| Technician | Own assigned jobs: visit details, directions, visit report, mark completed |
| Client | Own bookings, invoices, treatment certificates, complaints, orders and profile |

Permissions are checked on the server for every request, and changes apply immediately.
Customers see bookings and invoices linked to their account (bookings made while signed in,
or invoices created from those bookings).

## Where website forms go

Book Online, inspection, quote, contact and careers forms are saved to the database and appear in
**Admin → Bookings / Applications**. If the API cannot be reached, the form falls back to WhatsApp
so no enquiry is lost.
