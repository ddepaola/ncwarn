import { Queue, Worker, QueueEvents, Job } from 'bullmq';
import { redis } from '../lib/redis';
import { createLogger } from '../lib/logger';

const logger = createLogger('queue');

// Queue names
export const QUEUE_NAMES = {
  WARN: 'ingest-warn',
  WEATHER: 'ingest-weather',
  AMBER: 'ingest-amber',
  OUTAGES: 'ingest-outages',
  SCAMS: 'ingest-scams',
  RECALLS: 'ingest-recalls',
  REMOTE_JOBS: 'ingest-remote-jobs',
} as const;

// Connection options for BullMQ
const redisUrl = new URL(process.env.REDIS_URL || 'redis://localhost:6379');
export const connection = {
  host: redisUrl.hostname,
  port: parseInt(redisUrl.port || '6379'),
  password: redisUrl.password ? decodeURIComponent(redisUrl.password) : undefined,
};

// Create queues
export const warnQueue = new Queue(QUEUE_NAMES.WARN, { connection });
export const weatherQueue = new Queue(QUEUE_NAMES.WEATHER, { connection });
export const amberQueue = new Queue(QUEUE_NAMES.AMBER, { connection });
export const outagesQueue = new Queue(QUEUE_NAMES.OUTAGES, { connection });
export const scamsQueue = new Queue(QUEUE_NAMES.SCAMS, { connection });
export const recallsQueue = new Queue(QUEUE_NAMES.RECALLS, { connection });
export const remoteJobsQueue = new Queue(QUEUE_NAMES.REMOTE_JOBS, { connection });

// Queue map for easy access
export const queues = {
  [QUEUE_NAMES.WARN]: warnQueue,
  [QUEUE_NAMES.WEATHER]: weatherQueue,
  [QUEUE_NAMES.AMBER]: amberQueue,
  [QUEUE_NAMES.OUTAGES]: outagesQueue,
  [QUEUE_NAMES.SCAMS]: scamsQueue,
  [QUEUE_NAMES.RECALLS]: recallsQueue,
  [QUEUE_NAMES.REMOTE_JOBS]: remoteJobsQueue,
};

// Schedule recurring jobs
export async function scheduleAllJobs() {
  logger.info('Scheduling recurring ingestion jobs');

  // WARN - daily at 06:00
  await warnQueue.add(
    'daily-ingest',
    {},
    {
      repeat: { pattern: '0 6 * * *' },
      removeOnComplete: 10,
      removeOnFail: 5,
    }
  );

  // Weather - every 5 minutes
  await weatherQueue.add(
    'frequent-ingest',
    {},
    {
      repeat: { pattern: '*/5 * * * *' },
      removeOnComplete: 5,
      removeOnFail: 3,
    }
  );

  // AMBER - every 15 minutes
  await amberQueue.add(
    'frequent-ingest',
    {},
    {
      repeat: { pattern: '*/15 * * * *' },
      removeOnComplete: 5,
      removeOnFail: 3,
    }
  );

  // Outages - every 10 minutes
  await outagesQueue.add(
    'frequent-ingest',
    {},
    {
      repeat: { pattern: '*/10 * * * *' },
      removeOnComplete: 5,
      removeOnFail: 3,
    }
  );

  // Scams - hourly
  await scamsQueue.add(
    'hourly-ingest',
    {},
    {
      repeat: { pattern: '0 * * * *' },
      removeOnComplete: 10,
      removeOnFail: 5,
    }
  );

  // Recalls - daily at 07:00
  await recallsQueue.add(
    'daily-ingest',
    {},
    {
      repeat: { pattern: '0 7 * * *' },
      removeOnComplete: 10,
      removeOnFail: 5,
    }
  );

  // Remote Jobs - 4 times daily (Remotive recommends max 4 requests/day)
  // At 06:00, 12:00, 18:00, 00:00
  await remoteJobsQueue.add(
    'scheduled-ingest',
    {},
    {
      repeat: { pattern: '0 0,6,12,18 * * *' },
      removeOnComplete: 10,
      removeOnFail: 5,
    }
  );

  logger.info('All jobs scheduled');
}

// Run all ingest jobs immediately (for initial setup or manual trigger)
export async function runAllIngestsNow() {
  logger.info('Running all ingests now');

  const jobs = await Promise.all([
    warnQueue.add('manual-ingest', { manual: true }),
    weatherQueue.add('manual-ingest', { manual: true }),
    amberQueue.add('manual-ingest', { manual: true }),
    outagesQueue.add('manual-ingest', { manual: true }),
    scamsQueue.add('manual-ingest', { manual: true }),
    recallsQueue.add('manual-ingest', { manual: true }),
    remoteJobsQueue.add('manual-ingest', { manual: true }),
  ]);

  logger.info({ jobIds: jobs.map(j => j.id) }, 'All ingest jobs queued');
  return jobs;
}

// Get queue stats
export async function getQueueStats() {
  const stats: Record<string, unknown> = {};

  for (const [name, queue] of Object.entries(queues)) {
    const [waiting, active, completed, failed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
    ]);

    stats[name] = { waiting, active, completed, failed };
  }

  return stats;
}

// Clean old jobs
export async function cleanOldJobs(olderThanMs: number = 24 * 60 * 60 * 1000) {
  logger.info({ olderThanMs }, 'Cleaning old jobs');

  for (const queue of Object.values(queues)) {
    await queue.clean(olderThanMs, 100, 'completed');
    await queue.clean(olderThanMs, 100, 'failed');
  }
}
