/**
 * Month Archive Page
 * Shows all WARN notices for a specific month/year
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Breadcrumbs, generateWarnBreadcrumbs } from '@/components/Breadcrumbs';
import { NoticeCard } from '@/components/NoticeCard';
import { Disclaimer } from '@/components/Disclaimer';

interface PageProps {
  params: { year: string; month: string };
}

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const monthIndex = parseInt(params.month, 10) - 1;
  const monthName = monthNames[monthIndex] || 'Unknown';
  const year = params.year;

  return {
    title: `${monthName} ${year} NC WARN Act Notices | NCWarn.com`,
    description: `WARN Act layoff notices filed in North Carolina during ${monthName} ${year}. View affected companies, workers, and locations.`,
    openGraph: {
      title: `${monthName} ${year} North Carolina Layoff Notices`,
      description: `Complete list of WARN Act layoff notices filed in NC during ${monthName} ${year}.`,
      url: `https://ncwarn.com/states/north-carolina/warn/${year}/${params.month}`,
    },
  };
}

export const revalidate = 3600;

async function getNoticesForMonth(year: string, month: string) {
  const yearNum = parseInt(year, 10);
  const monthNum = parseInt(month, 10);

  if (isNaN(yearNum) || isNaN(monthNum)) return null;
  if (yearNum < 1988 || yearNum > new Date().getFullYear() + 1) return null;
  if (monthNum < 1 || monthNum > 12) return null;

  const state = await prisma.state.findUnique({ where: { code: 'NC' } });
  if (!state) return null;

  const startDate = new Date(yearNum, monthNum - 1, 1);
  const endDate = new Date(yearNum, monthNum, 1);

  const notices = await prisma.warnNotice.findMany({
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
  });

  return { notices, year: yearNum, month: monthNum };
}

function getPrevMonth(year: number, month: number): { year: number; month: number } {
  if (month === 1) return { year: year - 1, month: 12 };
  return { year, month: month - 1 };
}

function getNextMonth(year: number, month: number): { year: number; month: number } {
  if (month === 12) return { year: year + 1, month: 1 };
  return { year, month: month + 1 };
}

export default async function MonthPage({ params }: PageProps) {
  const data = await getNoticesForMonth(params.year, params.month);

  if (!data) {
    notFound();
  }

  const { notices, year, month } = data;
  const monthName = monthNames[month - 1];
  const totalImpacted = notices.reduce((sum, n) => sum + (n.impacted || 0), 0);

  const prev = getPrevMonth(year, month);
  const next = getNextMonth(year, month);
  const now = new Date();
  const canShowNext = next.year < now.getFullYear() ||
    (next.year === now.getFullYear() && next.month <= now.getMonth() + 1);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Breadcrumbs items={generateWarnBreadcrumbs({ year: params.year, month: params.month })} />

      <h1 className="text-3xl font-bold text-slate-900 mb-2">
        {monthName} {year} WARN Notices
      </h1>
      <p className="text-lg text-slate-600 mb-8">
        {notices.length === 0
          ? 'No WARN notices filed during this month'
          : `${notices.length} ${notices.length === 1 ? 'notice' : 'notices'} affecting ${totalImpacted.toLocaleString()} workers`}
      </p>

      {notices.length > 0 && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white border border-slate-200 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-slate-900">{notices.length}</div>
              <div className="text-sm text-slate-600">Notices Filed</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-red-600">
                {totalImpacted.toLocaleString()}
              </div>
              <div className="text-sm text-slate-600">Workers Affected</div>
            </div>
          </div>

          {/* Notice List */}
          <div className="space-y-3">
            {notices.map((notice) => (
              <NoticeCard key={notice.id} notice={notice} />
            ))}
          </div>
        </>
      )}

      {notices.length === 0 && (
        <div className="bg-slate-50 rounded-lg p-8 text-center">
          <p className="text-slate-600">
            No WARN Act notices were filed in North Carolina during {monthName} {year}.
          </p>
          <Link
            href={`/states/north-carolina/warn/years/${year}`}
            className="inline-block mt-4 text-blue-600 hover:underline"
          >
            View all {year} notices →
          </Link>
        </div>
      )}

      {/* Month Navigation */}
      <div className="flex justify-between items-center mt-12 pt-8 border-t border-slate-200">
        <Link
          href={`/states/north-carolina/warn/${prev.year}/${String(prev.month).padStart(2, '0')}`}
          className="text-blue-600 hover:underline"
        >
          ← {monthNames[prev.month - 1]} {prev.year}
        </Link>
        <Link
          href={`/states/north-carolina/warn/years/${year}`}
          className="text-slate-600 hover:text-blue-600"
        >
          All of {year}
        </Link>
        {canShowNext && (
          <Link
            href={`/states/north-carolina/warn/${next.year}/${String(next.month).padStart(2, '0')}`}
            className="text-blue-600 hover:underline"
          >
            {monthNames[next.month - 1]} {next.year} →
          </Link>
        )}
      </div>

      <div className="mt-12">
        <Disclaimer />
      </div>
    </div>
  );
}
