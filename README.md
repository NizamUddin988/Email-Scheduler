# Email Scheduler

A full-stack email scheduling application that lets users compose emails, schedule them for later delivery, and track scheduled and sent emails from a simple dashboard.

The project uses **Express.js** for the backend API, **MongoDB** for persistent application data, **Redis + BullMQ** for scheduling and background job processing, and **Ethereal Email** for safe email testing during development.

---

## Tech Stack

### Backend

* Node.js
* Express.js
* MongoDB
* Redis
* BullMQ
* Nodemailer
* JWT Authentication

### Frontend

* React
* JavaScript
* HTML
* CSS

### Infrastructure

* Docker / Docker Compose
* Ethereal Email for SMTP testing

---

# Project Structure

```text
email-scheduler/
│
├── backend/
│   ├── src/
│   │   ├── server.js
│   │   ├── worker.js
│   │   └── ...
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   ├── package.json
│   └── ...
│
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

# Prerequisites

Make sure the following are installed:

* Node.js 18+
* npm
* Docker Desktop
* Git

MongoDB and Redis can be started through Docker Compose, so they don't need to be installed separately.

---

# Running the Project

There are two ways to run the backend dependencies.

## Option 1 — Docker Compose

From the project root:

```bash
docker compose up -d
```

This starts the services configured in `docker-compose.yml`.

Check the running containers:

```bash
docker compose ps
```

To stop them:

```bash
docker compose down
```

---

# Backend Setup

Open a terminal in the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```env
PORT=5000

MONGO_URI=mongodb://localhost:27017/email_scheduler

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=your_jwt_secret

SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your_ethereal_username
SMTP_PASS=your_ethereal_password
```

Start the Express server:

```bash
npm start
```

The backend API will normally be available at:

```text
http://localhost:5000
```

---

# Starting the BullMQ Worker

The API and the worker are separate processes.

Open another terminal:

```bash
cd backend
```

Then run:

```bash
npm run worker
```

The worker connects to Redis and listens for scheduled email jobs.

A successful startup should look similar to:

```text
MongoDB connected
Worker ready with concurrency=5
```

Keeping the worker running is important because it is responsible for processing scheduled jobs and sending the emails.

---

# Frontend Setup

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will normally be available at the URL shown by the frontend development server, commonly:

```text
http://localhost:5173
```

Make sure the backend is running before using features that require API access.

---

# Ethereal Email Setup

For development and testing, this project can use **Ethereal Email** instead of sending emails to real inboxes.

Ethereal provides a fake SMTP service where sent messages can be viewed through a browser preview.

## Creating an Ethereal Account

Visit:

https://ethereal.email/

Create a test account and copy the SMTP credentials.

Add them to the backend `.env` file:

```env
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your_ethereal_username
SMTP_PASS=your_ethereal_password
```

Restart the backend/worker after changing environment variables.

When an email is processed successfully, the worker can provide an Ethereal preview URL similar to:

```text
Email sent successfully
Preview: https://ethereal.email/message/...
```

Opening the preview URL allows you to inspect the email.

### Development fallback

If SMTP credentials are not supplied, the application can create a temporary Ethereal account automatically. This is useful for quickly testing the scheduler without configuring a permanent SMTP account.

For production, real SMTP credentials or a transactional email provider should be configured instead.

---

# How Scheduling Works

The scheduling flow is divided between the API, database, Redis, and the background worker.

```text
User
  │
  ▼
Frontend
  │
  ▼
Express API
  │
  ├──────────────► MongoDB
  │                Stores email/job information
  │
  ▼
BullMQ
  │
  ▼
Redis
  │
  │ delayed job
  ▼
Worker
  │
  ▼
Nodemailer
  │
  ▼
SMTP / Ethereal
  │
  ▼
