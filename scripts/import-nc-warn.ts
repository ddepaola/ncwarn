#!/usr/bin/env npx tsx
/**
 * Manual NC WARN Import Script
 *
 * Usage:
 *   npx tsx scripts/import-nc-warn.ts           # Auto (try URL, fallback to file)
 *   npx tsx scripts/import-nc-warn.ts --url     # Force URL fetch
 *   npx tsx scripts/import-nc-warn.ts --file    # Force file read
 *
 * For file import, place CSV at: data/nc-warn-manual.csv
 */

import { PrismaClient } from '@prisma/client';
import { importNcWarnNotices } from '../lib/importers/nc-warn';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);

  let source: 'url' | 'file' | 'auto' = 'auto';

  if (args.includes('--url')) {
    source = 'url';
  } else if (args.includes('--file')) {
    source = 'file';
  }

  console.log(`\n🚀 Starting NC WARN Import (source: ${source})\n`);

  const result = await importNcWarnNotices(prisma, { source });

  console.log('\n📊 Import Results:');
  console.log(`   Success: ${result.success ? '✅' : '❌'}`);
  console.log(`   Items Found: ${result.itemsFound}`);
  console.log(`   Items Upserted: ${result.itemsUpserted}`);
  console.log(`   Items Skipped (duplicates): ${result.itemsSkipped}`);
  console.log(`   Errors: ${result.errors.length}`);
  console.log(`   Duration: ${result.duration}ms`);

  if (result.errors.length > 0) {
    console.log('\n⚠️  Errors:');
    result.errors.slice(0, 10).forEach((err, i) => {
      console.log(`   ${i + 1}. ${err}`);
    });
    if (result.errors.length > 10) {
      console.log(`   ... and ${result.errors.length - 10} more`);
    }
  }

  console.log('\n');
}

main()
  .catch((e) => {
    console.error('❌ Import failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
