import { Queue, Worker, type Job } from "bullmq";
import IORedis from "ioredis";
import { getEnv } from "../src/lib/env";
import { logger } from "../src/lib/logger";
import { db, schema, sqlClient } from "../src/lib/db";
import { eq, sql } from "drizzle-orm";
import { runCmpdIngest } from "../src/modules/sources/ingest";

/**
 * Worker process (handoff §11.1): scheduled source jobs, health/freshness
 * recalculation, later ingestion/matching/notification. BullMQ queues are
 * prefixed so they can never collide with other apps sharing a Redis.
 */
const env = getEnv();
process.env.SERVICE_NAME = "worker";
const connection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
const PREFIX = "ncrr";
const QUEUE = "system";

const systemQueue = new Queue(QUEUE, { connection, prefix: PREFIX });

async function recomputeFreshness(job: Job) {
  // Freshness: current if last success within expected interval; delayed within 2x; stale beyond. Untouched for link-only / pending states.
  const rows = await db.select({ id: schema.coverageStatus.id, state: schema.coverageStatus.state, lastSuccessAt: schema.coverageStatus.lastSuccessAt, interval: schema.sources.expectedIntervalMinutes })
    .from(schema.coverageStatus).innerJoin(schema.sources, eq(schema.sources.id, schema.coverageStatus.sourceId));
  let changed = 0;
  for (const r of rows) {
    if (!r.interval || !r.lastSuccessAt || ["integration_pending", "coverage_not_available"].includes(r.state)) continue;
    const ageMin = (Date.now() - r.lastSuccessAt.getTime()) / 60000;
    const next = ageMin <= r.interval ? "current" : ageMin <= r.interval * 2 ? "delayed" : "stale";
    if (next !== r.state) { await db.update(schema.coverageStatus).set({ state: next, updatedAt: new Date() }).where(eq(schema.coverageStatus.id, r.id)); changed++; }
  }
  logger.info({ jobId: job.id, rows: rows.length, changed }, "freshness recomputed");
  return { changed };
}

async function heartbeat(job: Job) {
  await sqlClient`select 1`;
  await db.execute(sql`select 1`);
  logger.debug({ jobId: job.id }, "worker heartbeat ok");
}

async function sourceRun(job: Job<{ key?: string; since?: string; actor?: string }>) {
  const key = job.data?.key ?? "cmpd_incidents";
  if (key !== "cmpd_incidents") { logger.warn({ key }, "no ingest handler for source"); return null; }
  const since = job.data?.since ? new Date(job.data.since) : undefined;
  logger.info({ jobId: job.id, key, since, actor: job.data?.actor }, "source run starting");
  const result = await runCmpdIngest({ since, jobId: String(job.id) });
  logger.info({ jobId: job.id, key, ...result }, "source run finished");
  if (result.outcome === "failed") throw new Error(result.error ?? "ingest failed");
  return result;
}

const worker = new Worker(QUEUE, async (job) => {
  switch (job.name) {
    case "recompute-freshness": return recomputeFreshness(job);
    case "heartbeat": return heartbeat(job);
    case "source-run": return sourceRun(job);
    default: logger.warn({ name: job.name }, "unknown job"); return null;
  }
}, { connection, prefix: PREFIX, concurrency: 2 });

worker.on("failed", (job, err) => logger.error({ jobId: job?.id, name: job?.name, err: err.message }, "job failed"));
worker.on("completed", (job) => logger.info({ jobId: job.id, name: job.name }, "job completed"));

async function scheduleRepeatables() {
  // Idempotent: BullMQ dedupes job schedulers by id.
  await systemQueue.upsertJobScheduler("freshness-every-15m", { every: 15 * 60 * 1000 }, { name: "recompute-freshness" });
  await systemQueue.upsertJobScheduler("heartbeat-every-5m", { every: 5 * 60 * 1000 }, { name: "heartbeat" });
  // CMPD publishes daily; every 6h keeps freshness "current" (expected interval 24h) with margin.
  await systemQueue.upsertJobScheduler("cmpd-every-6h", { every: 6 * 60 * 60 * 1000 }, { name: "source-run", data: { key: "cmpd_incidents", actor: "scheduler" } });
  logger.info("job schedulers registered");
}

async function shutdown(signal: string) {
  logger.info({ signal }, "worker shutting down");
  await worker.close();
  await systemQueue.close();
  await connection.quit();
  await sqlClient.end();
  process.exit(0);
}
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

scheduleRepeatables().then(() => logger.info({ queue: QUEUE, prefix: PREFIX }, "worker started")).catch((err) => { logger.error({ err }, "worker failed to start"); process.exit(1); });