Email
```

### Step-by-step

1. The user creates an email from the frontend.
2. The frontend sends the request to the Express API.
3. The backend validates the request and stores the email information in MongoDB.
4. A BullMQ job is created with the requested scheduled time.
5. Redis stores the BullMQ job and handles the delayed-job state.
6. When the scheduled time is reached, the worker receives the job.
7. The worker sends the email using Nodemailer.
8. The email status is updated after processing.
9. The user can see the updated status from the dashboard.

This keeps email processing outside the normal HTTP request so the API doesn't have to remain busy waiting for a scheduled email.

---

# Persistence and Restart Handling

Persistence is handled at two levels.

### MongoDB

MongoDB stores the application's email and scheduling information.

This means the application's data isn't dependent on the Node.js process remaining alive.

For example:

```text
Email
├── recipient
├── subject
├── body
├── scheduledAt
└── status
```

### Redis + BullMQ

BullMQ uses Redis to maintain the queue and delayed-job information.

The worker can therefore process queued jobs independently from the API server.

With persistent Docker volumes configured for the database/queue services, the underlying data can also survive container restarts.

On application restart, the worker reconnects to Redis and continues processing available jobs.

The database also provides the source of truth for the application's email records and statuses.

---

# Rate Limiting

The backend includes rate limiting to prevent clients from sending an excessive number of API requests within a short period.

This helps protect endpoints from accidental request floods and basic abuse.

The rate limiter is applied at the API layer before requests reach the scheduling logic.

Conceptually:

```text
Client
   │
   ▼
Rate Limiter
   │
   ├── Request allowed ──► API
   │
   └── Limit exceeded ──► 429 Response
```

This keeps rate-control logic separate from the email processing worker.

---

# Worker Concurrency

The BullMQ worker is configured with a concurrency of **5**.

Example startup message:

```text
Worker ready with concurrency=5
```

This means the worker can process up to five jobs concurrently instead of processing every email strictly one after another.

```text
             Worker
               │
       ┌───────┼───────┐
       ▼       ▼       ▼
     Job 1   Job 2   Job 3
       ▼       ▼       ▼
     Job 4   Job 5
```

Concurrency improves throughput when multiple emails become ready around the same time while still putting a controlled limit on simultaneous processing.

---

# Features Implemented

## Backend

### Authentication

* User registration/login
* JWT-based authentication
* Protected API routes

### Email Scheduler

* Create scheduled emails
* Schedule emails for future delivery
* Process delayed jobs through BullMQ
* Send emails using Nodemailer
* Track email processing status

### Persistence

* MongoDB-based data storage
* Email records persist independently of the frontend
* Redis-backed BullMQ queue
* Worker can reconnect after application restarts

### Rate Limiting

* API request rate limiting
* Prevents excessive requests to backend endpoints
* Returns appropriate rate-limit responses

### Concurrency

* BullMQ worker concurrency configured to 5
* Multiple ready email jobs can be processed concurrently
* Keeps the number of simultaneous email-processing tasks controlled

### Background Processing

* Email sending is handled by a dedicated worker
* API and worker run independently
* Scheduled jobs do not block normal API requests

---

# Frontend

### Login

* User login interface
* Authentication handling
* Protected application area

### Dashboard

* Overview of scheduled emails
* Email status information
* Quick access to scheduling functionality

### Compose Email

* Recipient field
* Subject
* Email body
* Schedule date/time
* Form validation

### Email Tables

* Display scheduled emails
* Display email status
* View relevant email information in a structured table

### Scheduling

* Select a future date and time
* Submit scheduled emails to the backend
* Track the scheduled email after creation

### User Experience

* Clear forms and validation
* Loading states
* Success/error feedback
* Responsive interface

---

# Useful Commands

### Start Docker services

```bash
docker compose up -d
```

### Check Docker services

```bash
docker compose ps
```

### View service logs

```bash
docker compose logs -f
```

### Stop Docker services

```bash
docker compose down
```

### Start backend

```bash
cd backend
npm start
```

### Start worker

```bash
cd backend
npm run worker
```

### Start frontend

```bash
cd frontend
npm run dev
```

---

# Testing the Scheduler

A simple way to verify the complete flow is to schedule an email a few minutes into the future.

For example:

```text
Current time: 10:00
Scheduled time: 10:05
```

Then keep the worker running:

```bash
npm run worker
```

The expected flow is:

```text
Email created
      ↓
MongoDB record created
      ↓
BullMQ job added
      ↓
Redis stores delayed job
      ↓
Scheduled time reached
      ↓
Worker processes job
      ↓
Nodemailer sends email
      ↓
Email status updated
      ↓
Ethereal preview available
```

---

# Notes

* The `.env` file should never be committed to GitHub.
* Use `.env.example` to document required environment variables.
* Ethereal is intended for development/testing and does not function as a normal production mailbox.
* The BullMQ worker must be running for scheduled jobs to be processed.
* Redis and MongoDB must be available before starting the backend and worker.

---

# Project Goal

The main goal of this project was to build a reliable email scheduling workflow where API requests, persistence, queue management, and email delivery are separated into independent components.

Using BullMQ and Redis for background scheduling keeps the API responsive, while MongoDB provides persistent application data and a dedicated worker handles the actual email delivery.
