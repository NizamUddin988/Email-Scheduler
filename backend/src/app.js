import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "./config.js";
import { router } from "./routes.js";
import { errorHandler } from "./middleware.js";

export const app = express();

app.use(helmet());
app.use(cors({
  origin: config.clientUrl,
  credentials: false
}));
app.use(express.json({ limit: "100kb" }));

const generalLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  limit: config.rateLimitMax,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many requests. Please try again later." }
});

const authLimiter = rateLimit({
  windowMs: config.authRateLimitWindowMs,
  limit: config.authRateLimitMax,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many authentication attempts. Please try again later." }
});

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "email-scheduler-api" });
});

app.use("/api/auth", authLimiter);
app.use("/api", generalLimiter);
app.use("/api", router);

app.use(errorHandler);
