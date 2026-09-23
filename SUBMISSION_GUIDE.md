# Submission Guide

## Before GitHub

1. Run `docker compose up -d`.
2. Start backend.
3. Start worker.
4. Start frontend.
5. Register a test user.
6. Schedule an email 30–60 seconds in the future.
7. Verify it reaches `SENT`.
8. Verify the Ethereal preview.
9. Test restart persistence.
10. Test cancellation.
11. Test an invalid request.
12. Confirm rate limiting returns HTTP 429 when intentionally exceeded.

## Restart test

Schedule an email 2–3 minutes into the future.

Stop:

```text
backend terminal: Ctrl+C
worker terminal: Ctrl+C
```

Start:

```bash
cd backend
npm run dev
```

and:

```bash
npm run worker
```

Open the dashboard. The email should still be `SCHEDULED`.

Wait for the scheduled time. It should move to `SENT`.

## GitHub

Create a PRIVATE repository.

Example:

```bash
git init
git add .
git commit -m "feat: complete email scheduler assignment"
git branch -M main
git remote add origin YOUR_REPO_URL
git push -u origin main
```

Add the requested collaborators:

- Mitrajit
- Yadav036

Do not commit `.env`.

## Demo script

Use this exact flow:

> "This application is an email scheduler using React, Express, MongoDB, Redis and BullMQ. The frontend calls the Express API, the API persists the email in MongoDB and creates a delayed BullMQ job in Redis. A separate worker processes the job when it becomes due and sends it through Ethereal."

Then demonstrate the restart scenario.

## Final message

> Hi,
>
> I have completed the Email Scheduler assignment and added the implementation to the private GitHub repository. The repository includes the backend, frontend, Redis/BullMQ worker, database persistence, rate limiting, concurrency controls, Ethereal integration, README documentation and the requested demo video.
>
> Access has been granted to Mitrajit and Yadav036.
>
> Thank you for the opportunity.
