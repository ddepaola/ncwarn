import { generateMetadata as genMeta } from '@/lib/seo';

export const metadata = genMeta({
  title: 'About NCWarn.com',
  description: 'About NCWarn.com - Free searchable database of WARN Act layoff notices filed in North Carolina. Track plant closings and mass layoffs by company, county, and date.',
  path: '/about',
});

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">About NCWarn.com</h1>

      <div className="prose prose-lg prose-slate max-w-none">
        <p>
          NCWarn.com is a free public resource that tracks WARN Act layoff notices filed in
          North Carolina. We make it easy to search, browse, and stay informed about plant
          closings and mass layoffs affecting workers across the state.
        </p>

        <h2>What We Track</h2>
        <p>
          We track Worker Adjustment and Retraining Notification (WARN) Act notices filed with
          the NC Department of Commerce. These notices are required by federal law when employers
          with 100+ employees plan a plant closing or mass layoff affecting 50 or more workers.
        </p>
        <p>Our database lets you:</p>
        <ul>
          <li>Browse all NC WARN notices by date, company, or county</li>
          <li>See how many workers are affected by each layoff</li>
          <li>Track layoff trends across North Carolina counties</li>
          <li>Sign up for email alerts when new notices are filed</li>
        </ul>

        <h2>Data Sources</h2>
        <p>
          All WARN Act data on NCWarn.com is sourced from the North Carolina Department of
          Commerce, which publishes official WARN notice reports. We aggregate this publicly
          available information and present it in a searchable, user-friendly format. For the
          most authoritative and up-to-date information, we encourage users to verify with the{' '}
          <a href="https://www.commerce.nc.gov/jobs-training/warn-notices" target="_blank" rel="noopener noreferrer">
            official NC Commerce WARN page
          </a>.
        </p>

        <h2>Our Mission</h2>
        <p>
          We believe workers deserve easy, free access to information about layoffs that may
          affect their communities. By providing a searchable database and timely alerts, we help
          North Carolinians stay informed and prepared during workforce transitions.
        </p>

        <h2>Accessibility</h2>
        <p>
          NCWarn.com is committed to digital accessibility. We strive to meet WCAG 2.1 AA
          standards to ensure our content is available to all users, including those using
          assistive technologies.
        </p>

        <h2>Contact</h2>
        <p>
          For questions, suggestions, or to report an issue, please contact us at{' '}
          <a href="mailto:contact@ncwarn.com">contact@ncwarn.com</a>.
        </p>
      </div>
    </div>
  );
}
