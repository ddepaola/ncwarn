/**
 * Seed States and backfill stateId on Counties
 *
 * Run with: npx tsx scripts/seed-states.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// NC Counties FIPS codes start with '37'
const NC_FIPS_PREFIX = '37';

async function main() {
  console.log('🌱 Seeding states...');

  // Create NC state (active for Phase 1)
  const nc = await prisma.state.upsert({
    where: { code: 'NC' },
    update: { active: true },
    create: {
      code: 'NC',
      name: 'North Carolina',
      slug: 'north-carolina',
      active: true,
    },
  });

  console.log(`✅ Created/updated state: ${nc.name} (id: ${nc.id})`);

  // Backfill stateId on existing counties
  // NC counties have FIPS codes starting with '37'
  const updateResult = await prisma.county.updateMany({
    where: {
      fips: { startsWith: NC_FIPS_PREFIX },
      stateId: null,
    },
    data: {
      stateId: nc.id,
    },
  });

  console.log(`✅ Updated ${updateResult.count} counties with stateId`);

  // Backfill stateId on existing WarnNotices (via their county)
  // First, get all NC county IDs
  const ncCounties = await prisma.county.findMany({
    where: { stateId: nc.id },
    select: { id: true },
  });

  const ncCountyIds = ncCounties.map((c) => c.id);

  // Update WarnNotices that belong to NC counties
  const noticeResult = await prisma.warnNotice.updateMany({
    where: {
      countyId: { in: ncCountyIds },
      stateId: null,
    },
    data: {
      stateId: nc.id,
    },
  });

  console.log(`✅ Updated ${noticeResult.count} WARN notices with stateId`);

  // Generate dedupe hashes for existing notices that don't have them
  const noticesWithoutHash = await prisma.warnNotice.findMany({
    where: { dedupeHash: null },
    include: { county: true },
  });

  if (noticesWithoutHash.length > 0) {
    console.log(`🔄 Generating dedupe hashes for ${noticesWithoutHash.length} notices...`);

    // Dynamic import to avoid top-level await issues
    const { generateDedupeHash } = await import('../lib/dedupe');

    let hashCount = 0;
    for (const notice of noticesWithoutHash) {
      const hash = generateDedupeHash({
        stateCode: 'NC',
        companyName: notice.employer,
        county: notice.county?.name || notice.countyNameRaw,
        noticeDate: notice.noticeDate,
        impacted: notice.impacted,
      });

      try {
        await prisma.warnNotice.update({
          where: { id: notice.id },
          data: { dedupeHash: hash },
        });
        hashCount++;
      } catch (error) {
        // Hash collision - this notice is a duplicate
        console.warn(`⚠️  Duplicate hash for notice ${notice.id} (${notice.employer})`);
      }
    }

    console.log(`✅ Generated ${hashCount} dedupe hashes`);
  }

  // Summary
  const stats = await Promise.all([
    prisma.state.count(),
    prisma.county.count({ where: { stateId: { not: null } } }),
    prisma.warnNotice.count({ where: { stateId: { not: null } } }),
  ]);

  console.log('\n📊 Summary:');
  console.log(`   States: ${stats[0]}`);
  console.log(`   Counties with stateId: ${stats[1]}`);
  console.log(`   WARN notices with stateId: ${stats[2]}`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
