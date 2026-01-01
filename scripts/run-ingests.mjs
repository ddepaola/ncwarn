#!/usr/bin/env node
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, '..', '.env.local') });

async function main() {
  console.log('Starting all data ingestion workers...');

  // Dynamically import after dotenv is configured
  const { runAllIngestsNow, scheduleAllJobs } = await import('../jobs/queue.ts');
  const { startWarnWorker } = await import('../jobs/workers/ingestWarn.ts');
  const { startWeatherWorker } = await import('../jobs/workers/ingestWeather.ts');
  const { startAmberWorker } = await import('../jobs/workers/ingestAmber.ts');
  const { startOutagesWorker } = await import('../jobs/workers/ingestOutages.ts');
  const { startScamsWorker } = await import('../jobs/workers/ingestScams.ts');
  const { startRecallsWorker } = await import('../jobs/workers/ingestRecalls.ts');

  // Start all workers
  const workers = [
    startWarnWorker(),
    startWeatherWorker(),
    startAmberWorker(),
    startOutagesWorker(),
    startScamsWorker(),
    startRecallsWorker(),
  ];

  console.log(`Started ${workers.length} workers`);

  // Check for --schedule flag
  if (process.argv.includes('--schedule')) {
    console.log('Setting up scheduled jobs...');
    await scheduleAllJobs();
    console.log('Scheduled jobs configured. Workers will run on schedule.');
    console.log('Press Ctrl+C to stop.');
    return; // Keep running
  }

  // Run all ingests now
  console.log('Running all ingests immediately...');
  const jobs = await runAllIngestsNow();
  console.log(`Queued ${jobs.length} ingest jobs`);

  // Wait for jobs to complete (simple polling)
  console.log('Waiting for jobs to complete...');

  // Give jobs time to complete
  await new Promise(resolve => setTimeout(resolve, 60000));

  console.log('Ingest run complete. Shutting down workers...');

  for (const worker of workers) {
    await worker.close();
  }

  process.exit(0);
}

main().catch((e) => {
  console.error('Ingest failed:', e);
  process.exit(1);
});
