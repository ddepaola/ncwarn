import { prisma } from '@/lib/db';
import { generateMetadata as genMeta } from '@/lib/seo';
import { SCAM_CATEGORIES } from '@/lib/sources/scams';
import Notice from '@/components/Notice';
import { format } from 'date-fns';

export const metadata = genMeta({
  title: 'Scam Alerts',
  description: 'Latest scam alerts and consumer warnings for North Carolina from the NC Department of Justice.',
  path: '/scams',
});

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

async function getScamAlerts() {
  const alerts = await prisma.scamAlert.findMany({
    orderBy: { publishedAt: 'desc' },
    take: 100,
  });

  // Group by category
  const byCategory: Record<string, typeof alerts> = {};
  for (const alert of alerts) {
    const cat = alert.category || 'general';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(alert);
  }

  return { alerts, byCategory };
}

const categoryConfig: Record<string, { icon: string; color: string; bgColor: string; borderColor: string }> = {
  phone: { icon: '📞', color: 'text-purple-700', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
  email: { icon: '📧', color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  identity: { icon: '🪪', color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
  tax: { icon: '💰', color: 'text-green-700', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
  healthcare: { icon: '🏥', color: 'text-pink-700', bgColor: 'bg-pink-50', borderColor: 'border-pink-200' },
  utility: { icon: '⚡', color: 'text-yellow-700', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
  government: { icon: '🏛️', color: 'text-indigo-700', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200' },
  online: { icon: '🌐', color: 'text-cyan-700', bgColor: 'bg-cyan-50', borderColor: 'border-cyan-200' },
  senior: { icon: '👴', color: 'text-orange-700', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
  general: { icon: '⚠️', color: 'text-gray-700', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' },
};

export default async function ScamsPage() {
  const { alerts, byCategory } = await getScamAlerts();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Scam Alerts</h1>
        <p className="mt-2 text-gray-600">
          Stay informed about scams targeting North Carolina residents. Report scams to protect your community.
        </p>
      </div>

      {/* Warning Banner */}
      <div className="bg-red-600 text-white rounded-lg p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="text-4xl">🚨</div>
          <div>
            <h2 className="text-xl font-bold mb-2">Protect Yourself from Scams</h2>
            <ul className="space-y-1 text-red-100">
              <li>• Government agencies will <strong>NEVER</strong> call demanding immediate payment</li>
              <li>• Never give personal information to unsolicited callers or emails</li>
              <li>• Verify requests by calling organizations directly using official numbers</li>
              <li>• If it sounds too good to be true, it probably is</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Category Grid */}
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Browse by Category</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        {SCAM_CATEGORIES.map(cat => {
          const config = categoryConfig[cat.id] || categoryConfig.general;
          const count = byCategory[cat.id]?.length || 0;
          return (
            <a
              key={cat.id}
              href={`#${cat.id}`}
              className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4 text-center hover:shadow-md transition-shadow`}
            >
              <div className="text-3xl mb-2">{config.icon}</div>
              <div className={`font-medium ${config.color}`}>{cat.label}</div>
              <div className="text-sm text-gray-500">{count} alert{count !== 1 ? 's' : ''}</div>
            </a>
          );
        })}
      </div>

      {/* Latest Alerts */}
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Latest Scam Alerts</h2>
      <div className="space-y-4">
        {alerts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <div className="text-4xl mb-4">🛡️</div>
            <p className="text-gray-500">No scam alerts to display. Check back later.</p>
          </div>
        ) : (
          alerts.map(alert => {
            const config = categoryConfig[alert.category || 'general'] || categoryConfig.general;
            return (
              <article
                key={alert.id}
                id={alert.category || 'general'}
                className={`${config.bgColor} ${config.borderColor} border rounded-lg p-6 hover:shadow-md transition-shadow`}
              >
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  <div className="flex-shrink-0 text-4xl">{config.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.color} ${config.borderColor} border`}>
                        {alert.category ? alert.category.charAt(0).toUpperCase() + alert.category.slice(1) : 'General'}
                      </span>
                      <span className="text-sm text-gray-500">
                        {format(new Date(alert.publishedAt), 'MMMM d, yyyy')}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{alert.title}</h3>
                    {alert.summary && (
                      <p className="text-gray-700 mb-4 leading-relaxed">{alert.summary}</p>
                    )}
                    <a
                      href={alert.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-600 font-medium hover:text-blue-800 transition-colors"
                    >
                      Read full alert
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Report Scam Section */}
      <div className="mt-12 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-4">Report a Scam</h2>
        <p className="text-blue-100 mb-6 text-lg">
          If you have encountered a scam or suspect fraud, report it to help protect others in your community.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="https://www.ncdoj.gov/file-a-complaint/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 bg-white rounded-lg hover:bg-blue-50 transition-colors group"
          >
            <div>
              <div className="font-bold text-gray-900">NC Attorney General</div>
              <div className="text-sm text-gray-600">File a consumer complaint</div>
            </div>
            <svg className="w-6 h-6 text-blue-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
          <a
            href="https://reportfraud.ftc.gov/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 bg-white rounded-lg hover:bg-blue-50 transition-colors group"
          >
            <div>
              <div className="font-bold text-gray-900">FTC Report Fraud</div>
              <div className="text-sm text-gray-600">Report to Federal Trade Commission</div>
            </div>
            <svg className="w-6 h-6 text-blue-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>

      {/* Helpful Resources */}
      <div className="mt-8 bg-white rounded-lg border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Helpful Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="https://consumer.ftc.gov/scams"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 border rounded-lg hover:border-blue-300 hover:shadow transition-all"
          >
            <div className="font-medium text-gray-900">FTC Scam Prevention</div>
            <div className="text-sm text-gray-500">Learn how to recognize and avoid scams</div>
          </a>
          <a
            href="https://www.ic3.gov/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 border rounded-lg hover:border-blue-300 hover:shadow transition-all"
          >
            <div className="font-medium text-gray-900">FBI IC3</div>
            <div className="text-sm text-gray-500">Internet Crime Complaint Center</div>
          </a>
          <a
            href="https://www.aarp.org/money/scams-fraud/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 border rounded-lg hover:border-blue-300 hover:shadow transition-all"
          >
            <div className="font-medium text-gray-900">AARP Fraud Watch</div>
            <div className="text-sm text-gray-500">Resources for seniors</div>
          </a>
        </div>
      </div>

      {/* Source */}
      <div className="mt-8 text-center text-sm text-gray-500">
        Alerts sourced from the{' '}
        <a
          href="https://www.ncdoj.gov/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          NC Department of Justice
        </a>
      </div>
    </div>
  );
}
