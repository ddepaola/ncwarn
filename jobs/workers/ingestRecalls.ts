import { Worker, Job } from 'bullmq';
import { prisma } from '../../lib/db';
import { fetchAllRecalls, RecallRecord } from '../../lib/sources/recalls';
import { createLogger } from '../../lib/logger';
import { QUEUE_NAMES, connection } from '../queue';

const logger = createLogger('worker:recalls');

async function processRecallsIngest(job: Job) {
  logger.info({ jobId: job.id }, 'Starting recalls ingest');

  try {
    const recalls = await fetchAllRecalls();
    logger.info({ count: recalls.length }, 'Fetched recall records');

    let inserted = 0;
    let skipped = 0;

    for (const recall of recalls) {
      // Check if already exists by agency + recallId combination
      const existing = await prisma.recall.findFirst({
        where: {
          agency: recall.agency,
          recallId: recall.recallId,
        },
      });

      if (existing) {
        skipped++;
        continue;
      }

      // Generate unique sourceUrl if it's a generic URL
      const uniqueSourceUrl = recall.sourceUrl.includes('recall') && !recall.sourceUrl.includes(recall.recallId)
        ? `${recall.sourceUrl}#${recall.agency}-${recall.recallId}`
        : recall.sourceUrl;

      await prisma.recall.create({
        data: {
          agency: recall.agency,
          recallId: recall.recallId,
          title: recall.title.slice(0, 500), // Truncate if too long
          category: recall.category,
          affected: recall.affected,
          publishedAt: recall.publishedAt,
          sourceUrl: uniqueSourceUrl,
        },
      });
      inserted++;
    }

    const result = { inserted, skipped, total: recalls.length };
    logger.info(result, 'Recalls ingest complete');
    return result;
  } catch (error) {
    logger.error({ error, jobId: job.id }, 'Recalls ingest failed');
    throw error;
  }
}

export function startRecallsWorker() {
  const worker = new Worker(QUEUE_NAMES.RECALLS, processRecallsIngest, {
    connection,
    concurrency: 1,
  });

  worker.on('completed', (job, result) => {
    logger.info({ jobId: job.id, result }, 'Recalls job completed');
  });

  worker.on('failed', (job, error) => {
    logger.error({ jobId: job?.id, error: error.message }, 'Recalls job failed');
  });

  logger.info('Recalls worker started');
  return worker;
}

export default startRecallsWorker;
