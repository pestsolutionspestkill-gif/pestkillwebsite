# Pest Kill Pest Solutions - Complete Platform

A production-grade platform combining pest control services, e-commerce, user dashboard, and admin panel.

## Project Structure

```
├── shared/
│   └── businessConfig.js
├── backend/
│   ├── src/
│   │   ├── models/         (User, Service, Complaint, Product, Order)
│   │   ├── routes/        (API endpoints)
│   │   ├── middleware/    (Auth)
│   │   └── server.js
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/   (Navbar, Footer)
    │   ├── pages/      (Home, Services, Shop, About, Contact...)
    │   ├── context/   (AuthContext)
    │   └── styles/
    └── package.json
```

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

## Setup & Run

### 1. Backend

```bash
cd backend
npm install
npm start
```

Runs on: http://localhost:5000

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on: http://localhost:3000

## Features

- **Marketing Website**: Home, Services, Shop, About, Contact
- **E-commerce**: Product listing, cart, checkout
- **User Dashboard**: Service history, complaints, orders
- **Admin Panel**: Manage all data

## Business Configuration

Update `/shared/businessConfig.js` to change:
- Phone number, email, address
- Service coverage cities
- Brands and formulations

## Environment Variables (backend/.env)

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/pestkill
JWT_SECRET=your_secret_key_here
```