#!/usr/bin/env node
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, '..', '.env.local') });

async function run() {
  const { prisma } = await import('../lib/db.ts');

  try {
    // Delete the fake seeded recalls (they have 'demo' in sourceUrl)
    const deleted = await prisma.recall.deleteMany({
      where: {
        sourceUrl: { contains: 'demo' }
      }
    });
    console.log('Deleted', deleted.count, 'fake/demo recalls');

    // Show remaining count
    const remaining = await prisma.recall.count();
    console.log('Remaining recalls:', remaining);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
