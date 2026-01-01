import Link from 'next/link';
import type { Metadata } from 'next';
import { generateMetadata } from '@/lib/seo';
import '@/styles/globals.css';

export const metadata: Metadata = generateMetadata();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-gray-50">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded z-50"
        >
          Skip to main content
        </a>

        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-2xl font-bold text-slate-900">NCWarn</span>
                <span className="hidden sm:inline text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">
                  WARN Act Notices
                </span>
              </Link>

              <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
                <Link
                  href="/states/north-carolina/warn"
                  className="text-slate-600 hover:text-blue-600 transition-colors font-medium"
                >
                  All Notices
                </Link>
                <Link
                  href="/states/north-carolina/warn/counties"
                  className="text-slate-600 hover:text-blue-600 transition-colors"
                >
                  By County
                </Link>
                <Link
                  href="/states/north-carolina/warn/companies"
                  className="text-slate-600 hover:text-blue-600 transition-colors"
                >
                  By Company
                </Link>
                <Link
                  href="/guides/what-is-a-warn-notice"
                  className="text-slate-600 hover:text-blue-600 transition-colors"
                >
                  Learn
                </Link>
                <Link
                  href="/alerts"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-500 transition-colors"
                >
                  Get Alerts
                </Link>
              </nav>

              <button
                type="button"
                className="md:hidden p-2 text-slate-600"
                aria-label="Open menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        <main id="main-content" className="flex-1">
          {children}
        </main>

        <footer className="bg-slate-900 text-white py-12 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <h3 className="font-semibold mb-4">Browse Notices</h3>
                <ul className="space-y-2 text-slate-400">
                  <li><Link href="/states/north-carolina/warn" className="hover:text-white">All NC Notices</Link></li>
                  <li><Link href="/states/north-carolina/warn/counties" className="hover:text-white">By County</Link></li>
                  <li><Link href="/states/north-carolina/warn/companies" className="hover:text-white">By Company</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Resources</h3>
                <ul className="space-y-2 text-slate-400">
                  <li><Link href="/guides/what-is-a-warn-notice" className="hover:text-white">What is a WARN Notice?</Link></li>
                  <li><Link href="/guides/what-to-do-after-a-layoff-in-nc" className="hover:text-white">After a Layoff</Link></li>
                  <li><Link href="/alerts" className="hover:text-white">Email Alerts</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Official Sources</h3>
                <ul className="space-y-2 text-slate-400">
                  <li>
                    <a
                      href="https://www.commerce.nc.gov/jobs-training/warn-notices"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white"
                    >
                      NC Commerce WARN
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.dol.gov/agencies/eta/layoffs/warn"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white"
                    >
                      US DOL WARN Act
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://des.nc.gov/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white"
                    >
                      NC Unemployment (DES)
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4">About</h3>
                <ul className="space-y-2 text-slate-400">
                  <li className="text-sm">
                    NCWarn.com provides free access to NC WARN Act layoff notices to help workers stay informed.
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-slate-800 text-center text-slate-400 text-sm">
              <p>&copy; {new Date().getFullYear()} NCWarn.com. All rights reserved.</p>
              <p className="mt-2">
                Data sourced from the NC Department of Commerce. This is an unofficial resource.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
