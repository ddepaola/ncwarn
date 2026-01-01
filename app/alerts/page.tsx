/**
 * Email Alerts Page
 * Per project requirements: UI only, form captures email but does not process
 * Backend integration to be added later
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Disclaimer } from '@/components/Disclaimer';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Get WARN Notice Email Alerts | NCWarn.com',
  description:
    'Sign up to receive email notifications when new WARN Act layoff notices are filed in your North Carolina county.',
  openGraph: {
    title: 'Get NC WARN Notice Alerts',
    description: 'Receive email notifications for new layoff notices in your NC county.',
    url: 'https://ncwarn.com/alerts',
  },
};

async function getCounties() {
  const state = await prisma.state.findUnique({ where: { code: 'NC' } });
  if (!state) return [];

  return prisma.county.findMany({
    where: { stateId: state.id },
    select: { id: true, name: true, slug: true },
    orderBy: { name: 'asc' },
  });
}

export default async function AlertsPage() {
  const counties = await getCounties();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Email Alerts' },
        ]}
      />

      <h1 className="text-3xl font-bold text-slate-900 mb-4">
        Get WARN Notice Email Alerts
      </h1>
      <p className="text-lg text-slate-600 mb-8">
        Stay informed about layoffs in your area. Receive notifications when new WARN notices are
        filed in your North Carolina county.
      </p>

      {/* Sign Up Form */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Sign Up for Alerts</h2>

        <form className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              placeholder="your@email.com"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            />
          </div>

          <div>
            <label htmlFor="county" className="block text-sm font-medium text-slate-700 mb-1">
              County (Optional)
            </label>
            <select
              id="county"
              name="county"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white"
            >
              <option value="">All NC Counties</option>
              {counties.map((county) => (
                <option key={county.id} value={county.slug}>
                  {county.name} County
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1">
              Leave blank to receive alerts for all counties
            </p>
          </div>

          <div>
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                name="frequency"
                defaultChecked
                className="mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-600">
                Send me a digest (daily or weekly) instead of immediate notifications
              </span>
            </label>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-500 transition-colors"
          >
            Sign Up for Alerts
          </button>

          <p className="text-xs text-slate-500 text-center">
            We&apos;ll never share your email. Unsubscribe anytime.
          </p>
        </form>

        {/* Coming Soon Notice */}
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> Email alerts are coming soon. For now, bookmark this page or
            follow us for updates when this feature launches.
          </p>
        </div>
      </div>

      {/* What You'll Get */}
      <div className="bg-slate-50 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">What You&apos;ll Receive</h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <div className="font-medium text-slate-900">New Notice Alerts</div>
              <div className="text-sm text-slate-600">
                Get notified when new WARN notices are filed
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <div className="font-medium text-slate-900">County Filtering</div>
              <div className="text-sm text-slate-600">
                Only receive alerts relevant to your area
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <div className="font-medium text-slate-900">Digest Options</div>
              <div className="text-sm text-slate-600">
                Choose immediate or daily/weekly summaries
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <div className="font-medium text-slate-900">Free Forever</div>
              <div className="text-sm text-slate-600">
                No cost, no premium tiers, just useful alerts
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Browse Meanwhile */}
      <div className="text-center py-6 border-t border-slate-200">
        <p className="text-slate-600 mb-4">
          In the meantime, browse the latest WARN notices:
        </p>
        <Link
          href="/states/north-carolina/warn"
          className="inline-block bg-slate-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-slate-800 transition-colors"
        >
          View NC WARN Notices →
        </Link>
      </div>

      <div className="mt-8">
        <Disclaimer />
      </div>
    </div>
  );
}
