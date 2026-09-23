import express from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Email, User } from "./models.js";
import { authRequired, signToken } from "./auth.js";
import { emailQueue } from "./queue.js";

export const router = express.Router();

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  password: z.string().min(8).max(100)
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1)
});

const scheduleSchema = z.object({
  to: z.string().trim().email(),
  subject: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(20000),
  scheduledAt: z.coerce.date()
});

router.post("/auth/register", async (req, res) => {
  const data = registerSchema.parse(req.body);

  const exists = await User.findOne({ email: data.email.toLowerCase() });
  if (exists) return res.status(409).json({ message: "Email already registered" });

  const passwordHash = await bcrypt.hash(data.password, 12);
  const user = await User.create({
    name: data.name,
    email: data.email.toLowerCase(),
    passwordHash
  });

  res.status(201).json({
    token: signToken(user),
    user: { id: user._id, name: user.name, email: user.email }
  });
});

router.post("/auth/login", async (req, res) => {
  const data = loginSchema.parse(req.body);
  const user = await User.findOne({ email: data.email.toLowerCase() });

  if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  res.json({
    token: signToken(user),
    user: { id: user._id, name: user.name, email: user.email }
  });
});

router.get("/auth/me", authRequired, async (req, res) => {
  res.json({ user: req.user });
});

router.post("/emails/schedule", authRequired, async (req, res) => {
  const data = scheduleSchema.parse(req.body);

  if (data.scheduledAt.getTime() <= Date.now() + 1000) {
    return res.status(400).json({ message: "scheduledAt must be in the future" });
  }

  const email = await Email.create({
    userId: req.user._id,
    ...data
  });

  const delay = Math.max(0, data.scheduledAt.getTime() - Date.now());

  try {
    const job = await emailQueue.add(
      "send-email",
      { emailId: String(email._id) },
      {
        jobId: String(email._id),
        delay
      }
    );

    email.jobId = job.id;
    await email.save();

    res.status(201).json({ email });
  } catch (error) {
    await Email.findByIdAndUpdate(email._id, {
      status: "FAILED",
      error: `Queue error: ${error.message}`
    });
    throw error;
  }
});

async function listEmails(req, res, status) {
  const filter = { userId: req.user._id };
  if (status) filter.status = status;

  const emails = await Email.find(filter).sort({ scheduledAt: -1 }).lean();
  res.json({ emails });
}

router.get("/emails", authRequired, (req, res) => listEmails(req, res));
router.get("/emails/scheduled", authRequired, (req, res) => listEmails(req, res, "SCHEDULED"));
router.get("/emails/sent", authRequired, (req, res) => listEmails(req, res, "SENT"));
router.get("/emails/failed", authRequired, (req, res) => listEmails(req, res, "FAILED"));

router.get("/emails/:id", authRequired, async (req, res) => {
  const email = await Email.findOne({
    _id: req.params.id,
    userId: req.user._id
  }).lean();

  if (!email) return res.status(404).json({ message: "Email not found" });
  res.json({ email });
});

router.delete("/emails/:id", authRequired, async (req, res) => {
  const email = await Email.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!email) return res.status(404).json({ message: "Email not found" });

  if (["SENT", "PROCESSING"].includes(email.status)) {
    return res.status(400).json({ message: "This email cannot be cancelled now" });
  }

  if (email.jobId) {
    const job = await emailQueue.getJob(email.jobId);
    if (job) await job.remove();
  }

  email.status = "CANCELLED";
  await email.save();

  res.json({ message: "Email cancelled" });
});
