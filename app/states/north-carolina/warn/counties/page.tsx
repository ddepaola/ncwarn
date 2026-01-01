/**
 * Counties Index Page
 * Lists all NC counties with WARN notice counts
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Disclaimer } from '@/components/Disclaimer';

export const metadata: Metadata = {
  title: 'NC WARN Notices by County | NCWarn.com',
  description:
    'Browse WARN Act layoff notices by North Carolina county. Find workforce reduction notices in your area.',
  openGraph: {
    title: 'North Carolina WARN Notices by County',
    description: 'Browse layoff notices by NC county. Find workforce reductions in your area.',
    url: 'https://ncwarn.com/states/north-carolina/warn/counties',
  },
};

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

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

export default async function CountiesPage() {
  const counties = await getCounties();
  const activeCounties = counties.filter((c) => c._count.notices > 0);
  const emptyCounties = counties.filter((c) => c._count.notices === 0);

  const totalNotices = activeCounties.reduce((sum, c) => sum + c._count.notices, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'North Carolina', href: '/states/north-carolina' },
          { label: 'WARN Notices', href: '/states/north-carolina/warn' },
          { label: 'Counties' },
        ]}
      />

      <h1 className="text-3xl font-bold text-slate-900 mb-2">
        WARN Notices by North Carolina County
      </h1>
      <p className="text-lg text-slate-600 mb-8">
        {totalNotices.toLocaleString()} notices across {activeCounties.length} counties
      </p>

      {/* Active Counties Grid */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          Counties with WARN Notices
        </h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {activeCounties
            .sort((a, b) => b._count.notices - a._count.notices)
            .map((county) => (
              <Link
                key={county.id}
                href={`/states/north-carolina/warn/counties/${county.slug}`}
                className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="font-medium text-slate-900">{county.name}</div>
                <div className="text-sm text-slate-500 mt-1">
                  {county._count.notices} {county._count.notices === 1 ? 'notice' : 'notices'}
                </div>
              </Link>
            ))}
        </div>
      </div>

      {/* Empty Counties */}
      {emptyCounties.length > 0 && (
        <div className="bg-slate-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-slate-700 mb-3">
            Counties with No WARN Notices
          </h2>
          <p className="text-sm text-slate-600 mb-4">
            These counties have no recorded WARN Act notices in our database.
          </p>
          <div className="flex flex-wrap gap-2">
            {emptyCounties.map((county) => (
              <span
                key={county.id}
                className="px-3 py-1 bg-slate-200 text-slate-600 rounded text-sm"
              >
                {county.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-12">
        <Disclaimer />
      </div>
    </div>
  );
}
