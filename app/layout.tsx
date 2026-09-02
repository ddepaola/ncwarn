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
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-N29DHB3TTX"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-N29DHB3TTX');
            `,
          }}
        />
        <meta name="google-adsense-account" content="ca-pub-6847336836463917" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6847336836463917"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-gray-50">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded z-50"
        >
          Skip to main content
        </a>

        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-2xl font-bold text-slate-900">NCWarn</span>
                <span className="hidden sm:inline text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">
                  WARN Act Notices
                </span>
              </Link>

              <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
                <Link href="/states/north-carolina/warn" className="text-slate-600 hover:text-blue-600 transition-colors font-medium">
                  All Notices
                </Link>
                <Link href="/states/north-carolina/warn/counties" className="text-slate-600 hover:text-blue-600 transition-colors">
                  By County
                </Link>
                <Link href="/states/north-carolina/warn/companies" className="text-slate-600 hover:text-blue-600 transition-colors">
                  By Company
                </Link>
                <Link href="/guides/what-is-a-warn-notice" className="text-slate-600 hover:text-blue-600 transition-colors">
                  Learn
                </Link>
                <Link href="/alerts" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-500 transition-colors">
                  Get Alerts
                </Link>
              </nav>
            </div>
          </div>

          {/* Mobile nav — always visible on small screens, no JS needed */}
          <nav className="md:hidden border-t border-gray-100 overflow-x-auto" aria-label="Mobile navigation">
            <div className="flex items-center gap-1 px-4 py-2 min-w-max">
              <Link href="/states/north-carolina/warn" className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-full whitespace-nowrap hover:bg-blue-100 hover:text-blue-700 transition-colors">
                All Notices
              </Link>
              <Link href="/states/north-carolina/warn/counties" className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-full whitespace-nowrap hover:bg-blue-100 hover:text-blue-700 transition-colors">
                Counties
              </Link>
              <Link href="/states/north-carolina/warn/companies" className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-full whitespace-nowrap hover:bg-blue-100 hover:text-blue-700 transition-colors">
                Companies
              </Link>
              <Link href="/guides/what-is-a-warn-notice" className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-full whitespace-nowrap hover:bg-blue-100 hover:text-blue-700 transition-colors">
                Learn
              </Link>
              <Link href="/alerts" className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-full whitespace-nowrap hover:bg-blue-500 transition-colors">
                Alerts
              </Link>
            </div>
          </nav>
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
                  <li><Link href="/about" className="hover:text-white">About NCWarn</Link></li>
                  <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="hover:text-white">Terms of Use</Link></li>
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
