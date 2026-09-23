# Quick Windows Run Guide

## Terminal 1 — infrastructure

From the project root:

```powershell
docker compose up -d
```

## Terminal 2 — backend

```powershell
cd backend
npm install
Copy-Item .env.example .env
npm run dev
```

## Terminal 3 — worker

```powershell
cd backend
npm run worker
```

## Terminal 4 — frontend

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Open:

http://localhost:5173

For Ethereal, add credentials to `backend/.env`, or leave them blank and the worker will create a temporary test account.
