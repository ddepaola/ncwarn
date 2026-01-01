import { prisma } from '@/lib/db';
import { generateMetadata as genMeta } from '@/lib/seo';
import AlertBadge from '@/components/AlertBadge';
import Notice from '@/components/Notice';
import { format } from 'date-fns';

export const metadata = genMeta({
  title: 'AMBER Alerts',
  description: 'Active AMBER Alerts for North Carolina. AMBER Alert is a program to help find abducted children.',
  path: '/amber',
});

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every minute

async function getAmberAlerts() {
  const alerts = await prisma.amberAlert.findMany({
    orderBy: { issuedAt: 'desc' },
    take: 50,
  });

  const active = alerts.filter(a => a.status === 'active');
  const resolved = alerts.filter(a => a.status !== 'active');

  return { active, resolved };
}

export default async function AmberPage() {
  const { active, resolved } = await getAmberAlerts();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">AMBER Alerts</h1>
        <p className="mt-2 text-gray-600">
          America's Missing: Broadcast Emergency Response alerts for North Carolina.
        </p>
      </div>

      {/* Active Alerts */}
      {active.length > 0 ? (
        <div className="mb-8">
          <div className="bg-red-600 text-white rounded-t-lg px-4 py-3 font-semibold flex items-center gap-2">
            <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            ACTIVE AMBER ALERTS ({active.length})
          </div>
          <div className="border border-t-0 border-red-200 rounded-b-lg divide-y divide-red-100">
            {active.map(alert => (
              <div key={alert.id} className="p-6 bg-red-50">
                <h2 className="text-xl font-bold text-red-900 mb-2">{alert.title}</h2>
                {alert.description && (
                  <p className="text-red-800 mb-4 whitespace-pre-wrap">{alert.description}</p>
                )}
                <div className="flex flex-wrap gap-4 text-sm text-red-700">
                  <span>Issued: {format(new Date(alert.issuedAt), 'MMM d, yyyy h:mm a')}</span>
                  {alert.region && <span>Region: {alert.region}</span>}
                  <span>Case ID: {alert.caseId}</span>
                </div>
                <a
                  href={alert.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block text-red-600 underline hover:text-red-800"
                >
                  View Full Alert →
                </a>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center mb-8">
          <svg className="w-16 h-16 mx-auto text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <h2 className="text-xl font-semibold text-green-800">No Active AMBER Alerts</h2>
          <p className="text-green-600 mt-2">
            There are currently no active AMBER Alerts for North Carolina.
          </p>
        </div>
      )}

      {/* What is AMBER */}
      <div className="bg-white rounded-lg border p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">What is an AMBER Alert?</h2>
        <p className="text-gray-700 mb-4">
          AMBER (America's Missing: Broadcast Emergency Response) Alert is a program that sends
          urgent bulletins about abducted children. The alerts are broadcast through radio, TV,
          road signs, and mobile devices.
        </p>
        <h3 className="font-semibold text-gray-900 mb-2">Criteria for AMBER Alert Activation:</h3>
        <ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
          <li>Law enforcement confirms a child has been abducted</li>
          <li>Child is 17 years old or younger</li>
          <li>Law enforcement believes child is in imminent danger</li>
          <li>There is enough descriptive information about the child and/or abductor</li>
        </ul>
      </div>

      {/* What to do */}
      <Notice type="info" title="If You See Something" className="mb-8">
        <p className="mb-2">If you see a child or vehicle matching an AMBER Alert description:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li><strong>Call 911 immediately</strong></li>
          <li>Do not approach the suspect or try to intervene</li>
          <li>Note the location, direction of travel, and license plate if possible</li>
          <li>Provide as much detail as you can to the dispatcher</li>
        </ol>
      </Notice>

      {/* Recent Resolved Alerts */}
      {resolved.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recently Resolved</h2>
          <div className="space-y-4">
            {resolved.slice(0, 5).map(alert => (
              <div key={alert.id} className="bg-gray-50 rounded-lg border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded mb-2">
                      Resolved
                    </span>
                    <h3 className="font-medium text-gray-900">{alert.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Issued: {format(new Date(alert.issuedAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resources */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <a
          href="https://www.missingkids.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="p-4 bg-white rounded-lg border hover:border-blue-300 hover:shadow transition-all"
        >
          <h3 className="font-semibold text-gray-900">National Center for Missing Children</h3>
          <p className="text-sm text-gray-500">Report missing children or tips</p>
        </a>
        <a
          href="https://www.ncdoj.gov/amber-alert/"
          target="_blank"
          rel="noopener noreferrer"
          className="p-4 bg-white rounded-lg border hover:border-blue-300 hover:shadow transition-all"
        >
          <h3 className="font-semibold text-gray-900">NC DOJ AMBER Alert Program</h3>
          <p className="text-sm text-gray-500">Official NC AMBER Alert information</p>
        </a>
      </div>
    </div>
  );
}
