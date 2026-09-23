import { Worker } from "bullmq";
import { connectDatabase } from "./db.js";
import { config } from "./config.js";
import { createRedisConnection } from "./redis.js";
import { EMAIL_QUEUE_NAME } from "./queue.js";
import { Email } from "./models.js";
import { sendScheduledEmail } from "./mailer.js";

await connectDatabase();

const connection = createRedisConnection();

const worker = new Worker(
  EMAIL_QUEUE_NAME,
  async (job) => {
    const { emailId } = job.data;
    const email = await Email.findById(emailId);

    if (!email) {
      console.warn(`Email ${emailId} no longer exists`);
      return;
    }

    if (["SENT", "CANCELLED"].includes(email.status)) {
      return;
    }

    await Email.findByIdAndUpdate(emailId, {
      status: "PROCESSING",
      error: null
    });

    try {
      const result = await sendScheduledEmail(email);

      await Email.findByIdAndUpdate(emailId, {
        status: "SENT",
        sentAt: new Date(),
        previewUrl: result.previewUrl,
        error: null
      });

      console.log(
        `Email ${emailId} sent successfully${result.previewUrl ? ` - Preview: ${result.previewUrl}` : ""}`
      );
    } catch (error) {
      await Email.findByIdAndUpdate(emailId, {
        status: "FAILED",
        error: error.message
      });
      throw error;
    }
  },
  {
    connection,
    concurrency: config.workerConcurrency
  }
);

worker.on("ready", () => {
  console.log(`Worker ready with concurrency=${config.workerConcurrency}`);
});

worker.on("completed", (job) => {
  console.log(`Job completed: ${job.id}`);
});

worker.on("failed", (job, error) => {
  console.error(`Job failed: ${job?.id}`, error.message);
});

async function shutdown(signal) {
  console.log(`${signal}: shutting down worker...`);
  await worker.close();
  await connection.quit();
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
