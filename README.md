# pestkillwebsite

Website for **PestKill Pest Solutions**, a professional pest control company based in Jaipur, Rajasthan.

## Structure

- `frontend/` — React + Vite website
- `backend/` — Express API with SQLite

## Run locally

```bash
# Backend
cd backend
cp .env.example .env    # then fill in JWT_SECRET with a long random value
npm install
npm start

# Frontend (in a second terminal)
cd frontend
npm install
npm run dev
```
