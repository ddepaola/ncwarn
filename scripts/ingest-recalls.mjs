#!/usr/bin/env node
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, '..', '.env.local') });

async function run() {
  console.log('Fetching recalls from federal agencies...');

  // Dynamically import after dotenv is configured
  const { prisma } = await import('../lib/db.ts');
  const { fetchAllRecalls } = await import('../lib/sources/recalls.ts');

  try {
    const recalls = await fetchAllRecalls();
    console.log(`Fetched ${recalls.length} recalls`);

    if (recalls.length > 0) {
      console.log('\nSample recalls:');
      recalls.slice(0, 5).forEach(r => {
        console.log(`- [${r.agency}] ${r.recallId}: ${r.title.slice(0, 60)}... (${r.publishedAt.toISOString().split('T')[0]})`);
      });
    }

    let inserted = 0;
    let skipped = 0;

    for (const recall of recalls) {
      const existing = await prisma.recall.findFirst({
        where: { agency: recall.agency, recallId: recall.recallId }
      });

      if (existing) {
        skipped++;
        continue;
      }

      // Generate unique sourceUrl if it's a generic URL
      let uniqueSourceUrl = recall.sourceUrl;
      if (recall.sourceUrl.includes('recall') && !recall.sourceUrl.includes(recall.recallId)) {
        uniqueSourceUrl = `${recall.sourceUrl}#${recall.agency}-${recall.recallId}`;
      }

      await prisma.recall.create({
        data: {
          agency: recall.agency,
          recallId: recall.recallId,
          title: recall.title.slice(0, 500),
          category: recall.category,
          affected: recall.affected,
          publishedAt: recall.publishedAt,
          sourceUrl: uniqueSourceUrl,
        },
      });
      inserted++;
    }

    console.log(`\nResults: ${inserted} inserted, ${skipped} skipped (already exist)`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
