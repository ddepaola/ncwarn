import { Suspense } from 'react';
import { prisma } from '@/lib/db';
import { generateMetadata as genMeta } from '@/lib/seo';
import { REMOTIVE_CATEGORIES, getRemotiveAffiliateUrl } from '@/lib/sources/remotive';
import Notice from '@/components/Notice';
import { format } from 'date-fns';

export const metadata = genMeta({
  title: 'Remote Jobs',
  description: 'Browse remote job opportunities from top companies. Find work-from-home positions in software, marketing, design, and more.',
  path: '/jobs',
});

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

async function getRemoteJobs(category?: string, search?: string) {
  const where: Record<string, unknown> = {};

  if (category && category !== 'all') {
    where.category = category;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { company: { contains: search, mode: 'insensitive' } },
    ];
  }

  const jobs = await prisma.remoteJob.findMany({
    where,
    orderBy: { publishedAt: 'desc' },
    take: 100,
  });

  return jobs;
}

async function getJobStats() {
  const [total, categories] = await Promise.all([
    prisma.remoteJob.count(),
    prisma.remoteJob.groupBy({
      by: ['category'],
      _count: { category: true },
      orderBy: { _count: { category: 'desc' } },
    }),
  ]);

  return { total, categories };
}

const categoryIcons: Record<string, string> = {
  'Software Development': '💻',
  'Customer Service': '🎧',
  'Design': '🎨',
  'Marketing': '📣',
  'Sales': '💼',
  'Product': '📦',
  'Business': '📊',
  'Data': '📈',
  'DevOps / Sysadmin': '⚙️',
  'Finance / Legal': '💰',
  'Human Resources': '👥',
  'QA': '🔍',
  'Writing': '✍️',
  'All Others': '🌐',
};

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const params = await searchParams;
  const [jobs, stats] = await Promise.all([
    getRemoteJobs(params.category, params.q),
    getJobStats(),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Remote Jobs</h1>
        <p className="mt-2 text-gray-600">
          Browse remote job opportunities from top companies worldwide. Work from anywhere positions updated daily.
        </p>
      </div>

      {/* Stats Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-4xl font-bold">{stats.total.toLocaleString()}</div>
            <div className="text-purple-100">Remote positions available</div>
          </div>
          <a
            href={getRemotiveAffiliateUrl('/remote-jobs')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white text-purple-600 px-6 py-3 rounded-lg font-medium hover:bg-purple-50 transition-colors"
          >
            View All on Remotive
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>

      {/* Category Filters */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <a
            href="/jobs"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              !params.category ? 'bg-purple-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            All Jobs
          </a>
          {stats.categories.slice(0, 8).map(cat => (
            <a
              key={cat.category}
              href={`/jobs?category=${encodeURIComponent(cat.category)}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                params.category === cat.category
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <span>{categoryIcons[cat.category] || '💼'}</span>
              {cat.category}
              <span className="ml-1 text-xs opacity-75">({cat._count.category})</span>
            </a>
          ))}
        </div>
      </div>

      {/* Search */}
      <form className="mb-6" action="/jobs" method="get">
        <div className="flex gap-2">
          <input
            type="text"
            name="q"
            defaultValue={params.q}
            placeholder="Search jobs by title or company..."
            className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            Search
          </button>
        </div>
        {params.category && (
          <input type="hidden" name="category" value={params.category} />
        )}
      </form>

      {/* Job Listings */}
      <div className="space-y-4">
        {jobs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-gray-500 mb-4">No jobs found matching your criteria.</p>
            <a
              href="/jobs"
              className="text-purple-600 hover:underline"
            >
              View all jobs
            </a>
          </div>
        ) : (
          jobs.map(job => (
            <article
              key={job.id}
              className="bg-white rounded-lg border p-5 hover:shadow-md hover:border-purple-200 transition-all"
            >
              <div className="flex items-start gap-4">
                {job.companyLogo && (
                  <img
                    src={job.companyLogo}
                    alt={`${job.company} logo`}
                    className="w-12 h-12 rounded-lg object-contain bg-gray-50"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {categoryIcons[job.category] || '💼'} {job.category}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      🌍 {job.location}
                    </span>
                    {job.jobType === 'full_time' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Full-time
                      </span>
                    )}
                    {job.salary && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        💵 {job.salary}
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-purple-600 transition-colors"
                    >
                      {job.title}
                    </a>
                  </h2>
                  <p className="text-gray-600 mb-2">{job.company}</p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <span>Posted {format(new Date(job.publishedAt), 'MMM d, yyyy')}</span>
                    {job.tags && job.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {job.tags.slice(0, 4).map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                >
                  Apply →
                </a>
              </div>
            </article>
          ))
        )}
      </div>

      {/* More on Remotive */}
      {jobs.length > 0 && (
        <div className="mt-8 text-center">
          <a
            href={getRemotiveAffiliateUrl('/remote-jobs')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-purple-600 font-medium hover:text-purple-800"
          >
            Browse more remote jobs on Remotive
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      )}

      {/* NC Job Resources */}
      <div className="mt-12 bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">North Carolina Job Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="https://www.ncworks.gov"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 bg-white rounded-lg border hover:border-blue-300 hover:shadow transition-all"
          >
            <h3 className="font-semibold text-gray-900">NCWorks Online</h3>
            <p className="text-sm text-gray-500">State's official job search website</p>
          </a>
          <a
            href="https://oshr.nc.gov/work-nc"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 bg-white rounded-lg border hover:border-blue-300 hover:shadow transition-all"
          >
            <h3 className="font-semibold text-gray-900">Work for NC</h3>
            <p className="text-sm text-gray-500">State government careers</p>
          </a>
          <a
            href="https://www.usajobs.gov/Search?l=North+Carolina"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 bg-white rounded-lg border hover:border-blue-300 hover:shadow transition-all"
          >
            <h3 className="font-semibold text-gray-900">USAJobs - NC</h3>
            <p className="text-sm text-gray-500">Federal jobs in North Carolina</p>
          </a>
        </div>
      </div>

      {/* Attribution */}
      <div className="mt-8 text-center text-sm text-gray-500">
        Remote job listings powered by{' '}
        <a
          href={getRemotiveAffiliateUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-600 hover:underline"
        >
          Remotive
        </a>
      </div>
    </div>
  );
}
