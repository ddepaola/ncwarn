import { Worker, Job } from 'bullmq';
import { prisma } from '../../lib/db';
import { fetchScamAlerts, categorizeScam, ScamAlertRecord } from '../../lib/sources/scams';
import { createLogger } from '../../lib/logger';
import { QUEUE_NAMES, connection } from '../queue';

const logger = createLogger('worker:scams');

async function processScamsIngest(job: Job) {
  logger.info({ jobId: job.id }, 'Starting scams ingest');

  try {
    const alerts = await fetchScamAlerts();
    logger.info({ count: alerts.length }, 'Fetched scam alerts');

    let inserted = 0;
    let skipped = 0;

    for (const alert of alerts) {
      // Check if already exists by sourceUrl
      const existing = await prisma.scamAlert.findUnique({
        where: { sourceUrl: alert.sourceUrl },
      });

      if (existing) {
        skipped++;
        continue;
      }

      // Categorize if not already categorized
      const category = alert.category || categorizeScam(alert.title, alert.summary);

      await prisma.scamAlert.create({
        data: {
          title: alert.title,
          category,
          summary: alert.summary,
          publishedAt: alert.publishedAt,
          sourceUrl: alert.sourceUrl,
        },
      });
      inserted++;
    }

    const result = { inserted, skipped, total: alerts.length };
    logger.info(result, 'Scams ingest complete');
    return result;
  } catch (error) {
    logger.error({ error, jobId: job.id }, 'Scams ingest failed');
    throw error;
  }
}

export function startScamsWorker() {
  const worker = new Worker(QUEUE_NAMES.SCAMS, processScamsIngest, {
    connection,
    concurrency: 1,
  });

  worker.on('completed', (job, result) => {
    logger.info({ jobId: job.id, result }, 'Scams job completed');
  });

  worker.on('failed', (job, error) => {
    logger.error({ jobId: job?.id, error: error.message }, 'Scams job failed');
  });

  logger.info('Scams worker started');
  return worker;
}

export default startScamsWorker;
