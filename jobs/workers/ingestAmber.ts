import { Worker, Job } from 'bullmq';
import { prisma } from '../../lib/db';
import { fetchAmberAlerts, AmberAlertRecord } from '../../lib/sources/amber';
import { createLogger } from '../../lib/logger';
import { QUEUE_NAMES, connection } from '../queue';

const logger = createLogger('worker:amber');

async function processAmberIngest(job: Job) {
  logger.info({ jobId: job.id }, 'Starting AMBER ingest');

  try {
    const alerts = await fetchAmberAlerts();
    logger.info({ count: alerts.length }, 'Fetched AMBER alerts');

    let inserted = 0;
    let updated = 0;

    for (const alert of alerts) {
      const existing = await prisma.amberAlert.findUnique({
        where: { caseId: alert.caseId },
      });

      if (existing) {
        await prisma.amberAlert.update({
          where: { id: existing.id },
          data: {
            status: alert.status,
            title: alert.title,
            description: alert.description,
            region: alert.region,
            sourceUrl: alert.sourceUrl,
          },
        });
        updated++;
      } else {
        await prisma.amberAlert.create({
          data: {
            caseId: alert.caseId,
            status: alert.status,
            title: alert.title,
            description: alert.description,
            region: alert.region,
            issuedAt: alert.issuedAt,
            sourceUrl: alert.sourceUrl,
          },
        });
        inserted++;
      }
    }

    // Mark old alerts as resolved (>48 hours)
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - 48);

    await prisma.amberAlert.updateMany({
      where: {
        issuedAt: { lt: cutoff },
        status: 'active',
      },
      data: { status: 'resolved' },
    });

    const result = { inserted, updated, total: alerts.length };
    logger.info(result, 'AMBER ingest complete');
    return result;
  } catch (error) {
    logger.error({ error, jobId: job.id }, 'AMBER ingest failed');
    throw error;
  }
}

export function startAmberWorker() {
  const worker = new Worker(QUEUE_NAMES.AMBER, processAmberIngest, {
    connection,
    concurrency: 1,
  });

  worker.on('completed', (job, result) => {
    logger.info({ jobId: job.id, result }, 'AMBER job completed');
  });

  worker.on('failed', (job, error) => {
    logger.error({ jobId: job?.id, error: error.message }, 'AMBER job failed');
  });

  logger.info('AMBER worker started');
  return worker;
}

export default startAmberWorker;
