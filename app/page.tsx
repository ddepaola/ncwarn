/**
 * NCWarn Homepage
 * Focus: North Carolina WARN Act Layoff Notices & Intelligence
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { NoticeCard } from '@/components/NoticeCard';
import { Disclaimer } from '@/components/Disclaimer';

export const metadata: Metadata = {
  title: 'North Carolina WARN Act Notices & Layoff Intelligence | NCWarn.com',
  description:
    'Track WARN Act layoff notices across North Carolina. Search by company, county, or date. Stay informed about workforce reductions affecting NC workers.',
  openGraph: {
    title: 'NCWarn.com - NC WARN Act Layoff Notices',
    description: 'Track WARN Act layoff notices across North Carolina.',
    url: 'https://ncwarn.com',
  },
};

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate hourly

async function getStats() {
  const state = await prisma.state.findUnique({ where: { code: 'NC' } });
  if (!state) return null;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const [totalNotices, recentNotices, recentImpacted, topCounties] = await Promise.all([
    prisma.warnNotice.count({ where: { stateId: state.id } }),
    prisma.warnNotice.count({
      where: { stateId: state.id, noticeDate: { gte: thirtyDaysAgo } },
    }),
    prisma.warnNotice.aggregate({
      where: { stateId: state.id, noticeDate: { gte: ninetyDaysAgo } },
      _sum: { impacted: true },
    }),
    prisma.county.findMany({
      where: { stateId: state.id },
      include: {
        _count: { select: { notices: true } },
      },
      orderBy: { notices: { _count: 'desc' } },
      take: 6,
    }),
  ]);

  return {
    totalNotices,
    recentNotices,
    recentImpacted: recentImpacted._sum.impacted || 0,
    topCounties: topCounties.filter((c) => c._count.notices > 0),
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
    take: 5,
  });
}

export default async function HomePage() {
  const [stats, recentNotices] = await Promise.all([getStats(), getRecentNotices()]);

  if (!stats) {
    return <div className="p-8">Error loading data</div>;
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-800 to-slate-900 text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            North Carolina WARN Act Notices
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mb-8">
            Track layoffs and workforce reductions across North Carolina. Free, searchable
            database updated regularly with the latest WARN Act filings.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/states/north-carolina/warn"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-500 transition-colors"
            >
              Browse All Notices
            </Link>
            <Link
              href="/alerts"
              className="bg-slate-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-slate-600 transition-colors"
            >
              Get Email Alerts
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-6xl mx-auto px-4 -mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            value={stats.totalNotices.toLocaleString()}
            label="Total Notices"
            href="/states/north-carolina/warn"
          />
          <StatCard
            value={stats.recentNotices.toLocaleString()}
            label="Last 30 Days"
            variant="warning"
          />
          <StatCard
            value={stats.recentImpacted.toLocaleString()}
            label="Workers (90 days)"
            variant="danger"
          />
          <StatCard
            value={stats.topCounties.length.toString()}
            label="Active Counties"
            href="/states/north-carolina/warn/counties"
          />
        </div>
      </section>

      {/* Recent Notices */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Recent WARN Notices</h2>
          <Link
            href="/states/north-carolina/warn"
            className="text-blue-600 hover:underline text-sm font-medium"
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
          <p className="text-slate-500 italic text-center py-8">No notices found.</p>
        )}
      </section>

      {/* Quick Links Section */}
      <section className="bg-slate-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Browse by County</h2>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {stats.topCounties.map((county) => (
              <Link
                key={county.id}
                href={`/states/north-carolina/warn/counties/${county.slug}`}
                className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="font-semibold text-slate-900">{county.name} County</div>
                <div className="text-sm text-slate-500">
                  {county._count.notices} {county._count.notices === 1 ? 'notice' : 'notices'}
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/states/north-carolina/warn/counties"
              className="text-blue-600 hover:underline font-medium"
            >
              View all 100 NC counties →
            </Link>
          </div>
        </div>
      </section>

      {/* Resources Section */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Resources</h2>

        <div className="grid md:grid-cols-3 gap-6">
          <ResourceCard
            href="/guides/what-is-a-warn-notice"
            title="What is a WARN Notice?"
            description="Learn about the Worker Adjustment and Retraining Notification Act and your rights as an employee."
          />
          <ResourceCard
            href="/guides/what-to-do-after-a-layoff-in-nc"
            title="What to Do After a Layoff"
            description="Step-by-step guide for NC workers who have been affected by a layoff or plant closing."
          />
          <ResourceCard
            href="/alerts"
            title="Get Email Alerts"
            description="Sign up to receive notifications when new WARN notices are filed in your county."
          />
        </div>
      </section>

      {/* Disclaimer */}
      <section className="max-w-6xl mx-auto px-4 pb-12">
        <Disclaimer />
      </section>
    </div>
  );
}

function StatCard({
  value,
  label,
  href,
  variant = 'default',
}: {
  value: string;
  label: string;
  href?: string;
  variant?: 'default' | 'warning' | 'danger';
}) {
  const colors = {
    default: 'text-slate-900',
    warning: 'text-orange-600',
    danger: 'text-red-600',
  };

  const content = (
    <div className="bg-white border border-slate-200 rounded-lg p-4 text-center shadow-sm">
      <div className={`text-3xl font-bold ${colors[variant]}`}>{value}</div>
      <div className="text-sm text-slate-600">{label}</div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block hover:shadow-md transition-shadow rounded-lg">
        {content}
      </Link>
    );
  }

  return content;
}

function ResourceCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="block bg-white border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow"
    >
      <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-600">{description}</p>
    </Link>
  );
}
