/**
 * Year Archive Page
 * Shows all WARN notices for a specific year
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Breadcrumbs, generateWarnBreadcrumbs } from '@/components/Breadcrumbs';
import { NoticeCard } from '@/components/NoticeCard';
import { Disclaimer } from '@/components/Disclaimer';

interface PageProps {
  params: { year: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const year = params.year;
  return {
    title: `${year} North Carolina WARN Act Notices | NCWarn.com`,
    description: `All WARN Act layoff notices filed in North Carolina during ${year}. View company layoffs, affected workers, and county breakdowns.`,
    openGraph: {
      title: `${year} NC WARN Act Layoff Notices`,
      description: `Complete list of WARN Act layoff notices filed in North Carolina during ${year}.`,
      url: `https://ncwarn.com/states/north-carolina/warn/years/${year}`,
    },
  };
}

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

async function getNoticesForYear(year: string) {
  const yearNum = parseInt(year, 10);
  if (isNaN(yearNum) || yearNum < 1988 || yearNum > new Date().getFullYear() + 1) {
    return null;
  }

  const state = await prisma.state.findUnique({ where: { code: 'NC' } });
  if (!state) return null;

  const startDate = new Date(yearNum, 0, 1);
  const endDate = new Date(yearNum + 1, 0, 1);

  const [notices, monthStats] = await Promise.all([
    prisma.warnNotice.findMany({
      where: {
        stateId: state.id,
        noticeDate: {
          gte: startDate,
          lt: endDate,
        },
      },
      include: {
        county: { select: { name: true, slug: true } },
        company: { select: { name: true, slug: true } },
      },
      orderBy: { noticeDate: 'desc' },
    }),
    prisma.warnNotice.groupBy({
      by: ['noticeDate'],
      where: {
        stateId: state.id,
        noticeDate: {
          gte: startDate,
          lt: endDate,
        },
      },
      _count: true,
    }),
  ]);

  // Aggregate by month
  const monthCounts: Record<number, number> = {};
  monthStats.forEach((stat) => {
    const month = new Date(stat.noticeDate).getMonth();
    monthCounts[month] = (monthCounts[month] || 0) + stat._count;
  });

  return { notices, monthCounts, year: yearNum };
}

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default async function YearPage({ params }: PageProps) {
  const data = await getNoticesForYear(params.year);

  if (!data) {
    notFound();
  }

  const { notices, monthCounts, year } = data;
  const totalImpacted = notices.reduce((sum, n) => sum + (n.impacted || 0), 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Breadcrumbs items={generateWarnBreadcrumbs({ year: params.year })} />

      <h1 className="text-3xl font-bold text-slate-900 mb-2">
        {year} North Carolina WARN Notices
      </h1>
      <p className="text-lg text-slate-600 mb-8">
        {notices.length.toLocaleString()} notices affecting {totalImpacted.toLocaleString()} workers
      </p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-slate-900">{notices.length}</div>
          <div className="text-sm text-slate-600">Notices</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-red-600">
            {totalImpacted.toLocaleString()}
          </div>
          <div className="text-sm text-slate-600">Workers Affected</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-blue-600">
            {Object.keys(monthCounts).length}
          </div>
          <div className="text-sm text-slate-600">Months with Notices</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Month Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-slate-50 rounded-lg p-4 sticky top-4">
            <h3 className="font-semibold text-slate-900 mb-3">Browse by Month</h3>
            <ul className="space-y-1">
              {monthNames.map((month, index) => {
                const count = monthCounts[index] || 0;
                if (count === 0) {
                  return (
                    <li key={month} className="text-sm text-slate-400">
                      {month}
                    </li>
                  );
                }
                return (
                  <li key={month}>
                    <Link
                      href={`/states/north-carolina/warn/${year}/${String(index + 1).padStart(2, '0')}`}
                      className="flex justify-between text-sm text-blue-600 hover:underline"
                    >
                      <span>{month}</span>
                      <span className="text-slate-400">{count}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Notice List */}
        <div className="lg:col-span-3">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">All {year} Notices</h2>

          <div className="space-y-3">
            {notices.map((notice) => (
              <NoticeCard key={notice.id} notice={notice} />
            ))}
          </div>

          {notices.length === 0 && (
            <p className="text-slate-500 italic py-8 text-center">
              No WARN notices were filed in North Carolina during {year}.
            </p>
          )}
        </div>
      </div>

      {/* Year Navigation */}
      <div className="flex justify-between items-center mt-12 pt-8 border-t border-slate-200">
        <Link
          href={`/states/north-carolina/warn/years/${year - 1}`}
          className="text-blue-600 hover:underline"
        >
          ← {year - 1}
        </Link>
        <Link
          href="/states/north-carolina/warn"
          className="text-slate-600 hover:text-blue-600"
        >
          All Years
        </Link>
        {year < new Date().getFullYear() && (
          <Link
            href={`/states/north-carolina/warn/years/${year + 1}`}
            className="text-blue-600 hover:underline"
          >
            {year + 1} →
          </Link>
        )}
      </div>

      <div className="mt-12">
        <Disclaimer />
      </div>
    </div>
  );
}
