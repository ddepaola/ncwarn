/**
 * Individual Company Page
 * Shows all WARN notices for a specific company
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
  params: { companySlug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const company = await prisma.company.findUnique({
    where: { slug: params.companySlug },
  });

  if (!company) {
    return { title: 'Company Not Found | NCWarn.com' };
  }

  return {
    title: `${company.name} WARN Notices NC | NCWarn.com`,
    description: `WARN Act layoff notices filed by ${company.name} in North Carolina. View all workforce reduction filings and affected worker counts.`,
    openGraph: {
      title: `${company.name} NC Layoff Notices`,
      description: `WARN Act layoff notices filed by ${company.name} in NC.`,
      url: `https://ncwarn.com/states/north-carolina/warn/companies/${params.companySlug}`,
    },
  };
}

export const revalidate = 3600;

async function getCompanyData(slug: string) {
  const state = await prisma.state.findUnique({ where: { code: 'NC' } });
  if (!state) return null;

  const company = await prisma.company.findUnique({
    where: { slug },
  });

  if (!company) return null;

  const notices = await prisma.warnNotice.findMany({
    where: {
      companyId: company.id,
      stateId: state.id,
    },
    include: {
      county: { select: { name: true, slug: true } },
    },
    orderBy: { noticeDate: 'desc' },
  });

  // If no NC notices, still return company but with empty notices
  return { company, notices };
}

export default async function CompanyPage({ params }: PageProps) {
  const data = await getCompanyData(params.companySlug);

  if (!data) {
    notFound();
  }

  const { company, notices } = data;
  const totalImpacted = notices.reduce((sum, n) => sum + (n.impacted || 0), 0);

  // Get unique counties
  const counties = [...new Set(notices.filter((n) => n.county).map((n) => n.county!.name))];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Breadcrumbs
        items={generateWarnBreadcrumbs({ company: { name: company.name, slug: company.slug } })}
      />

      <h1 className="text-3xl font-bold text-slate-900 mb-2">{company.name}</h1>
      <p className="text-lg text-slate-600 mb-8">
        {notices.length === 0
          ? 'No NC WARN notices on record'
          : `${notices.length} WARN ${notices.length === 1 ? 'notice' : 'notices'} in North Carolina`}
      </p>

      {notices.length > 0 && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white border border-slate-200 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-slate-900">{notices.length}</div>
              <div className="text-sm text-slate-600">NC Notices</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-red-600">
                {totalImpacted.toLocaleString()}
              </div>
              <div className="text-sm text-slate-600">Total Workers</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">{counties.length}</div>
              <div className="text-sm text-slate-600">Counties</div>
            </div>
          </div>

          {/* Counties affected */}
          {counties.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Counties Affected</h2>
              <div className="flex flex-wrap gap-2">
                {counties.map((county) => {
                  const countyData = notices.find((n) => n.county?.name === county)?.county;
                  return (
                    <Link
                      key={county}
                      href={`/states/north-carolina/warn/counties/${countyData?.slug}`}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded text-sm text-slate-700"
                    >
                      {county} County
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notice List */}
          <h2 className="text-xl font-semibold text-slate-900 mb-4">All Notices</h2>
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
            No WARN Act notices on record for {company.name} in North Carolina.
          </p>
          <Link
            href="/states/north-carolina/warn/companies"
            className="inline-block mt-4 text-blue-600 hover:underline"
          >
            Browse all companies →
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
