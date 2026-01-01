/**
 * Dynamic Sitemap Generation
 * Generates sitemap.xml for all WARN notice pages
 *
 * Next.js will automatically serve this at /sitemap.xml
 */

import { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://ncwarn.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const state = await prisma.state.findUnique({ where: { code: 'NC' } });
  if (!state) return [];

  // Get all data needed for sitemap
  const [notices, counties, companies] = await Promise.all([
    prisma.warnNotice.findMany({
      where: { stateId: state.id },
      select: {
        id: true,
        noticeDate: true,
        updatedAt: true,
      },
      orderBy: { noticeDate: 'desc' },
    }),
    prisma.county.findMany({
      where: { stateId: state.id },
      select: { slug: true },
    }),
    prisma.company.findMany({
      where: {
        notices: { some: { stateId: state.id } },
      },
      select: { slug: true },
    }),
  ]);

  // Extract unique years and months
  const yearMonths = new Map<string, Date>();
  const uniqueYears = new Set<number>();

  notices.forEach((notice) => {
    const date = new Date(notice.noticeDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    uniqueYears.add(year);

    const key = `${year}/${month}`;
    if (!yearMonths.has(key) || yearMonths.get(key)! < date) {
      yearMonths.set(key, date);
    }
  });

  const sitemap: MetadataRoute.Sitemap = [];
  const now = new Date();

  // Static pages (high priority)
  sitemap.push(
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/states/north-carolina`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/states/north-carolina/warn`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/states/north-carolina/warn/counties`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/states/north-carolina/warn/companies`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/alerts`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/guides/what-is-a-warn-notice`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/guides/what-to-do-after-a-layoff-in-nc`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    }
  );

  // Year pages
  [...uniqueYears].sort((a, b) => b - a).forEach((year) => {
    sitemap.push({
      url: `${BASE_URL}/states/north-carolina/warn/years/${year}`,
      lastModified: now,
      changeFrequency: year === now.getFullYear() ? 'daily' : 'monthly',
      priority: 0.7,
    });
  });

  // Month pages
  yearMonths.forEach((lastMod, key) => {
    sitemap.push({
      url: `${BASE_URL}/states/north-carolina/warn/${key}`,
      lastModified: lastMod,
      changeFrequency: 'monthly',
      priority: 0.6,
    });
  });

  // County pages
  counties.forEach((county) => {
    sitemap.push({
      url: `${BASE_URL}/states/north-carolina/warn/counties/${county.slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    });
  });

  // Company pages
  companies.forEach((company) => {
    sitemap.push({
      url: `${BASE_URL}/states/north-carolina/warn/companies/${company.slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.5,
    });
  });

  // Individual notice pages (limit to prevent huge sitemaps)
  const recentNotices = notices.slice(0, 5000);
  recentNotices.forEach((notice) => {
    sitemap.push({
      url: `${BASE_URL}/states/north-carolina/warn/notices/${notice.id}`,
      lastModified: notice.updatedAt || notice.noticeDate,
      changeFrequency: 'monthly',
      priority: 0.4,
    });
  });

  return sitemap;
}
