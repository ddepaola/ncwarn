import { prisma } from '@/lib/db';
import { generateMetadata as genMeta } from '@/lib/seo';
import KpiCard from '@/components/KpiCard';
import Notice from '@/components/Notice';
import { format } from 'date-fns';

export const metadata = genMeta({
  title: 'Power Outages',
  description: 'Current power outage information for North Carolina from Duke Energy, Dominion Energy, and electric cooperatives.',
  path: '/outages',
});

export const dynamic = 'force-dynamic';
export const revalidate = 300; // Revalidate every 5 minutes

async function getOutageData() {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const outages = await prisma.outage.findMany({
    where: {
      reportedAt: { gte: twentyFourHoursAgo },
    },
    include: {
      county: {
        select: { name: true, slug: true },
      },
    },
    orderBy: { customersOut: 'desc' },
  });

  // Aggregate by utility
  const byUtility: Record<string, number> = {};
  const byCounty: Record<string, { name: string; count: number }> = {};
  let totalOut = 0;

  for (const outage of outages) {
    totalOut += outage.customersOut;
    byUtility[outage.utility] = (byUtility[outage.utility] || 0) + outage.customersOut;

    const slug = outage.county.slug;
    if (!byCounty[slug]) {
      byCounty[slug] = { name: outage.county.name, count: 0 };
    }
    byCounty[slug].count += outage.customersOut;
  }

  // Sort counties by outage count
  const topCounties = Object.entries(byCounty)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10);

  return {
    totalOut,
    byUtility,
    topCounties,
    outages,
    lastUpdated: outages[0]?.reportedAt || new Date(),
  };
}

export default async function OutagesPage() {
  const { totalOut, byUtility, topCounties, outages, lastUpdated } = await getOutageData();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Power Outages</h1>
            <p className="mt-2 text-gray-600">
              Current power outage status across North Carolina utilities.
            </p>
          </div>
          <div className="text-sm text-gray-500">
            Last updated: {format(new Date(lastUpdated), 'h:mm a')}
          </div>
        </div>
      </div>

      {/* Total Outages */}
      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg p-6 mb-8">
        <div className="text-center">
          <div className="text-5xl font-bold">{totalOut.toLocaleString()}</div>
          <div className="text-xl mt-2">Customers Currently Without Power</div>
        </div>
      </div>

      {/* By Utility */}
      <h2 className="text-xl font-semibold text-gray-900 mb-4">By Utility</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {Object.entries(byUtility).map(([utility, count]) => (
          <KpiCard
            key={utility}
            title={utility}
            value={count.toLocaleString()}
            subtitle="Customers affected"
            variant={count > 10000 ? 'danger' : count > 1000 ? 'warning' : 'default'}
          />
        ))}
        {Object.keys(byUtility).length === 0 && (
          <div className="col-span-3 text-center py-8 text-gray-500">
            No current outage data available
          </div>
        )}
      </div>

      {/* By County */}
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Most Affected Counties</h2>
      {topCounties.length > 0 ? (
        <div className="bg-white rounded-lg border overflow-hidden mb-8">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">County</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Customers Out</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {topCounties.map(([slug, data]) => (
                <tr key={slug} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900">{data.name} County</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {data.count.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center mb-8">
          <p className="text-green-800">No significant outages reported at this time.</p>
        </div>
      )}

      {/* Safety Information */}
      <Notice type="warning" title="Power Outage Safety" className="mb-8">
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>Never use generators, grills, or camp stoves indoors</li>
          <li>Keep refrigerator and freezer doors closed</li>
          <li>Use flashlights instead of candles to prevent fires</li>
          <li>Disconnect appliances to avoid damage from power surges</li>
          <li>Check on elderly neighbors and those with medical needs</li>
        </ul>
      </Notice>

      {/* Report Links */}
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Report an Outage</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <a
          href="https://www.duke-energy.com/outages/report-outage"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors group"
        >
          <div>
            <div className="font-bold text-lg">Duke Energy</div>
            <div className="text-blue-100 text-sm">Report or check outage status</div>
          </div>
          <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
        <a
          href="https://www.dominionenergy.com/outages/report-outage"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors group"
        >
          <div>
            <div className="font-bold text-lg">Dominion Energy</div>
            <div className="text-green-100 text-sm">Report or check outage status</div>
          </div>
          <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
        <a
          href="https://www.electriccooperative.com/outage"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors group"
        >
          <div>
            <div className="font-bold text-lg">NC Electric Co-ops</div>
            <div className="text-purple-100 text-sm">Find your local cooperative</div>
          </div>
          <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>

      {/* Source */}
      <div className="mt-8 text-center text-sm text-gray-500">
        Data aggregated from utility outage maps. For the most current information, check your
        utility provider directly.
      </div>
    </div>
  );
}
