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

## Deploy on Render
The repo includes a `render.yaml` Blueprint that creates two services: `lifelink-api` (Node web service, Socket.IO included) and `lifelink-web` (static site).

1. Create a free MongoDB Atlas cluster, add a database user, and allow network access from `0.0.0.0/0`. Copy the connection string.
2. Push this repo to GitHub. In Render choose **New > Blueprint** and select the repo.
3. Fill in the prompted values:
   - `MONGO_URI`: your Atlas connection string
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_PHONE`: the admin account to create (created automatically on first start)
   - `CLIENT_URL`: leave blank for now
   - `VITE_SOCKET_URL`: leave blank for now
4. After the first deploy, set `CLIENT_URL` on `lifelink-api` to the frontend URL (e.g. `https://lifelink-web.onrender.com`) and `VITE_SOCKET_URL` on `lifelink-web` to the API URL (e.g. `https://lifelink-api.onrender.com`). Then redeploy the frontend (Vite bakes the variable in at build time).
5. Open the frontend URL and log in with the admin credentials.

Notes: the free API instance sleeps after about 15 minutes idle, so the first request can take 30-60 seconds. Service names must be unique on Render, so rename them in `render.yaml` if taken, and update the URLs above to match.
