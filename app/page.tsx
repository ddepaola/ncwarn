/**
 * NCWarn Homepage
 * Focus: North Carolina WARN Act Layoff Notices & Intelligence
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { NoticeCard } from '@/components/NoticeCard';
import { Disclaimer } from '@/components/Disclaimer';
import { generateFaqSchema } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'NC WARN Act Notices 2026 - North Carolina Layoffs & Plant Closings | NCWarn.com',
  description:
    'Track all WARN Act layoff notices filed in North Carolina for 2026. Free searchable database of plant closings and mass layoffs by company, county, and date. 1,947+ workers affected in 2026 alone.',
  keywords: [
    'NC WARN notices',
    'NC WARN Act',
    'North Carolina layoffs',
    'NC layoffs 2026',
    'WARN notices North Carolina',
    'NC plant closings',
    'North Carolina WARN Act notices',
    'warn act north carolina',
    'nc warn notices 2026',
  ],
  openGraph: {
    title: 'NC WARN Act Notices 2026 - North Carolina Layoffs & Plant Closings',
    description: 'Track all WARN Act layoff notices filed in North Carolina. Free searchable database updated with the latest filings from NC Commerce.',
    url: 'https://ncwarn.com',
  },
  alternates: {
    canonical: 'https://ncwarn.com',
  },
};

export const dynamic = 'force-dynamic';
export const revalidate = 300; // Revalidate every 5 minutes

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

  const homepageFaqs = [
    {
      question: 'What is a WARN notice in North Carolina?',
      answer: 'A WARN (Worker Adjustment and Retraining Notification) notice is a filing required by federal law when employers with 100+ employees plan a plant closing or mass layoff affecting 50 or more workers. In North Carolina, these notices are filed with the NC Department of Commerce at least 60 days before the layoff date.',
    },
    {
      question: 'How many WARN notices have been filed in NC in 2026?',
      answer: `As of March 2026, ${stats.totalNotices} WARN notices have been tracked across North Carolina, with ${stats.recentNotices} filed in the last 30 days affecting ${stats.recentImpacted.toLocaleString()} workers.`,
    },
    {
      question: 'Where can I find NC WARN Act layoff notices?',
      answer: 'NCWarn.com provides a free, searchable database of all WARN Act notices filed in North Carolina. You can search by company name, county, or date. Official notices are also available from the NC Department of Commerce.',
    },
    {
      question: 'What should I do if my employer filed a WARN notice?',
      answer: 'If your employer has filed a WARN notice, you should: (1) File for unemployment benefits at des.nc.gov within the first week, (2) Update your resume and LinkedIn profile, (3) Check NCWarn.com for details about the notice, and (4) Explore retraining programs through NCWorks Career Centers.',
    },
    {
      question: 'Which NC counties have the most WARN notices?',
      answer: 'Mecklenburg County (Charlotte area) and Wake County (Raleigh area) typically have the most WARN notices due to their large populations and corporate presence. You can browse notices by county on NCWarn.com.',
    },
  ];

  // FAQ schema is safe - generated from static/controlled data, no user input
  const faqSchemaJson = JSON.stringify(generateFaqSchema(homepageFaqs));

  return (
    <div className="min-h-screen">
      {/* FAQ Schema for rich results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: faqSchemaJson }}
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-800 to-slate-900 text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            NC WARN Act Notices 2026 — North Carolina Layoffs & Plant Closings
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mb-8">
            Track layoffs and plant closings across North Carolina. Free searchable
            database of {stats.totalNotices}+ WARN Act filings updated with the latest from NC Commerce.
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

      {/* FAQ Section - visible content matches FAQ schema */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">
          Frequently Asked Questions About NC WARN Notices
        </h2>
        <div className="space-y-4">
          {homepageFaqs.map((faq, i) => (
            <details
              key={i}
              className="bg-white border border-slate-200 rounded-lg group"
            >
              <summary className="p-4 font-semibold text-slate-900 cursor-pointer hover:text-blue-600 transition-colors">
                {faq.question}
              </summary>
              <div className="px-4 pb-4 text-slate-600">{faq.answer}</div>
            </details>
          ))}
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
