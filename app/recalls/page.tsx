import { Suspense } from 'react';
import { prisma } from '@/lib/db';
import { generateMetadata as genMeta } from '@/lib/seo';
import { RECALL_TYPES } from '@/lib/sources/recalls';
import SearchBox from '@/components/SearchBox';
import Tabs from '@/components/Tabs';
import Notice from '@/components/Notice';
import { format } from 'date-fns';

export const metadata = genMeta({
  title: 'Recalls & Safety',
  description: 'Search vehicle, product, and food recalls from NHTSA, CPSC, and FDA. Check if your products have been recalled.',
  path: '/recalls',
});

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

async function getRecalls(type?: string, query?: string) {
  const where: Record<string, unknown> = {};

  if (type && type !== 'all') {
    where.category = type;
  }

  if (query) {
    where.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { affected: { contains: query, mode: 'insensitive' } },
    ];
  }

  const recalls = await prisma.recall.findMany({
    where,
    orderBy: { publishedAt: 'desc' },
    take: 100,
  });

  return recalls;
}

async function getRecallStats() {
  const [vehicle, product, food, total] = await Promise.all([
    prisma.recall.count({ where: { category: 'vehicle' } }),
    prisma.recall.count({ where: { category: 'product' } }),
    prisma.recall.count({ where: { category: 'food' } }),
    prisma.recall.count(),
  ]);

  return { vehicle, product, food, total };
}

const agencyStyles: Record<string, string> = {
  NHTSA: 'bg-blue-100 text-blue-800',
  CPSC: 'bg-green-100 text-green-800',
  FDA: 'bg-purple-100 text-purple-800',
  FSIS: 'bg-orange-100 text-orange-800',
};

export default async function RecallsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; q?: string }>;
}) {
  const params = await searchParams;
  const [recalls, stats] = await Promise.all([
    getRecalls(params.type, params.q),
    getRecallStats(),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Recalls & Safety</h1>
        <p className="mt-2 text-gray-600">
          Search vehicle, product, and food recalls. Verify with the issuing agency for the most current information.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg border text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.vehicle}</div>
          <div className="text-sm text-gray-500">Vehicle</div>
        </div>
        <div className="bg-white p-4 rounded-lg border text-center">
          <div className="text-2xl font-bold text-green-600">{stats.product}</div>
          <div className="text-sm text-gray-500">Product</div>
        </div>
        <div className="bg-white p-4 rounded-lg border text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.food}</div>
          <div className="text-sm text-gray-500">Food</div>
        </div>
        <div className="bg-white p-4 rounded-lg border text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Total</div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <SearchBox
          placeholder="Search recalls by product name, brand, or description..."
          paramName="q"
          className="max-w-xl"
        />
      </div>

      {/* Type Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <a
          href="/recalls"
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            !params.type ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          All Recalls
        </a>
        {RECALL_TYPES.map(type => (
          <a
            key={type.id}
            href={`/recalls?type=${type.id}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              params.type === type.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {type.label}
          </a>
        ))}
      </div>

      {/* Info Notice */}
      <Notice type="info" className="mb-6">
        Always verify recall information directly with the issuing agency. Follow the remedy
        instructions provided by the manufacturer.
      </Notice>

      {/* Recalls List */}
      <div className="space-y-4">
        {recalls.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No recalls found matching your criteria.
          </div>
        ) : (
          recalls.map(recall => (
            <article
              key={recall.id}
              className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded ${
                        agencyStyles[recall.agency] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {recall.agency}
                    </span>
                    <span className="text-xs text-gray-500">
                      {format(new Date(recall.publishedAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <h2 className="font-medium text-gray-900 mb-1">{recall.title}</h2>
                  {recall.affected && (
                    <p className="text-sm text-gray-600">
                      <strong>Affected:</strong> {recall.affected}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">ID: {recall.recallId}</p>
                </div>
                <a
                  href={recall.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 text-sm hover:underline whitespace-nowrap"
                >
                  Details →
                </a>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Agency Links */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Official Recall Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="https://www.nhtsa.gov/recalls"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 bg-white rounded-lg border hover:border-blue-300 transition-colors"
          >
            <h3 className="font-semibold text-blue-800">NHTSA</h3>
            <p className="text-sm text-gray-500">Vehicle safety recalls</p>
          </a>
          <a
            href="https://www.cpsc.gov/Recalls"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 bg-white rounded-lg border hover:border-blue-300 transition-colors"
          >
            <h3 className="font-semibold text-green-800">CPSC</h3>
            <p className="text-sm text-gray-500">Consumer product recalls</p>
          </a>
          <a
            href="https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 bg-white rounded-lg border hover:border-blue-300 transition-colors"
          >
            <h3 className="font-semibold text-purple-800">FDA</h3>
            <p className="text-sm text-gray-500">Food, drug, and medical device recalls</p>
          </a>
        </div>
      </div>
    </div>
  );
}
