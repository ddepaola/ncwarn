import { Queue } from "bullmq";
import IORedis from "ioredis";
import { getEnv } from "./env";

export const QUEUE_PREFIX = "ncrr";
export const SYSTEM_QUEUE = "system";

declare global {
  var __ncrrQueue: Queue | undefined;
}

/** Producer-side queue handle for the web process (enqueue only). */
export function getSystemQueue(): Queue {
  if (!globalThis.__ncrrQueue) {
    const connection = new IORedis(getEnv().REDIS_URL, { maxRetriesPerRequest: null, enableOfflineQueue: true });
    globalThis.__ncrrQueue = new Queue(SYSTEM_QUEUE, { connection, prefix: QUEUE_PREFIX });
  }
  return globalThis.__ncrrQueue;
}

export async function enqueueSourceRun(key: string, opts: { since?: string; actor: string }) {
  const q = getSystemQueue();
  return q.add("source-run", { key, since: opts.since, actor: opts.actor }, { jobId: `source-run:${key}:${Date.now()}`, removeOnComplete: 50, removeOnFail: 50, attempts: 2, backoff: { type: "exponential", delay: 60000 } });
}
