/**
 * North Carolina State Landing Page
 * Hub for all NC WARN-related content
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { NoticeCard } from '@/components/NoticeCard';
import { Disclaimer } from '@/components/Disclaimer';

export const metadata: Metadata = {
  title: 'North Carolina WARN Act Layoff Notices | NCWarn.com',
  description:
    'Track WARN Act layoff notices in North Carolina. View recent layoffs by company, county, and date. Stay informed about workforce changes affecting NC workers.',
  openGraph: {
    title: 'North Carolina WARN Act Layoff Notices',
    description: 'Track WARN Act layoff notices in North Carolina.',
    url: 'https://ncwarn.com/states/north-carolina',
  },
};

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate hourly

async function getStats() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const state = await prisma.state.findUnique({ where: { code: 'NC' } });
  if (!state) return null;

  const [totalNotices, recentNotices, recentImpacted, counties] = await Promise.all([
    prisma.warnNotice.count({ where: { stateId: state.id } }),
    prisma.warnNotice.count({
      where: { stateId: state.id, noticeDate: { gte: thirtyDaysAgo } },
    }),
    prisma.warnNotice.aggregate({
      where: { stateId: state.id, noticeDate: { gte: ninetyDaysAgo } },
      _sum: { impacted: true },
    }),
    prisma.county.count({ where: { stateId: state.id } }),
  ]);

  return {
    totalNotices,
    recentNotices,
    recentImpacted: recentImpacted._sum.impacted || 0,
    counties,
  };
}

async function getRecentNotices() {
  const state = await prisma.state.findUnique({ where: { code: 'NC' } });
  if (!state) return [];

  return prisma.warnNotice.findMany({
    where: { stateId: state.id },
    include: {
      county: { select: { name: true, slug: true } },
      company: { select: { name: true, slug: true } },
    },
    orderBy: { noticeDate: 'desc' },
    take: 10,
  });
}

async function getTopCounties() {
  const state = await prisma.state.findUnique({ where: { code: 'NC' } });
  if (!state) return [];

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const counties = await prisma.county.findMany({
    where: { stateId: state.id },
    include: {
      _count: {
        select: { notices: true },
      },
    },
    orderBy: {
      notices: { _count: 'desc' },
    },
    take: 10,
  });

  return counties.filter((c) => c._count.notices > 0);
}

export default async function NorthCarolinaPage() {
  const [stats, recentNotices, topCounties] = await Promise.all([
    getStats(),
    getRecentNotices(),
    getTopCounties(),
  ]);

  if (!stats) {
    return <div>Error loading data</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'North Carolina' },
        ]}
      />

      <h1 className="text-3xl font-bold text-slate-900 mb-2">
        North Carolina WARN Act Notices
      </h1>
      <p className="text-lg text-slate-600 mb-8">
        Track layoffs and workforce reductions across North Carolina
      </p>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-slate-900">
            {stats.totalNotices.toLocaleString()}
          </div>
          <div className="text-sm text-slate-600">Total Notices</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-orange-600">
            {stats.recentNotices.toLocaleString()}
          </div>
          <div className="text-sm text-slate-600">Last 30 Days</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-red-600">
            {stats.recentImpacted.toLocaleString()}
          </div>
          <div className="text-sm text-slate-600">Workers (90 days)</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-blue-600">{stats.counties}</div>
          <div className="text-sm text-slate-600">Counties</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Notices */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Recent Notices</h2>
            <Link
              href="/states/north-carolina/warn"
              className="text-blue-600 hover:underline text-sm"
            >
              View all →
            </Link>
          </div>

          <div className="space-y-3">
            {recentNotices.map((notice) => (
              <NoticeCard key={notice.id} notice={notice} />
            ))}
          </div>

          {recentNotices.length === 0 && (
            <p className="text-slate-500 italic">No notices found.</p>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Counties with Most Notices */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h3 className="font-semibold text-slate-900 mb-3">Counties</h3>
            <ul className="space-y-2">
              {topCounties.map((county) => (
                <li key={county.id}>
                  <Link
                    href={`/states/north-carolina/warn/counties/${county.slug}`}
                    className="flex justify-between items-center text-sm hover:text-blue-600"
                  >
                    <span>{county.name}</span>
                    <span className="text-slate-500">{county._count.notices}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/states/north-carolina/warn/counties"
              className="block mt-3 text-sm text-blue-600 hover:underline"
            >
              View all counties →
            </Link>
          </div>

          {/* Quick Links */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h3 className="font-semibold text-slate-900 mb-3">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/guides/what-is-a-warn-notice" className="text-blue-600 hover:underline">
                  What is a WARN Notice?
                </Link>
              </li>
              <li>
                <Link
                  href="/guides/what-to-do-after-a-layoff-in-nc"
                  className="text-blue-600 hover:underline"
                >
                  What to Do After a Layoff
                </Link>
              </li>
              <li>
                <Link href="/alerts" className="text-blue-600 hover:underline">
                  Get Email Alerts
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-12">
        <Disclaimer />
      </div>
    </div>
  );
}
