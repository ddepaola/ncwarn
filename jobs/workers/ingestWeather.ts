import { Worker, Job } from 'bullmq';
import { prisma } from '../../lib/db';
import { fetchWeatherAlerts, WeatherAlertRecord } from '../../lib/sources/weather';
import { getCountyByName } from '../../lib/county';
import { createLogger } from '../../lib/logger';
import { QUEUE_NAMES, connection } from '../queue';

const logger = createLogger('worker:weather');

async function processWeatherIngest(job: Job) {
  logger.info({ jobId: job.id }, 'Starting weather ingest');

  try {
    const alerts = await fetchWeatherAlerts();
    logger.info({ count: alerts.length }, 'Fetched weather alerts');

    // Get NC state for county lookups
    const ncState = await prisma.state.findUnique({ where: { code: 'NC' } });

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    // First, mark old alerts as expired (if endsAt has passed)
    await prisma.weatherAlert.updateMany({
      where: {
        endsAt: { lt: new Date() },
        status: { not: 'expired' },
      },
      data: { status: 'expired' },
    });

    for (const alert of alerts) {
      // Process each county mentioned in the alert
      for (const countyName of alert.counties) {
        const county = getCountyByName(countyName);
        if (!county) {
          logger.debug({ county: countyName }, 'Unknown county');
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

        // Check for existing alert
        const existing = await prisma.weatherAlert.findFirst({
          where: {
            sourceUrl: alert.sourceUrl,
            countyId: dbCounty.id,
          },
        });

        if (existing) {
          await prisma.weatherAlert.update({
            where: { id: existing.id },
            data: {
              event: alert.event,
              status: alert.status,
              severity: alert.severity,
              headline: alert.headline,
              description: alert.description,
              endsAt: alert.endsAt,
            },
          });
          updated++;
        } else {
          await prisma.weatherAlert.create({
            data: {
              countyId: dbCounty.id,
              event: alert.event,
              status: alert.status,
              startsAt: alert.startsAt,
              endsAt: alert.endsAt,
              severity: alert.severity,
              headline: alert.headline,
              description: alert.description,
              sourceUrl: alert.sourceUrl,
            },
          });
          inserted++;
        }
      }
    }

    const result = { inserted, updated, skipped, total: alerts.length };
    logger.info(result, 'Weather ingest complete');
    return result;
  } catch (error) {
    logger.error({ error, jobId: job.id }, 'Weather ingest failed');
    throw error;
  }
}

export function startWeatherWorker() {
  const worker = new Worker(QUEUE_NAMES.WEATHER, processWeatherIngest, {
    connection,
    concurrency: 1,
  });

  worker.on('completed', (job, result) => {
    logger.info({ jobId: job.id, result }, 'Weather job completed');
  });

  worker.on('failed', (job, error) => {
    logger.error({ jobId: job?.id, error: error.message }, 'Weather job failed');
  });

  logger.info('Weather worker started');
  return worker;
}

export default startWeatherWorker;
