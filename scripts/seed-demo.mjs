#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding demo data...');

  // Get some counties
  const wake = await prisma.county.findUnique({ where: { slug: 'wake' } });
  const mecklenburg = await prisma.county.findUnique({ where: { slug: 'mecklenburg' } });
  const durham = await prisma.county.findUnique({ where: { slug: 'durham' } });
  const guilford = await prisma.county.findUnique({ where: { slug: 'guilford' } });

  if (!wake || !mecklenburg || !durham || !guilford) {
    console.error('Counties not found. Run seed:counties first.');
    process.exit(1);
  }

  // Demo WARN notices
  const warnNotices = [
    {
      employer: 'TechCorp Industries',
      city: 'Raleigh',
      countyId: wake.id,
      industry: 'Technology',
      impacted: 150,
      noticeDate: new Date('2024-10-15'),
      effectiveOn: new Date('2024-12-15'),
      notes: 'Facility closure due to restructuring',
      sourceUrl: 'https://www.commerce.nc.gov/data/warn-notices',
    },
    {
      employer: 'Manufacturing Plus LLC',
      city: 'Charlotte',
      countyId: mecklenburg.id,
      industry: 'Manufacturing',
      impacted: 87,
      noticeDate: new Date('2024-11-01'),
      effectiveOn: new Date('2025-01-01'),
      notes: 'Plant relocation',
      sourceUrl: 'https://www.commerce.nc.gov/data/warn-notices',
    },
    {
      employer: 'Retail Giant Corp',
      city: 'Durham',
      countyId: durham.id,
      industry: 'Retail',
      impacted: 45,
      noticeDate: new Date('2024-11-10'),
      effectiveOn: new Date('2025-01-15'),
      notes: 'Store closure',
      sourceUrl: 'https://www.commerce.nc.gov/data/warn-notices',
    },
  ];

  for (const notice of warnNotices) {
    await prisma.warnNotice.create({ data: notice });
  }
  console.log(`Created ${warnNotices.length} demo WARN notices`);

  // Demo weather alerts
  const weatherAlerts = [
    {
      countyId: wake.id,
      event: 'Winter Storm Warning',
      status: 'active',
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      severity: 'Moderate',
      headline: 'Winter Storm Warning in effect until tomorrow evening',
      description: 'Heavy snow expected. 4-6 inches accumulation.',
      sourceUrl: 'https://alerts.weather.gov/cap/nc.php',
    },
    {
      countyId: mecklenburg.id,
      event: 'Wind Advisory',
      status: 'active',
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
      severity: 'Minor',
      headline: 'Wind Advisory in effect',
      description: 'Winds 25-35 mph with gusts to 50 mph.',
      sourceUrl: 'https://alerts.weather.gov/cap/nc.php',
    },
  ];

  for (const alert of weatherAlerts) {
    await prisma.weatherAlert.create({ data: alert });
  }
  console.log(`Created ${weatherAlerts.length} demo weather alerts`);

  // Demo outages
  const outages = [
    {
      countyId: wake.id,
      utility: 'Duke Energy',
      customersOut: 1250,
      customersTot: 450000,
      reportedAt: new Date(),
      sourceUrl: 'https://www.duke-energy.com/outages',
    },
    {
      countyId: guilford.id,
      utility: 'Duke Energy',
      customersOut: 320,
      customersTot: 180000,
      reportedAt: new Date(),
      sourceUrl: 'https://www.duke-energy.com/outages',
    },
  ];

  for (const outage of outages) {
    await prisma.outage.create({ data: outage });
  }
  console.log(`Created ${outages.length} demo outages`);

  // Demo scam alerts
  const scamAlerts = [
    {
      title: 'IRS Phone Scam Targeting NC Residents',
      category: 'phone',
      summary: 'Scammers posing as IRS agents demanding immediate payment.',
      publishedAt: new Date('2024-11-15'),
      sourceUrl: 'https://www.ncdoj.gov/protecting-consumers/scam-1',
    },
    {
      title: 'Utility Bill Phishing Emails',
      category: 'email',
      summary: 'Fake Duke Energy emails asking for account verification.',
      publishedAt: new Date('2024-11-10'),
      sourceUrl: 'https://www.ncdoj.gov/protecting-consumers/scam-2',
    },
  ];

  for (const scam of scamAlerts) {
    await prisma.scamAlert.create({ data: scam });
  }
  console.log(`Created ${scamAlerts.length} demo scam alerts`);

  // Demo recalls
  const recalls = [
    {
      agency: 'NHTSA',
      recallId: 'NHTSA-2024-001',
      title: 'Toyota Camry 2022-2024 Brake System',
      category: 'vehicle',
      affected: '150,000 vehicles',
      publishedAt: new Date('2024-11-01'),
      sourceUrl: 'https://www.nhtsa.gov/recalls/demo-1',
    },
    {
      agency: 'CPSC',
      recallId: 'CPSC-2024-100',
      title: 'Children\'s Toy Set - Choking Hazard',
      category: 'product',
      affected: '25,000 units',
      publishedAt: new Date('2024-11-05'),
      sourceUrl: 'https://www.cpsc.gov/recalls/demo-1',
    },
    {
      agency: 'FDA',
      recallId: 'FDA-2024-050',
      title: 'Organic Spinach - E. coli Contamination',
      category: 'food',
      affected: 'Various lot numbers',
      publishedAt: new Date('2024-11-12'),
      sourceUrl: 'https://www.fda.gov/safety/recalls/demo-1',
    },
  ];

  for (const recall of recalls) {
    await prisma.recall.create({ data: recall });
  }
  console.log(`Created ${recalls.length} demo recalls`);

  // Demo job posts
  const jobPosts = [
    {
      company: 'NC Tech Solutions',
      title: 'Senior Software Engineer',
      location: 'Raleigh',
      countyId: wake.id,
      description: 'Looking for experienced software engineers to join our growing team. Remote-friendly with competitive benefits.',
      url: 'https://example.com/jobs/1',
      email: 'jobs@example.com',
      plan: 'growth',
      featured: true,
      active: true,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    {
      company: 'Charlotte Manufacturing',
      title: 'Production Manager',
      location: 'Charlotte',
      countyId: mecklenburg.id,
      description: 'Manage production floor operations for our expanding facility. 5+ years experience required.',
      email: 'hr@example.com',
      plan: 'starter',
      featured: false,
      active: true,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const job of jobPosts) {
    await prisma.jobPost.create({ data: job });
  }
  console.log(`Created ${jobPosts.length} demo job posts`);

  console.log('Demo data seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
