# pestkillwebsite

Website and operations console for **PestKill Pest Solutions**, Jaipur.

- `frontend/` — React + Vite website, customer dashboard and Owner/Manager console
- `backend/` — Express API with SQLite, role-based access control and audit logging

## First-time setup

```bash
# 1. Backend
cd backend
cp .env.example .env          # set JWT_SECRET to a long random value
npm install
npm run create-owner          # creates your Owner login (asks for name, email, mobile, password)
npm start                     # API on http://localhost:5000

# 2. Frontend (second terminal)
cd frontend
npm install
npm run dev                   # website on http://localhost:3000
```

Sign in at `/login`. Owners and managers land on `/admin`; customers land on `/dashboard`.

## Roles

| Role | Access |
|------|--------|
| Owner | Everything: bookings, customers, team, permissions, audit log, revenue |
| Manager | Only what the owner grants in **Admin → Permissions**. Managers can never create staff, change roles, see revenue or edit permissions. |
| Client | Own bookings, complaints, orders and profile |

Permissions are checked on the server for every request, and changes apply immediately.

## Where website forms go

Book Online, inspection, quote, contact and careers forms are saved to the database and appear in
**Admin → Bookings / Applications**. If the API cannot be reached, the form falls back to WhatsApp
so no enquiry is lost.
