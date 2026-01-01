/**
 * WARN Notice Ingest Worker
 *
 * Processes scheduled and manual WARN data import jobs.
 * Uses the NC WARN importer which handles:
 * - URL fetch with fallback to manual CSV
 * - Deduplication via stable hash
 * - Company normalization
 * - ImportRun audit logging
 */

import { Worker, Job } from 'bullmq';
import { prisma } from '../../lib/db';
import { importNcWarnNotices } from '../../lib/importers/nc-warn';
import { createLogger } from '../../lib/logger';
import { QUEUE_NAMES, connection } from '../queue';

const logger = createLogger('worker:warn');

interface WarnJobData {
  manual?: boolean;
  source?: 'url' | 'file' | 'auto';
}

async function processWarnIngest(job: Job<WarnJobData>) {
  logger.info({ jobId: job.id, data: job.data }, 'Starting WARN ingest');

  try {
    const result = await importNcWarnNotices(prisma, {
      source: job.data?.source || 'auto',
    });

    logger.info({
      jobId: job.id,
      success: result.success,
      found: result.itemsFound,
      upserted: result.itemsUpserted,
      skipped: result.itemsSkipped,
      duration: result.duration,
    }, 'WARN ingest complete');

    return {
      success: result.success,
      itemsFound: result.itemsFound,
      itemsUpserted: result.itemsUpserted,
      itemsSkipped: result.itemsSkipped,
      errorCount: result.errors.length,
      duration: result.duration,
    };
  } catch (error) {
    logger.error({ error, jobId: job.id }, 'WARN ingest failed');
    throw error;
  }
}

export function startWarnWorker() {
  const worker = new Worker(QUEUE_NAMES.WARN, processWarnIngest, {
    connection,
    concurrency: 1,
  });

  worker.on('completed', (job, result) => {
    logger.info({ jobId: job.id, result }, 'WARN job completed');
  });

  worker.on('failed', (job, error) => {
    logger.error({ jobId: job?.id, error: error.message }, 'WARN job failed');
  });

  logger.info('WARN worker started');
  return worker;
}

export default startWarnWorker;
