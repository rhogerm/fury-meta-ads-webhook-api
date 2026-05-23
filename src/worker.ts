import { Worker } from "bullmq";
import { createRedisConnection } from "./queues/redis.js";
import { TAKEDOWN_QUEUE_NAME } from "./queues/takedown.queue.js";
import { requestMetaTakedown } from "./services/meta-api.service.js";
import type { TakedownJobData, TakedownJobResult } from "./types/takedown.js";

const worker = new Worker<TakedownJobData, TakedownJobResult>(
  TAKEDOWN_QUEUE_NAME,
  async () => requestMetaTakedown(),
  {
    connection: createRedisConnection(),
    concurrency: 5
  }
);

worker.on("completed", (job, result) => {
  console.info("Takedown job completed", {
    jobId: job.id,
    attemptsMade: job.attemptsMade,
    result
  });
});

worker.on("failed", (job, error) => {
  console.error("Takedown job failed", {
    jobId: job?.id,
    attemptsMade: job?.attemptsMade,
    error: error.message
  });
});

const shutdown = async (): Promise<void> => {
  await worker.close();
};

process.on("SIGINT", () => {
  void shutdown();
});

process.on("SIGTERM", () => {
  void shutdown();
});

console.info("Takedown worker started", {
  queue: TAKEDOWN_QUEUE_NAME
});
