import { Suspense } from 'react';
import { prisma } from '@/lib/db';
import { generateMetadata as genMeta } from '@/lib/seo';
import Notice from '@/components/Notice';
import WarnTable from './WarnTable';

export const metadata = genMeta({
  title: 'WARN Act Layoff Notices',
  description: 'Track Worker Adjustment and Retraining Notification (WARN) Act layoff notices across North Carolina. Filter by county, company, or industry.',
  path: '/warn',
});

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

async function getWarnNotices(countySlug?: string, from?: string, to?: string) {
  const where: Record<string, unknown> = {};

  if (countySlug) {
    where.county = { slug: countySlug };
  }

  if (from || to) {
    where.noticeDate = {};
    if (from) {
      (where.noticeDate as Record<string, Date>).gte = new Date(`${from}-01`);
    }
    if (to) {
      const toDate = new Date(`${to}-01`);
      toDate.setMonth(toDate.getMonth() + 1);
      (where.noticeDate as Record<string, Date>).lt = toDate;
    }
  }

  const notices = await prisma.warnNotice.findMany({
    where,
    include: {
      county: {
        select: { name: true, slug: true },
      },
    },
    orderBy: { noticeDate: 'desc' },
    take: 500,
  });

  // Serialize dates to ISO strings for client component
  return notices.map(notice => ({
    ...notice,
    noticeDate: notice.noticeDate.toISOString(),
    effectiveOn: notice.effectiveOn?.toISOString() || null,
    createdAt: notice.createdAt.toISOString(),
    updatedAt: notice.updatedAt.toISOString(),
  }));
}

async function getStats() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [totalNotices, recentNotices, totalImpacted] = await Promise.all([
    prisma.warnNotice.count(),
    prisma.warnNotice.count({
      where: { noticeDate: { gte: thirtyDaysAgo } },
    }),
    prisma.warnNotice.aggregate({
      _sum: { impacted: true },
      where: { noticeDate: { gte: thirtyDaysAgo } },
    }),
  ]);

  return {
    totalNotices,
    recentNotices,
    totalImpacted: totalImpacted._sum.impacted || 0,
  };
}

export default async function WarnPage({
  searchParams,
}: {
  searchParams: Promise<{ county?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const [notices, stats] = await Promise.all([
    getWarnNotices(params.county, params.from, params.to),
    getStats(),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">WARN Act Layoff Notices</h1>
        <p className="mt-2 text-gray-600">
          Worker Adjustment and Retraining Notification (WARN) Act notices filed in North Carolina.
          Employers with 100+ employees must provide 60-day advance notice of plant closings and mass layoffs.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-gray-900">{stats.totalNotices}</div>
          <div className="text-sm text-gray-500">Total Notices on Record</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-blue-600">{stats.recentNotices}</div>
          <div className="text-sm text-gray-500">Notices (Last 30 Days)</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-orange-600">{stats.totalImpacted.toLocaleString()}</div>
          <div className="text-sm text-gray-500">Workers Affected (30 Days)</div>
        </div>
      </div>

      {/* Info Notice */}
      <Notice type="info" className="mb-6">
        <strong>About WARN Act:</strong> The Worker Adjustment and Retraining Notification Act requires
        employers with 100 or more employees to provide 60 calendar days advance written notice of
        plant closings and mass layoffs. Data is sourced from{' '}
        <a
          href="https://www.commerce.nc.gov/data/warn-notices"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          NC Commerce
        </a>.
      </Notice>

      {/* Filters would go here - simplified for now */}
      <div className="bg-white p-4 rounded-lg border mb-6">
        <p className="text-sm text-gray-500">
          Filter by county, date range, or use the search below. Export to CSV for offline analysis.
        </p>
      </div>

      {/* Data Table */}
      <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading notices...</div>}>
        <WarnTable data={notices} />
      </Suspense>
    </div>
  );
}
