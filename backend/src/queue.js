import { Queue } from "bullmq";
import { createRedisConnection } from "./redis.js";

export const EMAIL_QUEUE_NAME = "scheduled-emails";
export const emailQueueConnection = createRedisConnection();

export const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
  connection: emailQueueConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 2000 }
  }
});

export async function closeQueue() {
  await emailQueue.close();
  await emailQueueConnection.quit();
}
