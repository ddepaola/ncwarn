/**
 * North Carolina WARN Notices Hub
 * Main listing page for all NC WARN notices with filtering
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { NoticeCard } from '@/components/NoticeCard';
import { Disclaimer } from '@/components/Disclaimer';
import { NextSteps } from '@/components/NextSteps';

export const metadata: Metadata = {
  title: 'NC WARN Act Layoff Notices - Full Database | NCWarn.com',
  description:
    'Complete database of North Carolina WARN Act layoff notices. Search by company, county, or date. Updated regularly with the latest workforce reduction filings.',
  openGraph: {
    title: 'North Carolina WARN Act Layoff Notices Database',
    description: 'Complete database of NC WARN Act layoff notices. Search by company, county, or date.',
    url: 'https://ncwarn.com/states/north-carolina/warn',
  },
};

export const revalidate = 3600; // Revalidate hourly

interface SearchParams {
  page?: string;
}

async function getNotices(page: number = 1, perPage: number = 25) {
  const state = await prisma.state.findUnique({ where: { code: 'NC' } });
  if (!state) return { notices: [], total: 0 };

  const [notices, total] = await Promise.all([
    prisma.warnNotice.findMany({
      where: { stateId: state.id },
      include: {
        county: { select: { name: true, slug: true } },
        company: { select: { name: true, slug: true } },
      },
      orderBy: { noticeDate: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.warnNotice.count({ where: { stateId: state.id } }),
  ]);

  return { notices, total };
}

async function getYears() {
  const state = await prisma.state.findUnique({ where: { code: 'NC' } });
  if (!state) return [];

  const notices = await prisma.warnNotice.findMany({
    where: { stateId: state.id },
    select: { noticeDate: true },
    orderBy: { noticeDate: 'desc' },
  });

  const years = [...new Set(notices.map((n) => n.noticeDate.getFullYear()))];
  return years.sort((a, b) => b - a);
}

async function getCounties() {
  const state = await prisma.state.findUnique({ where: { code: 'NC' } });
  if (!state) return [];

  return prisma.county.findMany({
    where: { stateId: state.id },
    include: {
      _count: { select: { notices: true } },
    },
    orderBy: { name: 'asc' },
  });
}

export default async function WarnHubPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const page = parseInt(searchParams.page || '1', 10);
  const perPage = 25;

  const [{ notices, total }, years, counties] = await Promise.all([
    getNotices(page, perPage),
    getYears(),
    getCounties(),
  ]);

  const totalPages = Math.ceil(total / perPage);
  const hasActiveCounties = counties.filter((c) => c._count.notices > 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'North Carolina', href: '/states/north-carolina' },
          { label: 'WARN Notices' },
        ]}
      />

      <h1 className="text-3xl font-bold text-slate-900 mb-2">
        North Carolina WARN Act Notices
      </h1>
      <p className="text-lg text-slate-600 mb-8">
        {total.toLocaleString()} layoff notices filed in North Carolina
      </p>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <div className="lg:col-span-1 space-y-6">
          {/* Browse by Year */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h3 className="font-semibold text-slate-900 mb-3">Browse by Year</h3>
            <ul className="space-y-1">
              {years.slice(0, 10).map((year) => (
                <li key={year}>
                  <Link
                    href={`/states/north-carolina/warn/years/${year}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {year}
                  </Link>
                </li>
              ))}
            </ul>
            {years.length > 10 && (
              <p className="text-xs text-slate-500 mt-2">
                + {years.length - 10} more years
              </p>
            )}
          </div>

          {/* Browse by County */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h3 className="font-semibold text-slate-900 mb-3">Top Counties</h3>
            <ul className="space-y-1">
              {hasActiveCounties
                .sort((a, b) => b._count.notices - a._count.notices)
                .slice(0, 10)
                .map((county) => (
                  <li key={county.id}>
                    <Link
                      href={`/states/north-carolina/warn/counties/${county.slug}`}
                      className="flex justify-between text-sm hover:text-blue-600"
                    >
                      <span>{county.name}</span>
                      <span className="text-slate-400">{county._count.notices}</span>
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
        </div>

        {/* Notice List */}
        <div className="lg:col-span-3">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-slate-900">
              All Notices
              {page > 1 && <span className="text-slate-500 font-normal"> - Page {page}</span>}
            </h2>
            <div className="text-sm text-slate-500">
              Showing {((page - 1) * perPage) + 1}-{Math.min(page * perPage, total)} of {total.toLocaleString()}
            </div>
          </div>

          <div className="space-y-3">
            {notices.map((notice) => (
              <NoticeCard key={notice.id} notice={notice} />
            ))}
          </div>

          {notices.length === 0 && (
            <p className="text-slate-500 italic py-8 text-center">No notices found.</p>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="flex justify-center gap-2 mt-8" aria-label="Pagination">
              {page > 1 && (
                <Link
                  href={`/states/north-carolina/warn?page=${page - 1}`}
                  className="px-4 py-2 bg-slate-100 rounded hover:bg-slate-200 text-sm"
                >
                  ← Previous
                </Link>
              )}

              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <Link
                    key={pageNum}
                    href={`/states/north-carolina/warn?page=${pageNum}`}
                    className={`px-4 py-2 rounded text-sm ${
                      pageNum === page
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 hover:bg-slate-200'
                    }`}
                  >
                    {pageNum}
                  </Link>
                );
              })}

              {page < totalPages && (
                <Link
                  href={`/states/north-carolina/warn?page=${page + 1}`}
                  className="px-4 py-2 bg-slate-100 rounded hover:bg-slate-200 text-sm"
                >
                  Next →
                </Link>
              )}
            </nav>
          )}
        </div>
      </div>

      {/* Next Steps */}
      <NextSteps />

      {/* Disclaimer */}
      <div className="mt-8">
        <Disclaimer />
      </div>
    </div>
  );
}
