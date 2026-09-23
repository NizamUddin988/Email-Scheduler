import "dotenv/config";

const required = (name, fallback) => {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === "") {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
};

export const config = {
  port: Number(process.env.PORT || 5000),
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  mongoUri: required("MONGODB_URI"),
  redisUrl: required("REDIS_URL"),
  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  smtp: {
    host: process.env.SMTP_HOST || "smtp.ethereal.email",
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE).toLowerCase() === "true",
    user: process.env.SMTP_USER || "",
    password: process.env.SMTP_PASSWORD || "",
    from: process.env.MAIL_FROM || "Email Scheduler <no-reply@example.test>"
  },
  workerConcurrency: Number(process.env.WORKER_CONCURRENCY || 5),
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 100),
  authRateLimitWindowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 900000),
  authRateLimitMax: Number(process.env.AUTH_RATE_LIMIT_MAX || 10)
};
