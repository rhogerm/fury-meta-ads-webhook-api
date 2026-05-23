import type { JobState } from "bullmq";
import {
  buildTakedownJobId,
  TAKEDOWN_JOB_NAME,
  takedownQueue
} from "../queues/takedown.queue.js";
import type {
  TakedownJobData,
  TakedownJobResult
} from "../types/takedown.js";

export type EnqueueTakedownResult = {
  jobId: string;
  deduplicated: boolean;
};

export type JobStatusResponse = {
  jobId: string;
  status: JobState | "unknown";
  attempts: number;
  result: TakedownJobResult | null;
  error: string | null;
};

const activeStates: ReadonlySet<JobState | "unknown"> = new Set([
  "waiting",
  "active",
  "delayed",
  "prioritized",
  "waiting-children",
  "unknown"
]);

export const enqueueTakedownJob = async (
  data: TakedownJobData
): Promise<EnqueueTakedownResult> => {
  const jobId = buildTakedownJobId(data.tenantId, data.adId);
  const existingJob = await takedownQueue.getJob(jobId);

  if (existingJob) {
    const state = await existingJob.getState();

    if (activeStates.has(state)) {
      return { jobId, deduplicated: true };
    }

    await existingJob.remove();
  }

  const job = await takedownQueue.add(TAKEDOWN_JOB_NAME, data, { jobId });

  return {
    jobId: job.id ?? jobId,
    deduplicated: false
  };
};

export const getTakedownJobStatus = async (
  jobId: string
): Promise<JobStatusResponse | null> => {
  const job = await takedownQueue.getJob(jobId);

  if (!job) {
    return null;
  }

  const state = await job.getState();

  return {
    jobId: job.id ?? jobId,
    status: state,
    attempts: job.attemptsMade,
    result: job.returnvalue ?? null,
    error: job.failedReason ?? null
  };
};
