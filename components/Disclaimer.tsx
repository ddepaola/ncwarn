/**
 * Legal disclaimer component
 * Clarifies that this is an independent site summarizing public filings
 */

export function Disclaimer() {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-600">
      <p className="font-medium text-slate-700 mb-2">Disclaimer</p>
      <p>
        NCWarn.com is an independent website that aggregates and summarizes publicly available
        WARN Act (Worker Adjustment and Retraining Notification) filings. This site is not
        affiliated with, endorsed by, or operated by any government agency.
      </p>
      <p className="mt-2">
        Data is sourced from the{' '}
        <a
          href="https://www.commerce.nc.gov/data/warn-notices"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          North Carolina Department of Commerce
        </a>
        . While we strive for accuracy, information may be delayed or contain errors.
        Please verify any information directly with official sources.
      </p>
    </div>
  );
}

export function AffiliateDisclosure() {
  return (
    <p className="text-xs text-slate-500 mt-4">
      <strong>Affiliate Disclosure:</strong> Some links on this page may be affiliate links.
      If you click through and make a purchase or sign up, we may receive a small commission
      at no extra cost to you. This helps support our free service.
    </p>
  );
}

export default Disclaimer;
