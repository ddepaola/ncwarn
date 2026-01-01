import { Worker, Job } from 'bullmq';
import { prisma } from '../../lib/db';
import { fetchRemoteJobs, RemoteJobRecord } from '../../lib/sources/remotive';
import { createLogger } from '../../lib/logger';
import { QUEUE_NAMES, connection } from '../queue';

const logger = createLogger('worker:remote-jobs');

async function processRemoteJobsIngest(job: Job) {
  logger.info({ jobId: job.id }, 'Starting remote jobs ingest from Remotive');

  try {
    // Fetch all remote jobs (many are worldwide/remote-friendly)
    const jobs = await fetchRemoteJobs({ limit: 500 });
    logger.info({ count: jobs.length }, 'Fetched remote job records');

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const remoteJob of jobs) {
      // Check if already exists
      const existing = await prisma.remoteJob.findUnique({
        where: { remoteId: remoteJob.remoteId },
      });

      if (existing) {
        // Update if data changed
        if (existing.title !== remoteJob.title || existing.url !== remoteJob.url) {
          await prisma.remoteJob.update({
            where: { remoteId: remoteJob.remoteId },
            data: {
              title: remoteJob.title,
              company: remoteJob.company,
              companyLogo: remoteJob.companyLogo,
              category: remoteJob.category,
              tags: remoteJob.tags,
              jobType: remoteJob.jobType,
              location: remoteJob.location,
              salary: remoteJob.salary,
              description: remoteJob.description,
              url: remoteJob.url,
              publishedAt: remoteJob.publishedAt,
            },
          });
          updated++;
        } else {
          skipped++;
        }
        continue;
      }

      await prisma.remoteJob.create({
        data: {
          remoteId: remoteJob.remoteId,
          title: remoteJob.title,
          company: remoteJob.company,
          companyLogo: remoteJob.companyLogo,
          category: remoteJob.category,
          tags: remoteJob.tags,
          jobType: remoteJob.jobType,
          location: remoteJob.location,
          salary: remoteJob.salary,
          description: remoteJob.description,
          url: remoteJob.url,
          publishedAt: remoteJob.publishedAt,
        },
      });
      inserted++;
    }

    // Clean up old jobs (older than 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const deleted = await prisma.remoteJob.deleteMany({
      where: {
        publishedAt: { lt: thirtyDaysAgo },
      },
    });

    const result = { inserted, updated, skipped, deleted: deleted.count, total: jobs.length };
    logger.info(result, 'Remote jobs ingest complete');
    return result;
  } catch (error) {
    logger.error({ error, jobId: job.id }, 'Remote jobs ingest failed');
    throw error;
  }
}

export function startRemoteJobsWorker() {
  const worker = new Worker(QUEUE_NAMES.REMOTE_JOBS || 'remote-jobs', processRemoteJobsIngest, {
    connection,
    concurrency: 1,
  });

  worker.on('completed', (job, result) => {
    logger.info({ jobId: job.id, result }, 'Remote jobs job completed');
  });

  worker.on('failed', (job, error) => {
    logger.error({ jobId: job?.id, error: error.message }, 'Remote jobs job failed');
  });

  logger.info('Remote jobs worker started');
  return worker;
}

export default startRemoteJobsWorker;
