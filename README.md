# Email Scheduler

A recruiter-ready full-stack email scheduling application built with React, Express, MongoDB, Redis, BullMQ, JWT authentication, and Ethereal Email.

## Features

### Backend
- JWT authentication
- Schedule emails for a future date/time
- MongoDB persistence for users and email records
- Redis + BullMQ delayed jobs
- Dedicated BullMQ worker
- Configurable worker concurrency
- API rate limiting
- Email status tracking: `SCHEDULED`, `PROCESSING`, `SENT`, `FAILED`
- Ethereal Email/Nodemailer integration
- CORS, Helmet, validation and centralized error handling
- Health endpoint

### Frontend
- Login/register
- Dashboard summary
- Compose and schedule email
- Scheduled email table
- Sent email table
- Failed email table
- Refresh controls
- Responsive UI
- Protected routes

---

# 1. Prerequisites

Install:

- Node.js 20+
- Docker Desktop
- Git

No local Redis or MongoDB installation is required if Docker Desktop is available.

---

# 2. Start Redis and MongoDB

From the project root:

```bash
docker compose up -d
```

Check:

```bash
docker ps
```

You should see:

- `email-scheduler-redis`
- `email-scheduler-mongo`

---

# 3. Backend setup

```bash
cd backend
npm install
```

Copy the environment template:

Windows CMD:

```cmd
copy .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

Start the API:

```bash
npm run dev
```

The API runs on:

```text
http://localhost:5000
```

Start the BullMQ worker in a second terminal:

```bash
cd backend
npm run worker
```

---

# 4. Ethereal Email setup

Ethereal is a fake SMTP service designed for testing email flows without sending real production email.

1. Go to `https://ethereal.email`
2. Create a test account.
3. Copy the SMTP username and password.
4. Put them in `backend/.env`.

Example:

```env
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_ethereal_username
SMTP_PASSWORD=your_ethereal_password
MAIL_FROM="Email Scheduler <no-reply@example.test>"
```

If SMTP credentials are left empty, the worker will attempt to create a temporary Ethereal account automatically and print the generated account details in the worker terminal.

After an email is sent, the worker prints an Ethereal preview URL.

---

# 5. Frontend setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

The frontend expects:

```env
VITE_API_URL=http://localhost:5000/api
```

The included `.env.example` already contains this value.

---

# 6. Architecture

```text
                         ┌───────────────────┐
                         │      React        │
                         │     Frontend      │
                         └─────────┬─────────┘
                                   │ HTTP/JWT
                                   ▼
                         ┌───────────────────┐
                         │     Express       │
                         │       API         │
                         └──────┬─────┬──────┘
                                │     │
                         records│     │jobs
                                ▼     ▼
                         ┌─────────┐ ┌───────────┐
                         │ MongoDB │ │   Redis   │
                         │persist. │ │  BullMQ   │
                         └─────────┘ └─────┬─────┘
                                           │
                                           ▼
                                  ┌────────────────┐
                                  │ BullMQ Worker  │
                                  │ concurrency=N  │
                                  └───────┬────────┘
                                          │ SMTP
                                          ▼
                                  ┌────────────────┐
                                  │ Ethereal Email │
                                  └────────────────┘
```

## How scheduling works

1. The user submits an email and future `scheduledAt`.
2. Express validates the request and stores an email document in MongoDB.
3. Express creates a BullMQ delayed job in Redis using the email ID as the job ID.
4. BullMQ keeps the delayed job until its delay expires.
5. The worker receives the job.
6. The worker marks the database record `PROCESSING`.
7. Nodemailer sends the email through Ethereal SMTP.
8. The worker marks the record `SENT` and stores the preview URL.

## Persistence after restart

Persistence exists at two levels:

### Database
MongoDB stores:
- user
- recipient
- subject
- body
- scheduled time
- status
- timestamps
- error/preview information

### Queue
BullMQ stores delayed job information in Redis. Redis is configured with AOF persistence in Docker Compose.

Therefore, stopping/restarting the Node API does not remove future scheduled jobs.

Important distinction:

- MongoDB = source of truth for email records/status.
- Redis/BullMQ = source of truth for queued/delayed execution work.

The worker can be stopped and restarted while Redis retains delayed jobs.

## Rate limiting

The API uses `express-rate-limit`.

Configured values are controlled through:

```env
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
```

This means a client can make up to 100 requests in the configured one-minute window before receiving HTTP 429.

Login/register also use a stricter limiter.

## Concurrency

The worker uses BullMQ concurrency:

```env
WORKER_CONCURRENCY=5
```

At most five jobs can be actively processed by the worker at the same time.

