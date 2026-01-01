/**
 * Individual Notice Detail Page
 * Shows complete details for a single WARN notice
 * This is the most important page for SEO - includes full JSON-LD structured data
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { prisma } from '@/lib/db';
import { Breadcrumbs, generateWarnBreadcrumbs } from '@/components/Breadcrumbs';
import { NoticeCardCompact } from '@/components/NoticeCard';
import { Disclaimer } from '@/components/Disclaimer';
import { NextSteps } from '@/components/NextSteps';
import { formatDate } from '@/lib/normalize';

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const notice = await prisma.warnNotice.findUnique({
    where: { id: parseInt(params.id, 10) },
    include: { county: true },
  });

  if (!notice) {
    return { title: 'Notice Not Found | NCWarn.com' };
  }

  const county = notice.county?.name ? `${notice.county.name} County` : 'NC';
  const workers = notice.impacted ? `${notice.impacted} workers affected` : '';

  return {
    title: `${notice.employer} Layoff Notice - ${county} | NCWarn.com`,
    description: `WARN Act notice for ${notice.employer} in ${county}, North Carolina. ${workers}. Filed ${formatDate(notice.noticeDate)}.`,
    openGraph: {
      title: `${notice.employer} WARN Act Layoff Notice`,
      description: `${notice.employer} layoff notice in ${county}. ${workers}.`,
      url: `https://ncwarn.com/states/north-carolina/warn/notices/${params.id}`,
    },
  };
}

export const revalidate = 86400; // Revalidate daily for individual notices

async function getNoticeData(id: string) {
  const noticeId = parseInt(id, 10);
  if (isNaN(noticeId)) return null;

  const notice = await prisma.warnNotice.findUnique({
    where: { id: noticeId },
    include: {
      county: { select: { name: true, slug: true } },
      company: { select: { name: true, slug: true } },
      state: { select: { code: true, name: true } },
    },
  });

  if (!notice || notice.state?.code !== 'NC') return null;

  // Get related notices (same company or county)
  const relatedNotices = await prisma.warnNotice.findMany({
    where: {
      OR: [
        notice.companyId ? { companyId: notice.companyId } : {},
        notice.countyId ? { countyId: notice.countyId } : {},
      ],
      id: { not: notice.id },
    },
    include: {
      county: { select: { name: true, slug: true } },
    },
    orderBy: { noticeDate: 'desc' },
    take: 5,
  });

  return { notice, relatedNotices };
}

function generateNoticeJsonLd(notice: {
  employer: string;
  city?: string | null;
  noticeDate: Date;
  effectiveOn?: Date | null;
  impacted?: number | null;
  county?: { name: string } | null;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: `${notice.employer} WARN Act Layoff Notice`,
    datePublished: notice.noticeDate.toISOString(),
    description: `WARN Act layoff notice filed by ${notice.employer}${notice.county ? ` in ${notice.county.name} County, NC` : ''}. ${notice.impacted ? `${notice.impacted} workers affected.` : ''}`,
    publisher: {
      '@type': 'Organization',
      name: 'NCWarn.com',
      url: 'https://ncwarn.com',
    },
    about: {
      '@type': 'Event',
      name: 'Layoff Notice',
      organizer: {
        '@type': 'Organization',
        name: notice.employer,
      },
      location: {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          addressLocality: notice.city || undefined,
          addressRegion: 'NC',
          addressCountry: 'US',
        },
      },
    },
  };
}

export default async function NoticePage({ params }: PageProps) {
  const data = await getNoticeData(params.id);

  if (!data) {
    notFound();
  }

  const { notice, relatedNotices } = data;
  const jsonLd = generateNoticeJsonLd(notice);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* JSON-LD Structured Data */}
      <Script
        id="notice-jsonld"
        type="application/ld+json"
        strategy="afterInteractive"
      >
        {JSON.stringify(jsonLd)}
      </Script>

      <Breadcrumbs
        items={generateWarnBreadcrumbs({
          notice: { id: notice.id, employer: notice.employer },
        })}
      />

      {/* Main Notice Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">{notice.employer}</h1>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column - Details */}
          <div className="space-y-4">
            {notice.county && (
              <div>
                <div className="text-sm text-slate-500">County</div>
                <Link
                  href={`/states/north-carolina/warn/counties/${notice.county.slug}`}
                  className="text-blue-600 hover:underline"
                >
                  {notice.county.name} County
                </Link>
              </div>
            )}

            {notice.city && (
              <div>
                <div className="text-sm text-slate-500">City</div>
                <div className="text-slate-900">{notice.city}</div>
              </div>
            )}

            {notice.industry && (
              <div>
                <div className="text-sm text-slate-500">Industry</div>
                <div className="text-slate-900">{notice.industry}</div>
              </div>
            )}

            {notice.company && (
              <div>
                <div className="text-sm text-slate-500">Company Profile</div>
                <Link
                  href={`/states/north-carolina/warn/companies/${notice.company.slug}`}
                  className="text-blue-600 hover:underline"
                >
                  View all {notice.company.name} notices
                </Link>
              </div>
            )}
          </div>

          {/* Right Column - Impact & Dates */}
          <div className="space-y-4">
            {notice.impacted && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                <div className="text-3xl font-bold text-red-600">
                  {notice.impacted.toLocaleString()}
                </div>
                <div className="text-sm text-red-700">Workers Affected</div>
              </div>
            )}

            <div>
              <div className="text-sm text-slate-500">Notice Filed</div>
              <div className="text-slate-900 font-medium">{formatDate(notice.noticeDate)}</div>
            </div>

            {notice.effectiveOn && (
              <div>
                <div className="text-sm text-slate-500">Effective Date</div>
                <div className="text-slate-900 font-medium">{formatDate(notice.effectiveOn)}</div>
              </div>
            )}

          </div>
        </div>

        {/* Notes/Description */}
        {notice.notes && (
          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="text-sm text-slate-500 mb-2">Additional Details</div>
            <p className="text-slate-700">{notice.notes}</p>
          </div>
        )}
      </div>

      {/* Related Notices */}
      {relatedNotices.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Related Notices</h2>
          <div className="space-y-2">
            {relatedNotices.map((related) => (
              <NoticeCardCompact key={related.id} notice={related} />
            ))}
          </div>
        </div>
      )}

      {/* Next Steps */}
      <NextSteps title="Affected by this layoff?" />

      {/* Navigation */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-200">
        <Link href="/states/north-carolina/warn" className="text-blue-600 hover:underline">
          ← All NC Notices
        </Link>
        {notice.county && (
          <Link
            href={`/states/north-carolina/warn/counties/${notice.county.slug}`}
            className="text-blue-600 hover:underline"
          >
            More in {notice.county.name} County →
          </Link>
        )}
      </div>

      <div className="mt-8">
        <Disclaimer />
      </div>
    </div>
  );
}
