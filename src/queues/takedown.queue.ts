import { Queue } from "bullmq";
import { createRedisConnection } from "./redis.js";
import type { TakedownJobData, TakedownJobResult } from "../types/takedown.js";

export const TAKEDOWN_QUEUE_NAME = "takedown";
export const TAKEDOWN_JOB_NAME = "ad-takedown";

export const takedownQueue = new Queue<TakedownJobData, TakedownJobResult>(
  TAKEDOWN_QUEUE_NAME,
  {
    connection: createRedisConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1_000
      },
      removeOnComplete: {
        age: 60 * 60,
        count: 1_000
      },
      removeOnFail: {
        age: 24 * 60 * 60
      }
    }
  }
);

export const buildTakedownJobId = (tenantId: string, adId: string): string =>
  `takedown:${tenantId}:${adId}`;
