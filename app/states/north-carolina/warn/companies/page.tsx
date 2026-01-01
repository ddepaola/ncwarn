/**
 * Companies Index Page
 * Lists all companies with NC WARN notices
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Disclaimer } from '@/components/Disclaimer';

export const metadata: Metadata = {
  title: 'NC WARN Notices by Company | NCWarn.com',
  description:
    'Browse WARN Act layoff notices by company in North Carolina. Search companies with workforce reductions.',
  openGraph: {
    title: 'North Carolina WARN Notices by Company',
    description: 'Browse layoff notices by company. Find companies with workforce reductions in NC.',
    url: 'https://ncwarn.com/states/north-carolina/warn/companies',
  },
};

export const revalidate = 3600;

interface SearchParams {
  letter?: string;
}

async function getCompanies(letter?: string) {
  const state = await prisma.state.findUnique({ where: { code: 'NC' } });
  if (!state) return { companies: [], letters: [] };

  // Get all companies with NC notices
  const companies = await prisma.company.findMany({
    where: {
      notices: {
        some: { stateId: state.id },
      },
    },
    include: {
      _count: {
        select: { notices: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  // Get available first letters
  const letters = [...new Set(companies.map((c) => c.name.charAt(0).toUpperCase()))].sort();

  // Filter by letter if specified
  const filtered = letter
    ? companies.filter((c) => c.name.charAt(0).toUpperCase() === letter.toUpperCase())
    : companies;

  return { companies: filtered, letters, allCount: companies.length };
}

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { companies, letters, allCount } = await getCompanies(searchParams.letter);
  const currentLetter = searchParams.letter?.toUpperCase();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'North Carolina', href: '/states/north-carolina' },
          { label: 'WARN Notices', href: '/states/north-carolina/warn' },
          { label: 'Companies' },
        ]}
      />

      <h1 className="text-3xl font-bold text-slate-900 mb-2">
        WARN Notices by Company
      </h1>
      <p className="text-lg text-slate-600 mb-8">
        {allCount} companies with WARN notices in North Carolina
      </p>

      {/* Letter Filter */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-1">
          <Link
            href="/states/north-carolina/warn/companies"
            className={`px-3 py-1 rounded text-sm ${
              !currentLetter
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            All
          </Link>
          {letters.map((letter) => (
            <Link
              key={letter}
              href={`/states/north-carolina/warn/companies?letter=${letter}`}
              className={`px-3 py-1 rounded text-sm ${
                currentLetter === letter
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {letter}
            </Link>
          ))}
        </div>
      </div>

      {/* Companies Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {companies.map((company) => (
          <Link
            key={company.id}
            href={`/states/north-carolina/warn/companies/${company.slug}`}
            className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="font-medium text-slate-900 line-clamp-2">{company.name}</div>
            <div className="text-sm text-slate-500 mt-1">
              {company._count.notices} {company._count.notices === 1 ? 'notice' : 'notices'}
            </div>
          </Link>
        ))}
      </div>

      {companies.length === 0 && (
        <div className="bg-slate-50 rounded-lg p-8 text-center">
          <p className="text-slate-600">
            No companies found{currentLetter ? ` starting with "${currentLetter}"` : ''}.
          </p>
        </div>
      )}

      <div className="mt-12">
        <Disclaimer />
      </div>
    </div>
  );
}
