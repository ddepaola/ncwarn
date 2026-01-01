import { Worker, Job } from 'bullmq';
import { prisma } from '../../lib/db';
import { fetchAllOutages, OutageRecord } from '../../lib/sources/outages';
import { getCountyByName } from '../../lib/county';
import { createLogger } from '../../lib/logger';
import { QUEUE_NAMES, connection } from '../queue';

const logger = createLogger('worker:outages');

async function processOutagesIngest(job: Job) {
  logger.info({ jobId: job.id }, 'Starting outages ingest');

  try {
    const outages = await fetchAllOutages();
    logger.info({ count: outages.length }, 'Fetched outage records');

    // Get NC state for county lookups
    const ncState = await prisma.state.findUnique({ where: { code: 'NC' } });

    let inserted = 0;
    let skipped = 0;

    for (const outage of outages) {
      const county = getCountyByName(outage.county);
      if (!county) {
        logger.debug({ county: outage.county }, 'Unknown county');
        skipped++;
        continue;
      }

      // Ensure county exists
      let dbCounty = await prisma.county.findFirst({
        where: { slug: county.slug, stateId: ncState?.id },
      });

      if (!dbCounty) {
        dbCounty = await prisma.county.create({
          data: {
            fips: county.fips,
            name: county.name,
            slug: county.slug,
            stateId: ncState?.id,
          },
        });
      }

      // Insert as new record (outages are point-in-time snapshots)
      await prisma.outage.create({
        data: {
          countyId: dbCounty.id,
          utility: outage.utility,
          customersOut: outage.customersOut,
          customersTot: outage.customersTot,
          reportedAt: outage.reportedAt,
          sourceUrl: outage.sourceUrl,
        },
      });
      inserted++;
    }

    // Clean up old outage records (keep last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const deleted = await prisma.outage.deleteMany({
      where: { reportedAt: { lt: weekAgo } },
    });

    const result = { inserted, skipped, deleted: deleted.count, total: outages.length };
    logger.info(result, 'Outages ingest complete');
    return result;
  } catch (error) {
    logger.error({ error, jobId: job.id }, 'Outages ingest failed');
    throw error;
  }
}

export function startOutagesWorker() {
  const worker = new Worker(QUEUE_NAMES.OUTAGES, processOutagesIngest, {
    connection,
    concurrency: 1,
  });

  worker.on('completed', (job, result) => {
    logger.info({ jobId: job.id, result }, 'Outages job completed');
  });

  worker.on('failed', (job, error) => {
    logger.error({ jobId: job?.id, error: error.message }, 'Outages job failed');
  });

  logger.info('Outages worker started');
  return worker;
}

export default startOutagesWorker;