If more jobs are ready than available worker slots, remaining jobs wait in the queue.

---

# 7. API endpoints

## Authentication

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

## Emails

```text
POST /api/emails/schedule
GET  /api/emails
GET  /api/emails/scheduled
GET  /api/emails/sent
GET  /api/emails/failed
GET  /api/emails/:id
DELETE /api/emails/:id
```

## Health

```text
GET /health
```

---

# 8. Demo video — maximum 5 minutes

Record one video and place it at:

```text
demo/email-scheduler-demo.mp4
```

Recommended timeline:

### 0:00–0:30
Introduce the stack and architecture.

### 0:30–1:15
Register/login and show the dashboard.

### 1:15–2:00
Compose an email and schedule it for 30–60 seconds in the future.

Show the Scheduled table.

### 2:00–3:20
Perform the restart test:

1. Schedule a future email.
2. Stop the API and/or worker.
3. Start them again.
4. Show that the scheduled record still exists.
5. Wait until the scheduled time.
6. Show the worker processing the job.
7. Show the Sent table.
8. Open the Ethereal preview URL.

### 3:20–4:10
Demonstrate concurrency/rate limiting if time allows.

### 4:10–4:50
Briefly show:
- queue configuration
- worker
- rate limiter
- database model

### 4:50–5:00
Summarize persistence and trade-offs.

---

# 9. Submission checklist

Before sharing the repository:

- [ ] Repository is PRIVATE
- [ ] `Mitrajit` has access
- [ ] `Yadav036` has access
- [ ] `.env` is NOT committed
- [ ] `.env.example` IS committed
- [ ] README is complete
- [ ] Backend starts successfully
- [ ] Worker starts successfully
- [ ] Frontend starts successfully
- [ ] Redis starts successfully
- [ ] MongoDB starts successfully
- [ ] Registration works
- [ ] Login works
- [ ] Email scheduling works
- [ ] Scheduled table works
- [ ] Sent table works
- [ ] Failed table works
- [ ] Restart scenario works
- [ ] Ethereal preview works
- [ ] Rate limiting works
- [ ] Concurrency is configurable
- [ ] Demo video is <= 5 minutes
- [ ] Assumptions/trade-offs are documented

---

# 10. Assumptions and trade-offs

1. Ethereal Email is used instead of a production email provider because this is a development/assessment project.
2. MongoDB stores application state and email records.
3. Redis/BullMQ stores scheduled execution jobs.
4. Redis uses AOF in Docker for persistence.
5. Worker concurrency is configurable rather than hard-coded.
6. The application uses at-least-once style job processing. A real production system would add stronger idempotency/provider-level safeguards to eliminate duplicate delivery in crash-after-send scenarios.
7. Rate-limit values are intentionally configurable for testing.
8. Email bodies are stored as plain text for simplicity.
9. Authentication uses JWT stored by the browser for this assessment. A production application may prefer secure, HTTP-only cookies depending on its security architecture.

---

# 11. Suggested Git history

Use meaningful commits rather than one giant commit:

```text
feat: initialize backend and frontend
feat: add authentication
feat: add email scheduling API
feat: add BullMQ delayed jobs
feat: add persistent MongoDB email records
feat: add email worker and Ethereal SMTP
feat: add rate limiting and concurrency controls
feat: build scheduling dashboard
feat: add scheduled and sent email tables
docs: add setup and architecture documentation
docs: add demo video
```

---

# 12. Final submission message

After granting repository access, send:

> Hi,
>
> I have completed the Email Scheduler assignment and added the implementation to the private GitHub repository.
>
> The project includes:
> - Express backend
> - MongoDB persistence
> - Redis + BullMQ scheduling
> - Dedicated worker with configurable concurrency
> - API rate limiting
> - Ethereal Email integration
> - React frontend with authentication, dashboard, compose, scheduled and sent email views
> - Restart/persistence handling
> - README with setup, architecture, assumptions and trade-offs
> - Demo video covering the requested scenarios
>
> Repository access has been granted to the requested GitHub users.
>
> Thank you for the opportunity.

---

# 13. Important GitHub submission rule

Before pushing:

```bash
git status
```

Make sure you **do not see**:

```text
backend/.env
frontend/.env
node_modules/
```

Then:

```bash
git add .
git commit -m "feat: complete email scheduler assignment"
git branch -M main
git remote add origin YOUR_PRIVATE_REPOSITORY_URL
git push -u origin main
```

**Do not put Ethereal passwords, JWT secrets, Mongo credentials, or Redis credentials into GitHub.** Use `.env.example` with placeholders only.
