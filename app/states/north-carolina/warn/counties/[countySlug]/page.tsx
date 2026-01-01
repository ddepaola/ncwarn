/**
 * Individual County Page
 * Shows all WARN notices for a specific county
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Breadcrumbs, generateWarnBreadcrumbs } from '@/components/Breadcrumbs';
import { NoticeCard } from '@/components/NoticeCard';
import { Disclaimer } from '@/components/Disclaimer';
import { NextSteps } from '@/components/NextSteps';

interface PageProps {
  params: { countySlug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const state = await prisma.state.findUnique({ where: { code: 'NC' } });
  if (!state) return { title: 'County Not Found | NCWarn.com' };

  const county = await prisma.county.findFirst({
    where: { slug: params.countySlug, stateId: state.id },
  });

  if (!county) {
    return { title: 'County Not Found | NCWarn.com' };
  }

  return {
    title: `${county.name} County NC WARN Notices | NCWarn.com`,
    description: `WARN Act layoff notices in ${county.name} County, North Carolina. Track workforce reductions and layoffs affecting local workers.`,
    openGraph: {
      title: `${county.name} County Layoff Notices`,
      description: `WARN Act layoff notices in ${county.name} County, NC.`,
      url: `https://ncwarn.com/states/north-carolina/warn/counties/${params.countySlug}`,
    },
  };
}

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

async function getCountyData(slug: string) {
  const state = await prisma.state.findUnique({ where: { code: 'NC' } });
  if (!state) return null;

  const county = await prisma.county.findFirst({
    where: { slug, stateId: state.id },
    include: {
      state: { select: { code: true, name: true } },
    },
  });

  if (!county) {
    return null;
  }

  const [notices, yearStats] = await Promise.all([
    prisma.warnNotice.findMany({
      where: { countyId: county.id },
      include: {
        company: { select: { name: true, slug: true } },
      },
      orderBy: { noticeDate: 'desc' },
    }),
    prisma.warnNotice.groupBy({
      by: ['noticeDate'],
      where: { countyId: county.id },
      _count: true,
      _sum: { impacted: true },
    }),
  ]);

  // Aggregate by year
  const yearCounts: Record<number, { count: number; impacted: number }> = {};
  yearStats.forEach((stat) => {
    const year = new Date(stat.noticeDate).getFullYear();
    if (!yearCounts[year]) {
      yearCounts[year] = { count: 0, impacted: 0 };
    }
    yearCounts[year].count += stat._count;
    yearCounts[year].impacted += stat._sum.impacted || 0;
  });

  return { county, notices, yearCounts };
}

export default async function CountyPage({ params }: PageProps) {
  const data = await getCountyData(params.countySlug);

  if (!data) {
    notFound();
  }

  const { county, notices, yearCounts } = data;
  const totalImpacted = notices.reduce((sum, n) => sum + (n.impacted || 0), 0);
  const years = Object.keys(yearCounts)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Breadcrumbs
        items={generateWarnBreadcrumbs({ county: { name: county.name, slug: county.slug } })}
      />

      <h1 className="text-3xl font-bold text-slate-900 mb-2">
        {county.name} County WARN Notices
      </h1>
      <p className="text-lg text-slate-600 mb-8">
        {notices.length === 0
          ? 'No WARN notices on record for this county'
          : `${notices.length} ${notices.length === 1 ? 'notice' : 'notices'} affecting ${totalImpacted.toLocaleString()} workers`}
      </p>

      {notices.length > 0 && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white border border-slate-200 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-slate-900">{notices.length}</div>
              <div className="text-sm text-slate-600">Total Notices</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-red-600">
                {totalImpacted.toLocaleString()}
              </div>
              <div className="text-sm text-slate-600">Workers Affected</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">{years.length}</div>
              <div className="text-sm text-slate-600">Years on Record</div>
            </div>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Year Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-slate-50 rounded-lg p-4 sticky top-4">
                <h3 className="font-semibold text-slate-900 mb-3">Notices by Year</h3>
                <ul className="space-y-2">
                  {years.map((year) => (
                    <li key={year} className="flex justify-between text-sm">
                      <span className="text-slate-700">{year}</span>
                      <span className="text-slate-500">
                        {yearCounts[year].count} ({yearCounts[year].impacted.toLocaleString()})
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Notice List */}
            <div className="lg:col-span-3">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">All Notices</h2>
              <div className="space-y-3">
                {notices.map((notice) => (
                  <NoticeCard key={notice.id} notice={notice} showCounty={false} />
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {notices.length === 0 && (
        <div className="bg-slate-50 rounded-lg p-8 text-center">
          <p className="text-slate-600">
            No WARN Act notices have been filed in {county.name} County that we have on record.
          </p>
          <Link
            href="/states/north-carolina/warn/counties"
            className="inline-block mt-4 text-blue-600 hover:underline"
          >
            View all NC counties →
          </Link>
        </div>
      )}

      {/* Next Steps */}
      {notices.length > 0 && <NextSteps />}

      <div className="mt-8">
        <Disclaimer />
      </div>
    </div>
  );
}
