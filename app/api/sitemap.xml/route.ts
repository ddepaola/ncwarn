import { prisma } from '@/lib/db';
import { NC_COUNTIES } from '@/lib/county';

const SITE_URL = 'https://ncwarn.com';

export async function GET() {
  const now = new Date().toISOString();

  // Static pages
  const staticPages = [
    { url: '', priority: '1.0', changefreq: 'hourly' },
    { url: '/warn', priority: '0.9', changefreq: 'daily' },
    { url: '/weather', priority: '0.9', changefreq: 'hourly' },
    { url: '/outages', priority: '0.9', changefreq: 'hourly' },
    { url: '/amber', priority: '0.9', changefreq: 'hourly' },
    { url: '/scams', priority: '0.8', changefreq: 'daily' },
    { url: '/recalls', priority: '0.8', changefreq: 'daily' },
    { url: '/jobs', priority: '0.7', changefreq: 'daily' },
    { url: '/prepare', priority: '0.6', changefreq: 'monthly' },
    { url: '/about', priority: '0.5', changefreq: 'monthly' },
    { url: '/privacy', priority: '0.3', changefreq: 'monthly' },
    { url: '/terms', priority: '0.3', changefreq: 'monthly' },
  ];

  // County pages (for WARN, weather, outages)
  const countyPages = NC_COUNTIES.flatMap(county => [
    { url: `/warn?county=${county.slug}`, priority: '0.7', changefreq: 'daily' },
    { url: `/weather?county=${county.slug}`, priority: '0.7', changefreq: 'hourly' },
    { url: `/outages?county=${county.slug}`, priority: '0.7', changefreq: 'hourly' },
  ]);

  const allPages = [...staticPages, ...countyPages];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    page => `  <url>
    <loc>${SITE_URL}${page.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
