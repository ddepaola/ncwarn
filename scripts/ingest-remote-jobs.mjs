#!/usr/bin/env node
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, '..', '.env.local') });

async function run() {
  console.log('Fetching remote jobs from Remotive API...');

  const { prisma } = await import('../lib/db.ts');
  const { fetchUSRemoteJobs } = await import('../lib/sources/remotive.ts');

  try {
    // Fetch all remote jobs (US filtering is too restrictive)
    const { fetchRemoteJobs } = await import('../lib/sources/remotive.ts');
    const jobs = await fetchRemoteJobs({ limit: 500 });
    console.log(`Fetched ${jobs.length} remote jobs`);

    if (jobs.length > 0) {
      console.log('\nSample jobs:');
      jobs.slice(0, 5).forEach(j => {
        console.log(`- [${j.category}] ${j.title} at ${j.company} (${j.location})`);
      });
    }

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const job of jobs) {
      const existing = await prisma.remoteJob.findUnique({
        where: { remoteId: job.remoteId },
      });

      if (existing) {
        if (existing.title !== job.title || existing.url !== job.url) {
          await prisma.remoteJob.update({
            where: { remoteId: job.remoteId },
            data: {
              title: job.title,
              company: job.company,
              companyLogo: job.companyLogo,
              category: job.category,
              tags: job.tags,
              jobType: job.jobType,
              location: job.location,
              salary: job.salary,
              description: job.description,
              url: job.url,
              publishedAt: job.publishedAt,
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
          remoteId: job.remoteId,
          title: job.title,
          company: job.company,
          companyLogo: job.companyLogo,
          category: job.category,
          tags: job.tags,
          jobType: job.jobType,
          location: job.location,
          salary: job.salary,
          description: job.description,
          url: job.url,
          publishedAt: job.publishedAt,
        },
      });
      inserted++;
    }

    console.log(`\nResults: ${inserted} inserted, ${updated} updated, ${skipped} skipped`);

    // Show total in DB
    const total = await prisma.remoteJob.count();
    console.log(`Total remote jobs in database: ${total}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
