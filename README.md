# LifeLink - Emergency Blood Donor & SOS Alert Directory (MERN)

```
backend/   Express + MongoDB + Socket.IO API   (port 5000)
frontend/  React + Vite + Tailwind (Figma Make) (port 8443)
```

## 1. Backend
```bash
cd backend
cp .env.example .env     # set MONGO_URI and JWT_SECRET
npm install
npm run seed:admin       # admin@example.com / Admin@12345 (change in .env)
npm run dev
```

## 2. Frontend
```bash
cd frontend
cp .env.example .env     # only needed if the backend is not on localhost:5000
npm install
npm run dev                # http://localhost:8443
```
The frontend dev server is fixed to port 8443, which is already allowed by the backend's `CLIENT_URL`.

## Try it
1. Register two donors with the **same locality** and blood group (e.g. O+, "Ramapuram") in two browsers.
2. Post an SOS from one account for O+ in "Ramapuram"; the other gets a live alert and the card appears on the SOS Board.
3. Log in as the admin to verify donors and moderate SOS posts.

API reference: `backend/README.md`.
